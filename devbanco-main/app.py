from flask import Flask, render_template, request, redirect, url_for, jsonify, send_from_directory
from datetime import datetime, timezone
from config import Config
from models import db, Departamento, Colaborador, Produto, Movimento
from produtos_iniciais import PRODUTOS_INICIAIS
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/departamentos")
def listar_departamentos():

    departamentos = Departamento.query.all()

    return render_template(
        "departamentos.html",
        departamentos=departamentos
    )


@app.route("/colaboradores")
def listar_colaboradores():

    colaboradores = Colaborador.query.all()

    return render_template(
        "colaboradores.html",
        colaboradores=colaboradores
    )

@app.route("/novo-colaborador", methods=["GET", "POST"])
def novo_colaborador():

    if request.method == "POST":

        colaborador = Colaborador(
            matricula=request.form["matricula"],
            nome=request.form["nome"],
            salario=request.form["salario"],
            email=request.form["email"],
            endereco=request.form["endereco"],
            codigo_dp=request.form["codigo_dp"]
        )
        db.session.add(colaborador)
        db.session.commit()
        
        return redirect(url_for("listar_colaboradores"))

    departamentos = Departamento.query.order_by(
        Departamento.nome
    ).all()

    return render_template(
        "novo_colaborador.html",
        departamentos=departamentos
    )

@app.route("/editar-colaborador/<int:matricula>", methods=["GET", "POST"])
def editar_colaborador(matricula):

    colaborador = Colaborador.query.get_or_404(matricula)

    if request.method == "POST":

        colaborador.nome = request.form["nome"]
        colaborador.salario = request.form["salario"]
        colaborador.email = request.form["email"]
        colaborador.endereco = request.form["endereco"]
        colaborador.codigo_dp = request.form["codigo_dp"]

        db.session.commit()

        return redirect(
            url_for("listar_colaboradores")
        )

    departamentos = Departamento.query.all()

    return render_template(
        "editar_colaborador.html",
        colaborador=colaborador,
        departamentos=departamentos
    )

@app.route("/excluir-colaborador/<int:matricula>")
def excluir_colaborador(matricula):

    colaborador = Colaborador.query.get_or_404(matricula)

    db.session.delete(colaborador)

    db.session.commit()

    return redirect(url_for("listar_colaboradores"))


# ---------------------------------------------------------------
# TecnoCaixa - Controle de estoque e faturamento
# A página /estoque usa as rotas /api/... para ler e gravar no banco.
# ---------------------------------------------------------------

# Página do controle de estoque
@app.route("/estoque")
def estoque():
    return render_template("estoque.html")


# Entrega as fotos que ficam em static/Fotos
@app.route("/Fotos/<path:arquivo>")
def fotos(arquivo):
    return send_from_directory("static/Fotos", arquivo)


# Envia todos os produtos e movimentações para a página
@app.route("/api/estoque")
def api_estoque():
    produtos = Produto.query.order_by(Produto.id).all()
    movimentos = Movimento.query.order_by(Movimento.id.desc()).all()

    return jsonify({
        "produtos": [p.to_dict() for p in produtos],
        "movimentos": [m.to_dict() for m in movimentos]
    })


# Verifica se outro produto já usa este SKU
def sku_repetido(sku, id_do_produto=None):
    for produto in Produto.query.all():
        if produto.sku.lower() == sku.lower() and produto.id != id_do_produto:
            return True
    return False


# Copia os campos do formulário para o produto
def preencher_produto(produto, dados):
    produto.sku = dados["sku"]
    produto.nome = dados["nome"]
    produto.categoria = dados["categoria"]
    produto.minimo = dados["minimo"]
    produto.custo = dados["custo"]
    produto.preco = dados["preco"]
    produto.local = dados["local"]
    produto.foto = dados["foto"]


# Cria um registro de movimentação (entrada, venda ou saída)
def registrar_movimento(produto, tipo, quantidade, observacao):
    valor = 0
    if tipo == "venda":
        valor = quantidade * produto.preco

    movimento = Movimento(
        data=datetime.now(timezone.utc),
        produto_id=produto.id,
        produto_nome=produto.nome,
        tipo=tipo,
        quantidade=quantidade,
        valor=valor,
        custo_unitario=produto.custo,
        observacao=observacao
    )
    db.session.add(movimento)


# Cadastra um produto novo
@app.route("/api/produtos", methods=["POST"])
def api_novo_produto():
    dados = request.get_json()

    if sku_repetido(dados["sku"]):
        return jsonify({"erro": "Já existe um produto com este SKU."}), 400

    produto = Produto(quantidade=dados["quantidade"])
    preencher_produto(produto, dados)
    db.session.add(produto)
    db.session.flush()  # gera o id do produto

    if produto.quantidade > 0:
        registrar_movimento(produto, "entrada", produto.quantidade, "Estoque inicial")

    db.session.commit()
    return jsonify(produto.to_dict())


# Edita um produto (a quantidade só muda por movimentação)
@app.route("/api/produtos/<int:id>", methods=["PUT"])
def api_editar_produto(id):
    produto = Produto.query.get_or_404(id)
    dados = request.get_json()

    if sku_repetido(dados["sku"], id):
        return jsonify({"erro": "Já existe um produto com este SKU."}), 400

    preencher_produto(produto, dados)
    db.session.commit()
    return jsonify(produto.to_dict())


# Exclui um produto (o histórico de movimentações é mantido)
@app.route("/api/produtos/<int:id>", methods=["DELETE"])
def api_excluir_produto(id):
    produto = Produto.query.get_or_404(id)
    db.session.delete(produto)
    db.session.commit()
    return jsonify({"ok": True})


# Registra entrada, venda ou saída e atualiza a quantidade do produto
@app.route("/api/movimentos", methods=["POST"])
def api_novo_movimento():
    dados = request.get_json()
    produto = Produto.query.get_or_404(dados["produtoId"])
    tipo = dados["tipo"]
    quantidade = int(dados["quantidade"])

    if quantidade <= 0:
        return jsonify({"erro": "Informe uma quantidade maior que zero."}), 400

    if tipo == "entrada":
        produto.quantidade = produto.quantidade + quantidade
    else:
        if quantidade > produto.quantidade:
            return jsonify({"erro": f"Quantidade maior que o estoque disponível ({produto.quantidade} un.)."}), 400
        produto.quantidade = produto.quantidade - quantidade

    registrar_movimento(produto, tipo, quantidade, dados["observacao"])
    db.session.commit()
    return jsonify(produto.to_dict())


# Na primeira execução: cria as tabelas no banco (Neon)
# e cadastra os produtos da pasta Fotos
with app.app_context():
    db.create_all()

    if Produto.query.count() == 0:
        for item in PRODUTOS_INICIAIS:
            db.session.add(Produto(**item))
        db.session.commit()

if __name__ == "__main__":
    app.run(debug=True)
