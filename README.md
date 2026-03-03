# BrainCash Frontend

Aplicação web de **gestão financeira** construída com **React + TypeScript + Vite**.  
Permite controlar lançamentos, cartões, contas, orçamentos, visualizar relatórios e insights, além de oferecer recursos administrativos multi-tenant.

---

## Visão geral

O BrainCash Frontend é o painel web voltado para:

- **Gestão do dia a dia financeiro** (lançamentos, pré-lançamentos, categorias, contas e cartões).
- **Organização e registro** de anotações e eventos financeiros em calendário.
- **Análises e relatórios** com insights, tendências e uso de cartões.
- **Administração multi-tenant**, com gestão de tenants e usuários (apenas para administradores).

A aplicação consome uma API REST (configurada via `axios`) e utiliza **React Router** para navegação SPA.

---

## Funcionalidades principais

- **Autenticação**
  - Tela de login.
  - Rotas privadas protegidas (`PrivateRoute`).
  - Rotas administrativas com controle de acesso (`AdminRoute`).

- **Gestão financeira**
  - **Dashboard** com visão geral dos principais indicadores.
  - **Lançamentos** (`/transactions`):
    - Listagem de lançamentos.
    - Integração com **Pré-Lançamentos** (`/pre-transactions`), com contagem exibida no menu lateral.
  - **Pré-Lançamentos**:
    - Triagem e confirmação de lançamentos.
  - **Calendário** (`/calendar`):
    - Visualização de lançamentos por dia.
  - **Cartões** (`/cards`) e **Contas** (`/accounts`).
  - **Orçamentos** (`/budgets`).

- **Organização**
  - **Categorias** (`/categories`).
  - **Anotações** (`/notes`).

- **Análise e relatórios**
  - **Insights** (`/insights`).
  - **Tendências** (`/reports/trends`).
  - **Uso de Cartões** (`/reports/cards`).
  - **Top Estabelecimentos** (`/top-establishments`).

- **Configurações**
  - Página de **Ajustes** (`/settings`).
  - Seleção de tema (claro/escuro) via `ThemeSelector` e `next-themes`.

- **Administração (multi-tenant)**
  - **Tenants** (`/admin`).
  - **Usuários por tenant** (`/admin/tenants/:tenantId/users`).

---

## Tecnologias utilizadas

- **Core**
  - [React](https://react.dev/) (TypeScript)
  - [Vite](https://vite.dev/) (build/dev server)
  - [React Router DOM](https://reactrouter.com/) (v7)
  - [TypeScript](https://www.typescriptlang.org/)

- **Estado e dados**
  - [@tanstack/react-query](https://tanstack.com/query/v5) — cache e gerenciamento de requisições
  - [axios](https://axios-http.com/) — cliente HTTP

- **UI e estilo**
  - [Tailwind CSS](https://tailwindcss.com/)
  - [Radix UI](https://www.radix-ui.com/) (Dialog, Dropdown, Popover, Select, Switch etc.)
  - [lucide-react](https://lucide.dev/) — ícones
  - [sonner](https://sonner.emilkowal.ski/) — toasts
  - [react-day-picker](https://react-day-picker.js.org/) — calendários
  - [recharts](https://recharts.org/) — gráficos
  - [next-themes](https://github.com/pacocoursey/next-themes) — tema claro/escuro
  - Utilitários: `class-variance-authority`, `clsx`, `tailwind-merge`

- **Formulários e validação**
  - [react-hook-form](https://react-hook-form.com/)
  - [zod](https://zod.dev/)
  - [@hookform/resolvers](https://github.com/react-hook-form/resolvers)

- **Qualidade e build**
  - ESLint (+ `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`)
  - TypeScript estrito (`strict: true`)
  - Scripts de build e preview via Vite

---

## Requisitos

- **Node.js** (versão recomendada: 18+)
- **npm** (ou outro gerenciador compatível, como `pnpm` ou `yarn`)

---

## Como começar

### 1. Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd frontend
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` ou `.env.local` na raiz do projeto com, por exemplo:

```bash
VITE_API_URL=http://localhost:3000
```

> Ajuste o valor de `VITE_API_URL` para apontar para a URL da API do backend BrainCash.

### 4. Rodar em modo desenvolvimento

```bash
npm run dev
```

A aplicação normalmente ficará disponível em `http://localhost:5173` (ou porta que o Vite indicar).

---

## Executando com Docker

É possível rodar o frontend em um container. O build é feito na imagem e o servidor serve os arquivos estáticos na porta **8080**.

### Build da imagem

```bash
docker build -t braincash-frontend .
```

### Rodar o container

As variáveis de ambiente do `.env` podem ser passadas em **runtime** com a opção `-e` (sem precisar reconstruir a imagem):

```bash
# URL da API (equivalente a VITE_API_URL no .env)
docker run -p 8080:8080 -e API_URL=http://localhost:8000/api braincash-frontend
```

Ou usando o mesmo nome da variável do `.env`:

```bash
docker run -p 8080:8080 -e VITE_API_URL=http://backend:8000/api braincash-frontend
```

O entrypoint do container gera um `config.js` na inicialização a partir dessas variáveis, permitindo alterar a URL da API sem novo build.

---

## Scripts disponíveis

No arquivo `package.json`:

- **`npm run dev`**  
  Sobe o servidor de desenvolvimento Vite com HMR.

- **`npm run build`**  
  Gera o build de produção:
  - Compila TypeScript (`tsc -b`).
  - Executa `vite build`.

- **`npm run preview`**  
  Sobe um servidor local para **pré-visualizar o build de produção**.

- **`npm run lint`**  
  Roda o ESLint sobre o projeto.

---

## Estrutura básica de pastas

Alguns diretórios importantes em `src/`:

- `src/App.tsx` — ponto de entrada da aplicação React (rotas principais).
- `src/pages/` — páginas de alto nível:
  - `Dashboard.tsx`, `Accounts.tsx`, `Cards.tsx`, `Categories.tsx`,  
    `Transactions.tsx`, `PreTransactions.tsx`, `Calendar.tsx`, `Budgets.tsx`,  
    `Users.tsx`, `Notes.tsx`, `Insights.tsx`, `Settings.tsx`,  
    `reports/Trends.tsx`, `reports/CardsReport.tsx`, `TopEstablishments.tsx`,  
    `Login.tsx`, `admin/Tenants.tsx`, `admin/TenantUsers.tsx`.
- `src/components/` — componentes reutilizáveis:
  - `layout/` (inclui `Layout`, `AppSidebar`, navegação, etc.).
  - componentes de domínio (dashboard, budgets, calendar, transactions, insights, etc.).
- `src/contexts/` — contextos globais:
  - `AuthContext.tsx` — autenticação/usuário/tenant.
  - `ThemeContext.tsx` — tema da aplicação.
- `src/lib/` — utilitários e infraestrutura:
  - `axios` (cliente HTTP), `react-query`, `sidebar-nav`, `insights`, `transaction-form`, `logo`, etc.
- `src/hooks/` — hooks customizados.
- `src/components/ui/` — componentes de UI base (switch, badge, etc.).

---

## Navegação e layout

- A navegação principal é configurada em `createSidebarNavData` (`src/lib/sidebar-nav.tsx`), agrupando:
  - **Gestão Financeira**, **Organização**, **Análise** e **Ajustes**.
- O layout principal (`src/components/layout/Layout.tsx`):
  - Renderiza o **sidebar** (`AppSidebar`) e o cabeçalho com:
    - Nome do tenant logado.
    - Saudação ao usuário.
    - Seletor de tema.
  - Usa `<Outlet />` para renderizar a página de acordo com a rota atual.

---

## Boas práticas e padrões

- **TypeScript estrito** para maior segurança de tipos.
- **React Query** para gerenciamento de estado de servidor (requisições e cache).
- **Axios isolado** em `lib/axios` (configuração centralizada de baseURL e interceptors).
- **Componentização focada em domínio** (dashboard, budgets, calendar, etc.).
- **Design responsivo e moderno**, com Tailwind + componentes baseados em Radix.

---

## Como contribuir

1. Crie um branch a partir de `main`/`develop`.
2. Faça suas alterações seguindo os padrões de código e estilo do projeto.
3. Execute:
   - `npm run lint`
   - `npm run build` (opcional, mas recomendado)
4. Abra um Pull Request descrevendo claramente:
   - O problema resolvido ou feature criada.
   - Prints de telas (se aplicável).
   - Passos para testar.

---

## Licença

Definir a licença do projeto aqui (por exemplo, MIT, proprietária, etc.).

