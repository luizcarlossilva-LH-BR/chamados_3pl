# 3PL Chamados - BSC Support Portal

Plataforma de gestão de chamados para transportadoras 3PL da Shopee.

Stack: **Next.js 14 + Google Sheets + Vercel**

## Arquitetura

```text
Vercel / Next.js 14 App Router
  app/                 páginas e rotas
  app/api/             backend HTTP
  lib/sheets.ts        Google Sheets como banco de dados
  lib/auth.ts          JWT em cookie HttpOnly
  middleware.ts        proteção de rotas por sessão e perfil

Google Sheets
  tickets
  users
  access_requests
```

As leituras e escritas usam a Google Sheets API via Service Account. O script em `scripts/apps-script-backend.gs` fica apenas como utilitário para criar as abas e o usuário admin inicial.

## Configuração

1. Crie uma planilha no Google Sheets.
2. Copie o ID da URL da planilha.
3. No Google Cloud, ative a Google Sheets API.
4. Crie uma Service Account e gere uma chave JSON.
5. Compartilhe a planilha com o `client_email` da Service Account com permissão de Editor.
6. Copie `.env.example` para `.env.local`.
7. Preencha:
   - `GOOGLE_SHEETS_ID`
   - `GOOGLE_SERVICE_ACCOUNT_JSON`
   - `APPS_SCRIPT_EMAIL_URL`
   - `APPS_SCRIPT_EMAIL_SECRET`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL`

## E-mail de acesso (Apps Script)

Ao aprovar uma solicitação de cadastro em `/admin/requests`, o sistema envia automaticamente um e-mail ao solicitante com login e senha temporária, através de um Web App do Google Apps Script (`scripts/apps-script-backend.gs`, função `doPost`). A conta que "Executa" o Web App é quem aparece como remetente — sem precisar de service account, Gmail API ou domain-wide delegation.

1. Abra o Apps Script vinculado à planilha (Extensões > Apps Script) e cole a versão atualizada de `scripts/apps-script-backend.gs` (já inclui a função `doPost`).
2. Em **Configurações do projeto > Propriedades do script**, adicione a propriedade `EMAIL_SECRET` com um valor aleatório longo.
3. Em **Implantar > Nova implantação > Tipo: Aplicativo da Web**:
   - Executar como: **Eu** (a conta que deve aparecer como remetente, ex.: `luiz.carlossilva@shopee.com`).
   - Quem tem acesso: **Qualquer pessoa**.
4. Copie a URL de implantação (termina em `/exec`) e defina em `APPS_SCRIPT_EMAIL_URL`.
5. Defina `APPS_SCRIPT_EMAIL_SECRET` com o mesmo valor da propriedade `EMAIL_SECRET` do passo 2 — é o que impede qualquer pessoa que descubra a URL pública de mandar e-mail em nome da conta.

Sem essas variáveis configuradas, a aprovação continua funcionando normalmente, mas o e-mail não é enviado — a senha temporária continua sendo exibida na tela como alternativa.

## Preparar a planilha

No Apps Script da planilha, cole `scripts/apps-script-backend.gs`, substitua `SEU_SPREADSHEET_ID_AQUI` pelo ID real e execute `setupSheets()`.

Login inicial criado pelo script:

- E-mail: `admin@shopee.com`
- Senha: `admin123`

Troque a senha inicial após o primeiro acesso.

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Rotas da API

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/auth/login` | Público | Login |
| POST | `/api/auth/logout` | Autenticado | Logout |
| GET | `/api/tickets` | Autenticado | Lista chamados |
| POST | `/api/tickets` | Autenticado | Cria chamado |
| GET | `/api/tickets/[id]` | Autenticado | Detalhe do chamado |
| PATCH | `/api/tickets/[id]` | Admin/Analista | Atualiza chamado |
| GET | `/api/users` | Admin | Lista usuários |
| POST | `/api/users` | Admin | Cria usuário |
| GET | `/api/users/requests` | Admin | Lista solicitações |
| POST | `/api/users/requests` | Público | Solicita acesso |
| PATCH | `/api/users/requests/[id]` | Admin | Aprova ou recusa solicitação |

## Perfis

| Perfil | Vê tickets | Cria | Responde/fecha | Gerencia usuários |
|---|---|---|---|---|
| Admin Shopee | Todos | Sim | Sim | Sim |
| Analista Shopee | Todos | Sim | Sim | Não |
| Supervisor 3PL | Sua empresa | Sim | Não | Não |
| Operador 3PL | Sua empresa | Sim | Não | Não |

## Estrutura das abas

### `tickets`

`id`, `empresa`, `setor`, `tipo`, `categoria`, `kpis`, `impacto`, `status`, `descricao`, `evidencia`, `periodo`, `rotas`, `drivers`, `email`, `nome`, `responsavel`, `sla`, `timeline`, `criadoEm`, `atualizadoEm`

### `users`

`id`, `nome`, `email`, `senha`, `role`, `empresa`, `setor`, `ativo`, `criadoEm`

### `access_requests`

`id`, `nome`, `email`, `empresa`, `setor`, `justificativa`, `status`, `criadoEm`
