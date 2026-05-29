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
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL`

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
