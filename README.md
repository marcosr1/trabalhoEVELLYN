# TecnoCaixa 📦

Sistema web de **controle de estoque e faturamento** para uma loja de informática, feito com **Flask**, **SQLAlchemy** e banco **PostgreSQL no Neon**.

## 📋 O que o sistema faz

- **Painel:** produtos cadastrados, unidades em estoque, valor do estoque e produtos que precisam de reposição
- **Faturamento:** total vendido, número de vendas, ticket médio, lucro estimado e gráfico dos últimos 7 dias
- **Produtos:** cartões com foto, busca, filtro por categoria, cadastro, edição e exclusão
- **Movimentações:** registro de entradas, vendas e saídas, com histórico

## 🛠️ Tecnologias

| Tecnologia | Uso |
|-----------|-----|
| **Flask** | Servidor web e rotas da API |
| **SQLAlchemy** | Acesso ao banco de dados |
| **PostgreSQL (Neon)** | Banco de dados na nuvem |
| **HTML, CSS e JavaScript** | Página do sistema |

## 🚀 Como rodar no computador

### 1. Criar o ambiente virtual

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Instalar as dependências

```bash
pip install -r requirements.txt
```

### 3. Configurar o `.env`

Copie `.env.example` para `.env` e coloque a sua `DATABASE_URL` do Neon:

```env
DATABASE_URL=postgresql://usuario:senha@host.neon.tech/neondb?sslmode=require&channel_binding=require
SECRET_KEY=sua_chave_secreta_aqui
FLASK_DEBUG=True
```

### 4. Executar

```bash
python app.py
```

Acesse em: `http://localhost:5000`

Na primeira execução, as tabelas são criadas sozinhas no banco e os produtos da pasta `static/Fotos` são cadastrados (veja `produtos_iniciais.py`).

## ☁️ Deploy no Render

- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn app:app`
- **Environment:** `DATABASE_URL` e `SECRET_KEY` (o `.env` não vai para o GitHub)

## 📁 Estrutura do Projeto

```
├── app.py                 # Servidor Flask: página e rotas da API
├── config.py              # Configuração (lê o .env)
├── models.py              # Tabelas do banco (Produto, Movimento)
├── produtos_iniciais.py   # Produtos cadastrados na primeira execução
├── requirements.txt       # Dependências
├── templates/
│   └── estoque.html       # Página do sistema
└── static/
    ├── style.css          # Visual
    ├── script.js          # Funcionamento da página
    └── Fotos/             # Fotos dos produtos
```

## 🔧 Rotas

| Rota | Método | Descrição |
|------|--------|-----------|
| `/` ou `/estoque` | GET | Página do controle de estoque |
| `/api/estoque` | GET | Lista produtos e movimentações |
| `/api/produtos` | POST | Cadastra produto |
| `/api/produtos/<id>` | PUT, DELETE | Edita ou exclui produto |
| `/api/movimentos` | POST | Registra entrada, venda ou saída |

## 🗃️ Tabelas do Banco

#### Produto
```
id, sku, nome, categoria, quantidade, minimo, custo, preco, local, foto
```

#### Movimento
```
id, data, produto_id, produto_nome, tipo (entrada | venda | saida),
quantidade, valor, custo_unitario, observacao
```
