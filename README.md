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

## Publicação

O front-end e a API podem ser publicados como projetos separados na Vercel:

- No projeto da **API**, configure o diretório raiz como `FiGerApi` e as variáveis `FIGER_DATABASE_URL` e `FIGER_JWT_SECRET`.
- No projeto do **front-end**, configure o diretório raiz como `FiGerWeb` e a variável `VITE_API_URL` com a URL pública da API, sem barra no final.
- Faça um novo deploy após alterar variáveis. O Vite incorpora `VITE_API_URL` durante o build.

Em produção, use PostgreSQL gerenciado, como o Supabase; o SQLite local não deve ser usado para persistência na Vercel. Para a API em funções serverless, utilize a connection string **Transaction pooler** do Supabase. A API cria as tabelas ao iniciar.

Não publique nem versione senhas, URLs de banco com credenciais ou valores de `FIGER_JWT_SECRET`. Configure esses valores nas variáveis de ambiente privadas da Vercel.
