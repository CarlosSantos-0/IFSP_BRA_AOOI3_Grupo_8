# FiGer

O **FiGer** é uma aplicação web para organizar finanças pessoais. Permite cadastrar entradas e saídas, categorizar movimentações e acompanhar os registros em um dashboard.

O projeto é dividido em:

- **FiGerWeb**: interface em React e Vite.
- **FiGerApi**: API REST em Flask, com SQLAlchemy e autenticação JWT.

## Conheça a aplicação

A aplicação publicada pode ser acessada em:

- **FiGer:** [abrir aplicação](https://ifsp-bra-aooi-3-grupo-8.vercel.app)
- **Criar conta:** [cadastro](https://ifsp-bra-aooi-3-grupo-8.vercel.app/cadastro)
- **Entrar:** [login](https://ifsp-bra-aooi-3-grupo-8.vercel.app/login)

É necessário criar uma conta ou entrar para acessar as páginas internas. Após o login, a navegação lateral dá acesso a:

- **Dashboard (`/`)**: resumo de gastos por categoria e movimentações em tabela ou Kanban; também permite cadastrar novas movimentações.
- **Categorias (`/categorias`)**: lista categorias e permite criar, editar e excluir.
- **Relatórios (`/relatorios`)**: área planejada para relatórios; no momento, ainda está em construção.
- **Minha conta (`/conta`)**: permite atualizar nome, e-mail e senha.

O front-end e a API estão publicados como projetos separados na Vercel. A API atende às requisições do front-end; não é necessário abrir o projeto dela para usar o FiGer. Os links abaixo são para gerenciamento dos projetos e podem exigir uma conta com permissão na Vercel:

- [Projeto Vercel do front-end](https://vercel.com/carlossantos-0s-projects/ifsp-bra-aooi-3-grupo-8)
- [Projeto Vercel da API](https://vercel.com/carlossantos-0s-projects/ifsp-bra-aooi-3-grupo-8-hvb4)

## Como o FiGer funciona

O navegador carrega a interface React. Quando a pessoa faz login ou usa as funcionalidades, o front-end envia requisições HTTP à API Flask. A API valida a sessão JWT e consulta ou altera os dados no banco PostgreSQL hospedado no Supabase.

**Vercel** é uma plataforma de hospedagem e publicação de aplicações web. Neste projeto, ela disponibiliza o front-end e executa a API; o Supabase hospeda o banco PostgreSQL. A documentação oficial está disponível em [Vercel Docs](https://vercel.com/docs) e [Supabase Docs](https://supabase.com/docs).

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

Abra no navegador o endereço informado pelo Vite, normalmente `http://localhost:5173`. Para usar o front-end local com a API local, o front-end chama `http://localhost:5000` por padrão.

Se a API estiver em outro endereço, crie `FiGerWeb/.env.local` com:

```env
VITE_API_URL=http://localhost:5000
```

Para apontar o front-end local à API publicada, use a URL pública da API:

```env
VITE_API_URL=https://ifsp-bra-aooi-3-grupo-8-hvb4.vercel.app
```

Reinicie o servidor Vite após alterar variáveis de ambiente. Não coloque senhas, URLs do banco com credenciais ou segredos JWT em variáveis `VITE_*`; essas variáveis são incorporadas ao código enviado ao navegador.

## Comandos do front-end

Execute os comandos dentro de `FiGerWeb`:

```powershell
npm run build
npm run lint
npm run preview
```
