# FiGer

O **FiGer** é uma aplicação web para organizar finanças pessoais. Permite cadastrar entradas e saídas, categorizar movimentações e acompanhar os registros em um dashboard. Também pode ser instalado no celular como app, para registrar movimentações rapidamente, inclusive sem internet.

O projeto é dividido em:

- **FiGerWeb**: interface em React e Vite.
- **FiGerApi**: API REST em Flask, com SQLAlchemy e autenticação JWT.

## Conheça a aplicação

A aplicação publicada pode ser acessada em:

- **FiGer:** [abrir aplicação](https://ifsp-bra-aooi-3-grupo-8.vercel.app)

É necessário criar uma conta (`/cadastro`) ou entrar (`/login`) para acessar as páginas internas. Quem esqueceu a senha pode pedir um link de redefinição em **Esqueceu a senha?**, na tela de login (`/recuperar-senha`).

Após o login, a navegação lateral dá acesso a:

- **Dashboard (`/`)**: resumo de gastos por categoria e movimentações em tabela ou Kanban; também permite cadastrar novas movimentações.
- **Categorias (`/categorias`)**: lista as categorias do usuário e permite criar, editar e excluir. Cada conta tem as próprias categorias; toda conta nova começa com Renda, Comida, Transporte, Moradia, Lazer e Outros.
- **Relatórios (`/relatorios`)**: permite consultar semana, mês ou ano, navegar entre períodos, ver saldo, entradas e saídas, comparar entradas/saídas com o período anterior, visualizar gráficos de movimentações e gastos por categoria e exportar os dados do período em CSV.
- **Minha conta (`/conta`)**: permite atualizar nome e e-mail, alterar a senha e excluir a conta após confirmar a ação com a palavra `EXCLUIR` e a senha atual.

### App no celular

O FiGer é um **PWA** (Progressive Web App): um site que pode ser instalado como aplicativo, sem loja de apps.

- **Android (Chrome):** abra o site e toque em **Instalar app**, no menu lateral ou na tela de nova movimentação.
- **iPhone (Safari):** toque em **Compartilhar** → **Adicionar à Tela de Início**. O botão **Instalar app** mostra esse passo a passo.

O app instalado abre direto na tela **Nova movimentação** (`/nova`). Sem internet, o que for salvo fica guardado no aparelho em **Aguardando envio** e é enviado sozinho quando a conexão volta. No Android, segurar o ícone mostra atalhos para *Nova movimentação* e *Dashboard*.

Para funcionar offline, o app precisa ter sido aberto **pelo menos uma vez com internet e com a conta conectada**: é nesse momento que ele guarda as telas e as categorias no aparelho.

O front-end e a API estão publicados como projetos separados na Vercel. A API atende às requisições do front-end; não é necessário abrir o projeto dela para usar o FiGer. Os links abaixo são para gerenciamento dos projetos e podem exigir uma conta com permissão na Vercel:

- [Projeto Vercel do front-end](https://vercel.com/carlossantos-0s-projects/ifsp-bra-aooi-3-grupo-8)
- [Projeto Vercel da API](https://vercel.com/carlossantos-0s-projects/ifsp-bra-aooi-3-grupo-8-hvb4)

## Como o FiGer funciona

O navegador carrega a interface React. Quando a pessoa faz login ou usa as funcionalidades, o front-end envia requisições HTTP à API Flask. A API valida a sessão JWT e consulta ou altera os dados no banco PostgreSQL hospedado no Supabase.

**Vercel** é uma plataforma de hospedagem e publicação de aplicações web. Neste projeto, ela disponibiliza o front-end e executa a API; o Supabase hospeda o banco PostgreSQL. A documentação oficial está disponível em [Vercel Docs](https://vercel.com/docs) e [Supabase Docs](https://supabase.com/docs).

O front-end é uma SPA (aplicação de página única): o arquivo `FiGerWeb/vercel.json` faz a Vercel entregar o `index.html` em qualquer endereço, para que links diretos como `/login` ou `/redefinir-senha?token=...` abram a página certa.

### Recuperação de senha

1. Em `/recuperar-senha`, a pessoa informa o e-mail e o front chama `POST /api/auth/esqueci-senha`.
2. A API gera um token aleatório e guarda no banco (tabela `tokenrecuperacao`) apenas o **hash** dele, com validade de 30 minutos.
3. A API envia por e-mail o link `<site>/redefinir-senha?token=<token>`.
4. Na página do link, a nova senha é enviada para `POST /api/auth/redefinir-senha`. A API confere se o token existe, se não expirou e se não foi usado, troca a senha e marca o token como usado (cada link vale uma vez).

A resposta do passo 1 é sempre a mesma, exista a conta ou não, para que a tela não revele quais e-mails estão cadastrados.

### Funcionamento offline (PWA)

- **Manifest** (`manifest.webmanifest`): nome, ícones, cores e tela inicial do app instalado. É gerado pelo `vite-plugin-pwa` a partir de `FiGerWeb/vite.config.js`.
- **Service worker** (`sw.js`): guarda os arquivos do site no aparelho para o app abrir sem internet. Também é gerado no build; uma versão nova publicada na Vercel é aplicada sozinha.
- **Dados offline** (`src/utils/offlineStore.js`): categorias, formas de pagamento e a fila de movimentações pendentes ficam no `localStorage`, separados por usuário.
- **Sincronização** (`src/hooks/useOfflineSync.js`): ao abrir o app e quando a internet volta, as pendentes são enviadas à API em ordem. Se a API recusar alguma (por exemplo, a categoria foi apagada), ela fica marcada com o erro e pode ser descartada.

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

A API ficará disponível em `http://localhost:5000`. Sem `FIGER_DATABASE_URL`, o Flask-SQLAlchemy usa SQLite local (`FiGerApi/instance/figer_v2.db`) e cria as tabelas e dados padrão ao iniciar.

Sem as variáveis `FIGER_SMTP_*`, a recuperação de senha não envia e-mail localmente: o link de redefinição é **impresso no terminal da API**, e basta copiá-lo no navegador.

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

### Testar o app instalável (PWA) localmente

O service worker só existe na versão de produção, então ele não roda no `npm run dev`. Para testar a instalação e o modo offline, crie `FiGerWeb/.env.local` com `VITE_API_URL=http://localhost:5000` e rode:

```powershell
npm run build
npm run preview
```

Abra `http://localhost:4173`. No Chrome, a aba **Application** do DevTools mostra o manifest e o service worker, e a opção **Network → Offline** simula a falta de internet.

## Variáveis de ambiente da API

Configure-as no projeto da API na Vercel (**Settings → Environment Variables**, ambiente *Production*) e faça um novo deploy depois de alterar, porque a API só lê as variáveis quando é publicada.

| Variável | Para que serve |
|---|---|
| `FIGER_DATABASE_URL` | URL do PostgreSQL (Supabase). Obrigatória na Vercel. |
| `FIGER_JWT_SECRET` | Chave que assina os tokens de login. Obrigatória na Vercel. |
| `FIGER_FRONTEND_URL` | Endereço do site, usado para montar o link do e-mail de recuperação. Ex.: `https://ifsp-bra-aooi-3-grupo-8.vercel.app` |
| `FIGER_SMTP_HOST` | Servidor de envio de e-mail. Gmail: `smtp.gmail.com` |
| `FIGER_SMTP_PORT` | Porta do servidor. Gmail: `587` |
| `FIGER_SMTP_USER` | Conta de e-mail que envia as mensagens |
| `FIGER_SMTP_PASSWORD` | Senha dessa conta. No Gmail, use uma **senha de app** (exige verificação em duas etapas), não a senha normal |
| `FIGER_SMTP_FROM` | Remetente exibido (opcional; padrão: `FIGER_SMTP_USER`) |

Se o e-mail de recuperação não chegar, os logs da API na Vercel mostram o motivo, por exemplo `FIGER_SMTP_HOST não configurado`.

## Alterações no banco de dados

O `db.create_all()` do `app.py` **só cria tabelas que ainda não existem**: ele não adiciona, remove nem altera colunas de tabelas existentes. Por isso, ao mudar um modelo no Python:

- **Supabase (produção):** escreva e rode o SQL da alteração (`ALTER TABLE ...`) no **SQL Editor** do Supabase, de preferência dentro de `BEGIN; ... COMMIT;` e depois de um backup. Publique o código novo logo em seguida.
- **SQLite local:** apague `FiGerApi/instance/figer_v2.db`; a API recria o banco no formato novo ao iniciar (os dados locais de teste são perdidos).

## Comandos do front-end

Execute os comandos dentro de `FiGerWeb`:

```powershell
npm run build     # gera a versão de produção (inclui manifest e service worker)
npm run lint
npm run preview   # serve a versão de produção em http://localhost:4173
npm run icons     # gera os ícones do app a partir de public/logo.svg (só quando o logo mudar)
```
