import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Neon suspende o banco quando ocioso: testa a conexão antes de usar
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True, "pool_recycle": 300}

    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "chave_padrao"
    )

    DEBUG = os.getenv(
        "FLASK_DEBUG",
        "False"
    ).lower() == "true"