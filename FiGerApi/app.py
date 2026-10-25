from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
from datetime import datetime

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

with app.app_context():
    db.create_all()

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

    return jsonify(nova_mov.to_dict()), 201

    


@app.route('/api/resumo-categorias', methods=['GET'])
def get_resumo_categorias():
    # Filtra apenas as despesas ('saida'), agrupa por categoria e soma os valores
    resultados = db.session.query(
        Movimentacao.categoria,
        func.sum(Movimentacao.valor).label('total')
    ).filter(Movimentacao.tipo == 'saida').group_by(Movimentacao.categoria).all()

    resumo = [
        {"categoria": row.categoria, "total": round(row.total, 2)}
        for row in resultados
    ]

    return jsonify(resumo), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)