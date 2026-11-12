# FiGer

Aplicação web para organização de finanças pessoais. O projeto é dividido em:

- **FiGerWeb**: interface em React e Vite.
- **FiGerApi**: API REST em Flask, com SQLAlchemy e autenticação JWT.

## Requisitos

- Node.js e npm.
- Python 3.

## Executar localmente

Abra dois terminais na raiz do repositório.

### 1. Iniciar a API

No PowerShell:

```powershell
cd FiGerApi
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

A API ficará disponível em `http://localhost:5000`. Sem `FIGER_DATABASE_URL`, o Flask-SQLAlchemy usa SQLite local e cria as tabelas e dados padrão ao iniciar.

### 2. Iniciar o front-end

No segundo terminal:

```powershell
cd FiGerWeb
npm install
npm run dev
```

Abra no navegador o endereço informado pelo Vite, normalmente `http://localhost:5173`. Por padrão, o front-end local chama a API em `http://localhost:5000`.

Se a API estiver em outro endereço, crie `FiGerWeb/.env.local` com:

```env
VITE_API_URL=http://localhost:5000
```

Reinicie o servidor Vite após alterar variáveis de ambiente.

## Comandos do front-end

Execute os comandos dentro de `FiGerWeb`:

```powershell
npm run build
npm run lint
npm run preview
```
