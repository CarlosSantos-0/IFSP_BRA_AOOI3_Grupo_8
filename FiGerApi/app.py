import math
import os
import re
import sqlite3
from datetime import date, datetime, timedelta
from functools import wraps

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    verify_jwt_in_request,
)
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event, func
from sqlalchemy.engine import Engine
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
CORS(app)

# O banco mudou de formato (usuário, categoria, forma de pagamento...), então usa um arquivo novo.
# O figer.db antigo não é mais lido. Para PostgreSQL, defina FIGER_DATABASE_URL.
database_url = os.environ.get('FIGER_DATABASE_URL')
jwt_secret = os.environ.get('FIGER_JWT_SECRET')

if os.environ.get('VERCEL') == '1':
    if not database_url:
        raise RuntimeError('Configure FIGER_DATABASE_URL com a URL do banco PostgreSQL.')
    if not jwt_secret:
        raise RuntimeError('Configure FIGER_JWT_SECRET com uma chave secreta forte.')

if database_url and database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url or 'sqlite:///figer_v2.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = jwt_secret or 'chave-de-desenvolvimento-troque-em-producao'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=12)

db = SQLAlchemy(app)
jwt = JWTManager(app)


@event.listens_for(Engine, 'connect')
def ativar_chaves_estrangeiras(conexao, _registro):
    # O SQLite ignora chaves estrangeiras por padrão; aqui elas passam a valer.
    if isinstance(conexao, sqlite3.Connection):
        cursor = conexao.cursor()
        cursor.execute('PRAGMA foreign_keys=ON')
        cursor.close()


def erro(mensagem, status):
    return jsonify({"erro": mensagem}), status


@jwt.unauthorized_loader
def token_ausente(_motivo):
    return erro('É preciso fazer login.', 401)


@jwt.invalid_token_loader
def token_invalido(_motivo):
    return erro('Sessão inválida. Entre novamente.', 401)


@jwt.expired_token_loader
def token_expirado(_cabecalho, _dados):
    return erro('Sessão expirada. Entre novamente.', 401)


# ---------------------------------------------------------------------------
# Modelos (nomes de tabelas e colunas seguem a modelagem do BD do grupo)
# ---------------------------------------------------------------------------
class Usuario(db.Model):
    __tablename__ = 'usuario'

    id_usuario = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(45), nullable=False)
    email = db.Column(db.String(150), nullable=False, unique=True)
    data_cadastro = db.Column(db.Date, nullable=False, default=date.today)
    senha_hash = db.Column(db.String(255), nullable=False)

    def to_dict(self):
        return {
            "id": self.id_usuario,
            "nome": self.nome,
            "email": self.email,
            "data_cadastro": self.data_cadastro.isoformat(),
        }


class Categoria(db.Model):
    """Categorias são compartilhadas por todos os usuários."""
    __tablename__ = 'categoria'

    id_categoria = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(30), nullable=False, unique=True)
    cor = db.Column(db.String(7), nullable=False, default='#2563eb')

    def to_dict(self, movimentacoes_mes=0):
        return {
            "id": self.id_categoria,
            "nome": self.nome,
            "cor": self.cor,
            "movimentacoes_mes": movimentacoes_mes,
        }


class FormaPagamento(db.Model):
    __tablename__ = 'formapagamento'

    id_formpag = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(30), nullable=False, unique=True)

    def to_dict(self):
        return {"id": self.id_formpag, "nome": self.nome}


class Movimentacao(db.Model):
    __tablename__ = 'movimentacao'

    id_mov = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(15), nullable=False)  # 'entrada' ou 'saida'
    valor = db.Column(db.Numeric(12, 2, asdecimal=False), nullable=False)
    data_mov = db.Column(db.Date, nullable=False, default=date.today)
    descricao = db.Column(db.String(150))
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'), nullable=False)
    id_categoria = db.Column(db.Integer, db.ForeignKey('categoria.id_categoria'), nullable=False)
    id_formpag = db.Column(db.Integer, db.ForeignKey('formapagamento.id_formpag'))

    categoria = db.relationship('Categoria')
    forma_pagamento = db.relationship('FormaPagamento')

    def to_dict(self):
        # Mantém o formato que o front já usa ("categoria" continua sendo o nome)
        return {
            "id": self.id_mov,
            "descricao": self.descricao,
            "categoria": self.categoria.nome,
            "id_categoria": self.id_categoria,
            "data": self.data_mov.isoformat(),
            "tipo": self.tipo,
            "valor": float(self.valor),
            "forma_pagamento": self.forma_pagamento.nome if self.forma_pagamento else None,
            "id_formpag": self.id_formpag,
        }


class TokenRecuperacao(db.Model):
    """Reservada para a recuperação de senha (ainda sem rotas)."""
    __tablename__ = 'tokenrecuperacao'

    id_token = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'), nullable=False)
    token_hash = db.Column(db.String(64), nullable=False, unique=True)
    data_expiracao = db.Column(db.DateTime, nullable=False)
    foi_utilizado = db.Column(db.Boolean, nullable=False, default=False)


# ---------------------------------------------------------------------------
# Dados iniciais
# ---------------------------------------------------------------------------
CATEGORIAS_PADRAO = [
    ('Renda', '#2563eb'),
    ('Comida', '#7c3aed'),
    ('Transporte', '#db2777'),
    ('Moradia', '#ea580c'),
    ('Lazer', '#0891b2'),
    ('Outros', '#65a30d'),
]
FORMAS_PAGAMENTO_PADRAO = ['Pix', 'Cartão', 'Dinheiro']
CATEGORIA_RENDA = 'Renda'  # não entra no resumo de gastos


def popular_dados_iniciais():
    if Categoria.query.count() == 0:
        for nome, cor in CATEGORIAS_PADRAO:
            db.session.add(Categoria(nome=nome, cor=cor))
    if FormaPagamento.query.count() == 0:
        for nome in FORMAS_PAGAMENTO_PADRAO:
            db.session.add(FormaPagamento(nome=nome))
    db.session.commit()


with app.app_context():
    db.create_all()
    popular_dados_iniciais()


# ---------------------------------------------------------------------------
# Funções de apoio
# ---------------------------------------------------------------------------
EMAIL_VALIDO = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
COR_HEX = re.compile(r'^#[0-9a-fA-F]{6}$')
TAMANHO_MAXIMO_NOME_CATEGORIA = 30
TAMANHO_MINIMO_SENHA = 8
TIPOS = ('entrada', 'saida')


def login_obrigatorio(rota):
    """Exige o token JWT e entrega o usuário logado como primeiro argumento da rota."""
    @wraps(rota)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        usuario = db.session.get(Usuario, int(get_jwt_identity()))
        if usuario is None:
            return erro('Sessão inválida. Entre novamente.', 401)
        return rota(usuario, *args, **kwargs)
    return wrapper


def para_inteiro(valor):
    try:
        return int(valor)
    except (TypeError, ValueError):
        return None


def nomes_iguais(a, b):
    return (a or '').strip().casefold() == (b or '').strip().casefold()


def limites_do_mes():
    hoje = date.today()
    inicio = date(hoje.year, hoje.month, 1)
    fim = date(hoje.year + (hoje.month == 12), hoje.month % 12 + 1, 1)
    return inicio, fim


def validar_dados_pessoais(dados, ignorar_id=None):
    """Devolve (nome, email, mensagem_de_erro, status)."""
    nome = str(dados.get('nome', '')).strip()
    email = str(dados.get('email', '')).strip().lower()

    if not nome:
        return None, None, 'Informe seu nome.', 400
    if len(nome) > 45:
        return None, None, 'O nome pode ter no máximo 45 caracteres.', 400
    if not EMAIL_VALIDO.match(email) or len(email) > 150:
        return None, None, 'Informe um e-mail válido.', 400

    existente = Usuario.query.filter(func.lower(Usuario.email) == email).first()
    if existente and existente.id_usuario != ignorar_id:
        return None, None, 'Já existe uma conta com esse e-mail.', 409

    return nome, email, None, None


def validar_senha(senha):
    if not isinstance(senha, str) or len(senha) < TAMANHO_MINIMO_SENHA:
        return f'A senha precisa ter pelo menos {TAMANHO_MINIMO_SENHA} caracteres.'
    if len(senha) > 128:
        return 'A senha pode ter no máximo 128 caracteres.'
    return None


def resposta_de_login(usuario, status=200):
    token = create_access_token(identity=str(usuario.id_usuario))
    return jsonify({"token": token, "usuario": usuario.to_dict()}), status


# ---------------------------------------------------------------------------
# Autenticação e conta
# ---------------------------------------------------------------------------
@app.route('/api/auth/register', methods=['POST'])
def register():
    dados = request.get_json(silent=True) or {}

    nome, email, mensagem, status = validar_dados_pessoais(dados)
    if mensagem:
        return erro(mensagem, status)

    senha = dados.get('senha')
    mensagem = validar_senha(senha)
    if mensagem:
        return erro(mensagem, 400)

    usuario = Usuario(nome=nome, email=email, senha_hash=generate_password_hash(senha))
    db.session.add(usuario)
    db.session.commit()

    return resposta_de_login(usuario, 201)


@app.route('/api/auth/login', methods=['POST'])
def login():
    dados = request.get_json(silent=True) or {}
    email = str(dados.get('email', '')).strip().lower()
    senha = dados.get('senha') or ''

    usuario = Usuario.query.filter(func.lower(Usuario.email) == email).first()
    if usuario is None or not check_password_hash(usuario.senha_hash, senha):
        return erro('E-mail ou senha incorretos.', 401)

    return resposta_de_login(usuario)


@app.route('/api/auth/me', methods=['GET'])
@login_obrigatorio
def me(usuario):
    return jsonify(usuario.to_dict()), 200


@app.route('/api/conta', methods=['PUT'])
@login_obrigatorio
def atualizar_conta(usuario):
    nome, email, mensagem, status = validar_dados_pessoais(
        request.get_json(silent=True) or {}, ignorar_id=usuario.id_usuario
    )
    if mensagem:
        return erro(mensagem, status)

    usuario.nome = nome
    usuario.email = email
    db.session.commit()

    return jsonify(usuario.to_dict()), 200


@app.route('/api/conta/senha', methods=['PUT'])
@login_obrigatorio
def alterar_senha(usuario):
    dados = request.get_json(silent=True) or {}

    # 400 (e não 401) para não confundir com sessão expirada
    if not check_password_hash(usuario.senha_hash, dados.get('senha_atual') or ''):
        return erro('A senha atual está incorreta.', 400)

    mensagem = validar_senha(dados.get('nova_senha'))
    if mensagem:
        return erro(mensagem, 400)

    usuario.senha_hash = generate_password_hash(dados['nova_senha'])
    db.session.commit()

    return jsonify({"mensagem": "Senha alterada com sucesso"}), 200


@app.route('/api/conta', methods=['DELETE'])
@login_obrigatorio
def excluir_conta(usuario):
    dados = request.get_json(silent=True) or {}

    if not check_password_hash(usuario.senha_hash, dados.get('senha') or ''):
        return erro('Senha incorreta. A conta não foi excluída.', 400)

    Movimentacao.query.filter_by(id_usuario=usuario.id_usuario).delete()
    TokenRecuperacao.query.filter_by(id_usuario=usuario.id_usuario).delete()
    db.session.delete(usuario)
    db.session.commit()

    return jsonify({"mensagem": "Conta excluída com sucesso"}), 200


# ---------------------------------------------------------------------------
# Formas de pagamento
# ---------------------------------------------------------------------------
@app.route('/api/formas-pagamento', methods=['GET'])
@login_obrigatorio
def get_formas_pagamento(usuario):
    formas = FormaPagamento.query.order_by(FormaPagamento.id_formpag).all()
    return jsonify([f.to_dict() for f in formas]), 200


# ---------------------------------------------------------------------------
# Movimentações (sempre só as do usuário logado)
# ---------------------------------------------------------------------------
def validar_movimentacao(dados):
    """Devolve (campos, mensagem_de_erro)."""
    dados = dados or {}

    tipo = dados.get('tipo')
    if tipo not in TIPOS:
        return None, 'Tipo inválido. Use "entrada" ou "saida".'

    try:
        valor = round(float(dados.get('valor')), 2)
    except (TypeError, ValueError):
        return None, 'Informe um valor válido.'
    if not math.isfinite(valor) or valor <= 0:
        return None, 'O valor precisa ser maior que zero.'

    data_mov = date.today()
    if dados.get('data'):
        try:
            data_mov = datetime.strptime(str(dados['data']), '%Y-%m-%d').date()
        except ValueError:
            return None, 'Data inválida. Use o formato aaaa-mm-dd.'

    categoria = db.session.get(Categoria, para_inteiro(dados.get('id_categoria')) or 0)
    if categoria is None:
        return None, 'Escolha uma categoria válida.'

    id_formpag = None
    if dados.get('id_formpag') not in (None, ''):
        forma = db.session.get(FormaPagamento, para_inteiro(dados.get('id_formpag')) or 0)
        if forma is None:
            return None, 'Escolha uma forma de pagamento válida.'
        id_formpag = forma.id_formpag

    descricao = str(dados.get('descricao') or '').strip()[:150] or None

    return {
        "tipo": tipo,
        "valor": valor,
        "data_mov": data_mov,
        "descricao": descricao,
        "id_categoria": categoria.id_categoria,
        "id_formpag": id_formpag,
    }, None


@app.route('/api/movimentacoes', methods=['GET'])
@login_obrigatorio
def get_movimentacoes(usuario):
    movimentacoes = (
        Movimentacao.query.filter_by(id_usuario=usuario.id_usuario)
        .order_by(Movimentacao.data_mov.desc(), Movimentacao.id_mov.desc())
        .all()
    )
    return jsonify([mov.to_dict() for mov in movimentacoes]), 200


@app.route('/api/movimentacoes', methods=['POST'])
@login_obrigatorio
def create_movimentacao(usuario):
    campos, mensagem = validar_movimentacao(request.get_json(silent=True))
    if mensagem:
        return erro(mensagem, 400)

    nova_mov = Movimentacao(id_usuario=usuario.id_usuario, **campos)
    db.session.add(nova_mov)
    db.session.commit()

    return jsonify(nova_mov.to_dict()), 201


@app.route('/api/movimentacoes/<int:id>', methods=['DELETE'])
@login_obrigatorio
def delete_movimentacao(usuario, id):
    movimentacao = db.session.get(Movimentacao, id)

    # Movimentação de outro usuário responde como se não existisse
    if not movimentacao or movimentacao.id_usuario != usuario.id_usuario:
        return erro('Movimentação não encontrada', 404)

    db.session.delete(movimentacao)
    db.session.commit()

    return jsonify({"mensagem": "Movimentação apagada com sucesso"}), 200


# ---------------------------------------------------------------------------
# Resumo por categoria (cartões do Dashboard)
# ---------------------------------------------------------------------------
@app.route('/api/resumo-categorias', methods=['GET'])
@login_obrigatorio
def get_resumo_categorias(usuario):
    linhas = db.session.query(
        Movimentacao.id_categoria,
        Movimentacao.tipo,
        func.sum(Movimentacao.valor),
        func.count(),
    ).filter(
        Movimentacao.id_usuario == usuario.id_usuario
    ).group_by(Movimentacao.id_categoria, Movimentacao.tipo).all()

    totais = {}
    for id_categoria, tipo, soma, quantidade in linhas:
        item = totais.setdefault(id_categoria, {"saida": 0.0, "qtd_saida": 0, "qtd_entrada": 0})
        if tipo == 'saida':
            item["saida"] = float(soma or 0)
            item["qtd_saida"] = quantidade
        else:
            item["qtd_entrada"] = quantidade

    vazio = {"saida": 0.0, "qtd_saida": 0, "qtd_entrada": 0}
    resumo = []

    for categoria in Categoria.query.order_by(Categoria.id_categoria).all():
        item = totais.get(categoria.id_categoria, vazio)

        # Categorias de entrada (como Renda) não são "gastos"
        if nomes_iguais(categoria.nome, CATEGORIA_RENDA):
            continue
        if item["qtd_saida"] == 0 and item["qtd_entrada"] > 0:
            continue

        resumo.append({
            "categoria": categoria.nome,
            "total": round(item["saida"], 2),
            "quantidade": item["qtd_saida"],
            "cor": categoria.cor,
        })

    return jsonify(resumo), 200


# ---------------------------------------------------------------------------
# Categorias (compartilhadas por todos os usuários)
# ---------------------------------------------------------------------------
def validar_categoria(dados, ignorar_id=None):
    """Devolve (nome, cor, mensagem_de_erro, status)."""
    dados = dados or {}
    nome = str(dados.get('nome', '')).strip()
    cor = str(dados.get('cor', '')).strip()

    if not nome:
        return None, None, 'Informe um nome para a categoria.', 400
    if len(nome) > TAMANHO_MAXIMO_NOME_CATEGORIA:
        return None, None, f'O nome pode ter no máximo {TAMANHO_MAXIMO_NOME_CATEGORIA} caracteres.', 400
    if not COR_HEX.match(cor):
        return None, None, 'Cor inválida. Use o formato #RRGGBB.', 400

    for existente in Categoria.query.all():
        if existente.id_categoria != ignorar_id and nomes_iguais(existente.nome, nome):
            return None, None, 'Já existe uma categoria com esse nome.', 409

    return nome, cor.lower(), None, None


@app.route('/api/categorias', methods=['GET'])
@login_obrigatorio
def get_categorias(usuario):
    # "movimentacoes_mes" conta só as movimentações do usuário logado neste mês
    inicio, fim = limites_do_mes()
    contagem = dict(
        db.session.query(Movimentacao.id_categoria, func.count())
        .filter(
            Movimentacao.id_usuario == usuario.id_usuario,
            Movimentacao.data_mov >= inicio,
            Movimentacao.data_mov < fim,
        )
        .group_by(Movimentacao.id_categoria)
        .all()
    )

    categorias = Categoria.query.order_by(Categoria.id_categoria).all()
    return jsonify([c.to_dict(contagem.get(c.id_categoria, 0)) for c in categorias]), 200


@app.route('/api/categorias', methods=['POST'])
@login_obrigatorio
def create_categoria(usuario):
    nome, cor, mensagem, status = validar_categoria(request.get_json(silent=True))
    if mensagem:
        return erro(mensagem, status)

    categoria = Categoria(nome=nome, cor=cor)
    db.session.add(categoria)
    db.session.commit()

    return jsonify(categoria.to_dict()), 201


@app.route('/api/categorias/<int:id>', methods=['PUT'])
@login_obrigatorio
def update_categoria(usuario, id):
    categoria = db.session.get(Categoria, id)
    if not categoria:
        return erro('Categoria não encontrada', 404)

    nome, cor, mensagem, status = validar_categoria(request.get_json(silent=True), ignorar_id=id)
    if mensagem:
        return erro(mensagem, status)

    # As movimentações apontam para a categoria pelo id, então renomear não quebra nada
    categoria.nome = nome
    categoria.cor = cor
    db.session.commit()

    return jsonify(categoria.to_dict()), 200


@app.route('/api/categorias/<int:id>', methods=['DELETE'])
@login_obrigatorio
def delete_categoria(usuario, id):
    categoria = db.session.get(Categoria, id)
    if not categoria:
        return erro('Categoria não encontrada', 404)

    em_uso = Movimentacao.query.filter_by(id_categoria=id).count()
    if em_uso:
        plural = 'movimentação' if em_uso == 1 else 'movimentações'
        return erro(
            f'Não é possível apagar: há {em_uso} {plural} usando essa categoria.', 409
        )

    db.session.delete(categoria)
    db.session.commit()

    return jsonify({"mensagem": "Categoria apagada com sucesso"}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)
