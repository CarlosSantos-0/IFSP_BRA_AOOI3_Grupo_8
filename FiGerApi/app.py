from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/movimentacoes', methods=['GET'])
def get_movimentacoes():
    # Dados mockados temporários para testar a integração com o React
    movimentacoes_mock = [
        {
            "id": 1,
            "descricao": "Salário",
            "categoria": "Renda",
            "data": "2026-10-05T00:00:00",
            "tipo": "entrada",
            "valor": 4500.00
        },
        {
            "id": 2,
            "descricao": "Supermercado",
            "categoria": "Comida",
            "data": "2026-10-08T00:00:00",
            "tipo": "saida",
            "valor": 620.00
        }
    ]
    return jsonify(movimentacoes_mock), 200

@app.route('/api/movimentacoes', methods=['POST'])
def create_movimentacao():
    dados = request.get_json()
    print("Nova movimentação recebida:", dados)
    return jsonify({"mensagem": "Movimentação salva com sucesso!", "dado": dados}), 201

if __name__ == '__main__':
    app.run(debug=True, port=5000)