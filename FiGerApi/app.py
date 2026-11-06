import re
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///figer.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Modelos de dados
class Movimentacao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    descricao = db.Column(db.String(100), nullable=True)
    categoria = db.Column(db.String(50), nullable=False, default='Outros')
    data = db.Column(db.DateTime, default=datetime.utcnow)
    tipo = db.Column(db.String(20), nullable=False) # 'entrada' ou 'saida'
    valor = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "descricao": self.descricao,
            "categoria": self.categoria,
            "data": self.data.isoformat(),
            "tipo": self.tipo,
            "valor": self.valor
        }


class Categoria(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(30), nullable=False, unique=True)
    cor = db.Column(db.String(7), nullable=False, default='#2563eb')  # formato #RRGGBB

    def to_dict(self, movimentacoes_mes=0):
        return {
            "id": self.id,
            "nome": self.nome,
            "cor": self.cor,
            "movimentacoes_mes": movimentacoes_mes
        }


# ---------------------------------------------------------------------------
# Categorias: configuração e funções de apoio
# ---------------------------------------------------------------------------
COR_HEX = re.compile(r'^#[0-9a-fA-F]{6}$')
TAMANHO_MAXIMO_NOME = 30

CATEGORIAS_PADRAO = [
    ('Renda', '#2563eb'),
    ('Comida', '#7c3aed'),
    ('Transporte', '#db2777'),
    ('Moradia', '#ea580c'),
    ('Lazer', '#0891b2'),
    ('Outros', '#65a30d'),
]
PALETA = [cor for _, cor in CATEGORIAS_PADRAO]


def nomes_iguais(a, b):
    """Compara nomes sem diferenciar maiúsculas/minúsculas ("Comida" == "comida")."""
    return (a or '').strip().casefold() == (b or '').strip().casefold()


def buscar_categoria_por_nome(nome, ignorar_id=None):
    for categoria in Categoria.query.all():
        if categoria.id != ignorar_id and nomes_iguais(categoria.nome, nome):
            return categoria
    return None


def sincronizar_categorias():
    """Cria as categorias padrão na primeira execução e garante que todo nome já
    usado em uma movimentação exista na tabela Categoria."""
    if Categoria.query.count() == 0:
        for nome, cor in CATEGORIAS_PADRAO:
            db.session.add(Categoria(nome=nome, cor=cor))
        db.session.commit()

    existentes = {c.nome.casefold() for c in Categoria.query.all()}
    usados = db.session.query(Movimentacao.categoria).distinct().all()

    for (nome,) in usados:
        nome = (nome or 'Outros').strip()[:TAMANHO_MAXIMO_NOME]
        if nome and nome.casefold() not in existentes:
            db.session.add(Categoria(nome=nome, cor=PALETA[len(existentes) % len(PALETA)]))
            existentes.add(nome.casefold())

    db.session.commit()


def validar_categoria(dados, ignorar_id=None):
    """Devolve (nome, cor, mensagem_de_erro, status_http)."""
    dados = dados or {}
    nome = str(dados.get('nome', '')).strip()
    cor = str(dados.get('cor', '')).strip()

    if not nome:
        return None, None, 'Informe um nome para a categoria.', 400
    if len(nome) > TAMANHO_MAXIMO_NOME:
        return None, None, f'O nome pode ter no máximo {TAMANHO_MAXIMO_NOME} caracteres.', 400
    if not COR_HEX.match(cor):
        return None, None, 'Cor inválida. Use o formato #RRGGBB.', 400
    if buscar_categoria_por_nome(nome, ignorar_id):
        return None, None, 'Já existe uma categoria com esse nome.', 409

    return nome, cor.lower(), None, None


def contar_movimentacoes_do_mes():
    agora = datetime.utcnow()
    inicio = datetime(agora.year, agora.month, 1)
    fim = datetime(agora.year + (agora.month == 12), agora.month % 12 + 1, 1)

    contagem = {}
    linhas = db.session.query(Movimentacao.categoria).filter(
        Movimentacao.data >= inicio, Movimentacao.data < fim
    )
    for (nome,) in linhas:
        chave = (nome or '').casefold()
        contagem[chave] = contagem.get(chave, 0) + 1
    return contagem


def movimentacoes_da_categoria(nome):
    return [m for m in Movimentacao.query.all() if nomes_iguais(m.categoria, nome)]


with app.app_context():
    db.create_all()          # cria a tabela Categoria na primeira execução
    sincronizar_categorias()


# ---------------------------------------------------------------------------
# Movimentações
# ---------------------------------------------------------------------------
@app.route('/api/movimentacoes', methods=['GET'])
def get_movimentacoes():
    movimentacoes = Movimentacao.query.all()
    return jsonify([mov.to_dict() for mov in movimentacoes]), 200

@app.route('/api/movimentacoes', methods=['POST'])
def create_movimentacao():
    dados = request.get_json()
    data_mov = datetime.utcnow()
    if 'data' in dados:
        try:
            data_mov = datetime.strptime(dados['data'], '%Y-%m-%d')
        except ValueError:
            pass

    nova_mov = Movimentacao(
        descricao=dados.get('descricao'),
        categoria=dados.get('categoria', 'Outros'),
        data=data_mov,
        tipo=dados.get('tipo', 'saida'),
        valor=float(dados.get('valor', 0))
    )

    db.session.add(nova_mov)
    db.session.commit()
    sincronizar_categorias()  # se vier um nome novo, ele vira categoria também

    return jsonify(nova_mov.to_dict()), 201


@app.route('/api/movimentacoes/<int:id>', methods=['DELETE'])
def delete_movimentacao(id):
    # Procura a movimentação pelo ID na base de dados
    movimentacao = db.session.get(Movimentacao, id)

    if not movimentacao:
        return jsonify({"erro": "Movimentação não encontrada"}), 404

    db.session.delete(movimentacao)
    db.session.commit()

    return jsonify({"mensagem": "Movimentação apagada com sucesso"}), 200


# ---------------------------------------------------------------------------
# Resumo por categoria (cartões do Dashboard)
# ---------------------------------------------------------------------------
@app.route('/api/resumo-categorias', methods=['GET'])
def get_resumo_categorias():
    # Soma só as despesas ('saida') de cada categoria
    totais = {}
    for mov in Movimentacao.query.all():
        item = totais.setdefault(
            (mov.categoria or 'Outros').casefold(),
            {"total": 0.0, "quantidade": 0, "entradas": 0},
        )
        if mov.tipo == 'saida':
            item["total"] += mov.valor
            item["quantidade"] += 1
        else:
            item["entradas"] += 1

    vazio = {"total": 0.0, "quantidade": 0, "entradas": 0}
    resumo = []

    for categoria in Categoria.query.order_by(Categoria.id).all():
        item = totais.get(categoria.nome.casefold(), vazio)

        # Categorias que só recebem entradas (como Renda) não são "gastos"
        if item["quantidade"] == 0 and item["entradas"] > 0:
            continue

        resumo.append({
            "categoria": categoria.nome,
            "total": round(item["total"], 2),
            "quantidade": item["quantidade"],
            "cor": categoria.cor,
        })

    return jsonify(resumo), 200


# ---------------------------------------------------------------------------
# Categorias (CRUD)
# ---------------------------------------------------------------------------
@app.route('/api/categorias', methods=['GET'])
def get_categorias():
    contagem = contar_movimentacoes_do_mes()
    categorias = Categoria.query.order_by(Categoria.id).all()
    return jsonify([
        c.to_dict(contagem.get(c.nome.casefold(), 0)) for c in categorias
    ]), 200


@app.route('/api/categorias', methods=['POST'])
def create_categoria():
    nome, cor, erro, status = validar_categoria(request.get_json(silent=True))
    if erro:
        return jsonify({"erro": erro}), status

    categoria = Categoria(nome=nome, cor=cor)
    db.session.add(categoria)
    db.session.commit()

    return jsonify(categoria.to_dict()), 201


@app.route('/api/categorias/<int:id>', methods=['PUT'])
def update_categoria(id):
    categoria = db.session.get(Categoria, id)
    if not categoria:
        return jsonify({"erro": "Categoria não encontrada"}), 404

    nome, cor, erro, status = validar_categoria(request.get_json(silent=True), ignorar_id=id)
    if erro:
        return jsonify({"erro": erro}), status

    # "Outros" é a categoria padrão das movimentações: pode mudar de cor, não de nome
    if nomes_iguais(categoria.nome, 'Outros') and not nomes_iguais(nome, 'Outros'):
        return jsonify({"erro": 'A categoria "Outros" é padrão e não pode ser renomeada.'}), 400

    # As movimentações guardam o nome da categoria: ao renomear, acompanham a mudança
    if categoria.nome != nome:
        for mov in movimentacoes_da_categoria(categoria.nome):
            mov.categoria = nome

    categoria.nome = nome
    categoria.cor = cor
    db.session.commit()

    return jsonify(categoria.to_dict()), 200


@app.route('/api/categorias/<int:id>', methods=['DELETE'])
def delete_categoria(id):
    categoria = db.session.get(Categoria, id)
    if not categoria:
        return jsonify({"erro": "Categoria não encontrada"}), 404

    if nomes_iguais(categoria.nome, 'Outros'):
        return jsonify({"erro": 'A categoria "Outros" é padrão e não pode ser apagada.'}), 400

    em_uso = len(movimentacoes_da_categoria(categoria.nome))
    if em_uso:
        plural = 'movimentação' if em_uso == 1 else 'movimentações'
        return jsonify({
            "erro": f'Não é possível apagar: há {em_uso} {plural} nessa categoria. '
                    'Apague ou mude essas movimentações antes.'
        }), 409

    db.session.delete(categoria)
    db.session.commit()

    return jsonify({"mensagem": "Categoria apagada com sucesso"}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)