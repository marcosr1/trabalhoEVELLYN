from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Departamento(db.Model):
    __tablename__ = "departamento"

    codigo = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    sigla = db.Column(db.String(10), nullable=False)

    colaboradores = db.relationship(
        "Colaborador",
        backref="departamento",
        lazy=True,
        cascade="all, delete"
    )

    def to_dict(self):
        return {
            "codigo": self.codigo,
            "nome": self.nome,
            "sigla": self.sigla
        }


class Colaborador(db.Model):
    __tablename__ = "colaborador"

    matricula = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    salario = db.Column(db.Numeric(10, 2))
    email = db.Column(db.String(150))
    endereco = db.Column(db.String(200))

    codigo_dp = db.Column(
        db.Integer,
        db.ForeignKey("departamento.codigo"),
        nullable=False
    )

    def to_dict(self):
        return {
            "matricula": self.matricula,
            "nome": self.nome,
            "salario": float(self.salario) if self.salario else None,
            "email": self.email,
            "endereco": self.endereco,
            "codigo_dp": self.codigo_dp,
            "departamento": self.departamento.nome if self.departamento else None
        }


# ---------------------------------------------------------------
# TecnoCaixa - Controle de estoque e faturamento
# ---------------------------------------------------------------

class Produto(db.Model):
    __tablename__ = "produto"

    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(20), unique=True, nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    categoria = db.Column(db.String(40), nullable=False)
    quantidade = db.Column(db.Integer, nullable=False, default=0)
    minimo = db.Column(db.Integer, nullable=False, default=0)
    custo = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    preco = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    local = db.Column(db.String(40), default="")
    foto = db.Column(db.Text, default="")  # caminho (static/Fotos/...) ou imagem em base64

    def to_dict(self):
        return {
            "id": self.id,
            "sku": self.sku,
            "nome": self.nome,
            "categoria": self.categoria,
            "quantidade": self.quantidade,
            "minimo": self.minimo,
            "custo": float(self.custo or 0),
            "preco": float(self.preco or 0),
            "local": self.local or "",
            "foto": self.foto or ""
        }


class Movimento(db.Model):
    __tablename__ = "movimento"

    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.DateTime(timezone=True), nullable=False)
    # Sem FK: o histórico é mantido mesmo se o produto for excluído
    produto_id = db.Column(db.Integer, nullable=False)
    produto_nome = db.Column(db.String(100), nullable=False)
    tipo = db.Column(db.String(10), nullable=False)  # entrada | venda | saida
    quantidade = db.Column(db.Integer, nullable=False)
    valor = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    custo_unitario = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    observacao = db.Column(db.String(120), default="")

    def to_dict(self):
        return {
            "id": self.id,
            "data": self.data.isoformat(),
            "produtoId": self.produto_id,
            "produtoNome": self.produto_nome,
            "tipo": self.tipo,
            "quantidade": self.quantidade,
            "valor": float(self.valor or 0),
            "custoUnitario": float(self.custo_unitario or 0),
            "observacao": self.observacao or ""
        }
