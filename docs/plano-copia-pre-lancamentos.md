# Plano de cópia: Ações de Pré-Lançamentos (OpenMonetis → BrainCash)

## 1. Ações disponíveis no OpenMonetis para Pré-Lançamentos

### 1.1 Server Actions (app/(dashboard)/pre-lancamentos/actions.ts)

| Ação | Descrição | Uso na UI |
|------|-----------|-----------|
| **markInboxAsProcessedAction** | Marca um item da inbox como processado após criar o lançamento | Chamada após sucesso do `LancamentoDialog` (converter em lançamento) |
| **discardInboxItemAction** | Marca um único item como descartado (status `discarded`) | Botão "Descartar" no card / diálogo de confirmação |
| **bulkDiscardInboxItemsAction** | Marca vários itens como descartados em lote | Não exposta na UI atual (ação disponível no backend) |

### 1.2 Fluxo na UI (InboxPage + InboxCard)

- **Aba Pendentes**: lista de pré-lançamentos com:
  - **Processar**: abre `LancamentoDialog` em modo criação com dados pré-preenchidos (data, nome, valor, cartão sugerido); ao salvar o lançamento, chama `markInboxAsProcessedAction`.
  - **Descartar**: abre `ConfirmActionDialog`; ao confirmar, chama `discardInboxItemAction`.
  - **Ver detalhes**: abre `InboxDetailsDialog` (somente leitura do texto original da notificação).
- **Abas Processados / Descartados**: mesma lista em modo somente leitura (badge de status + data de processamento/descartado).

### 1.3 APIs REST (entrada de dados – app mobile/Companion)

- **POST /api/inbox**: cria um item na inbox (notificação recebida pelo app), com validação por token e rate limit.
- **POST /api/inbox/batch**: cria vários itens em lote (mesma autenticação).

### 1.4 Modelo de dados (preLancamentos)

- Campos: `id`, `userId`, `sourceApp`, `sourceAppName`, `originalTitle`, `originalText`, `notificationTimestamp`, `parsedName`, `parsedAmount`, `status` (pending | processed | discarded), `lancamentoId`, `processedAt`, `discardedAt`, `createdAt`, `updatedAt`.
- Status: **pending** → **processed** (ao converter) ou **discarded** (ao descartar).

---

## 2. Estado atual do BrainCash (Pré-Lançamentos)

### 2.1 Backend (FastAPI)

- **Modelo**: `PreTransaction` com `status` (PENDING, CONVERTED; não há “discarded”).
- **Endpoints**:
  - `GET /pre-transactions/count` – contagem de pendentes.
  - `POST /pre-transactions/` – criar.
  - `GET /pre-transactions/` – listar (filtro opcional por status).
  - `GET /pre-transactions/{id}` – obter um.
  - `PUT /pre-transactions/{id}` – atualizar (apenas PENDING).
  - `DELETE /pre-transactions/{id}` – excluir permanentemente.
  - `POST /pre-transactions/{id}/convert` – converter em transação e marcar como CONVERTED.

### 2.2 Frontend (PreTransactions.tsx)

- Lista apenas itens **PENDING** em tabela.
- **Ações**: Converter (botão check) e Remover (botão lixeira com diálogo).
- Modal “Novo” para criar pré-lançamento manual (descrição, valor, tipo, data, categoria, conta, cartão).
- Não há: abas Processados/Descartados, “descartar” sem apagar, “ver detalhes”, bulk discard, cards visuais no estilo inbox.

---

## 3. Lacunas BrainCash vs OpenMonetis

| Funcionalidade OpenMonetis | No BrainCash |
|---------------------------|--------------|
| Marcar como processado (após converter) | Já existe: converter marca como CONVERTED. |
| Descartar (sem apagar, status discarded) | Não existe: só existe DELETE (remove do BD). |
| Descartar em lote | Não existe. |
| Ver detalhes (texto original) | Não existe (BrainCash não tem `originalTitle`/`originalText` de notificação). |
| Abas Pendentes / Processados / Descartados | Não existe: só lista pendentes. |
| Processar abrindo formulário de lançamento pré-preenchido | Parcial: converter usa dados já salvos no pré-lançamento; não abre um “LancamentoDialog” para editar antes. |
| API de entrada para app (inbox + batch) | Fora do escopo deste plano (foco em ações na UI). |

---

## 4. Plano de cópia das ações (ordem sugerida)

### Fase 1: Modelo e backend

1. **Status “discarded”**
   - Adicionar status `DISCARDED` ao enum `PreTransactionStatus` no backend.
   - Migration: adicionar coluna `discarded_at` (opcional, para consistência com OpenMonetis) ou apenas usar `status`.
   - Regras: apenas PENDING pode ser descartado; descartar = atualizar status para DISCARDED (e `discarded_at` se existir). Não apagar registro.

2. **Endpoint descartar (single)**
   - `POST /pre-transactions/{id}/discard` (ou `PATCH /pre-transactions/{id}` com `status: "DISCARDED"`).
   - Retornar 400 se não for PENDING.

3. **Endpoint descartar em lote**
   - `POST /pre-transactions/discard-batch` com body `{ "ids": number[] }`.
   - Atualizar apenas itens PENDING do tenant; retornar quantidade atualizada.

4. **Listagem por status**
   - Garantir que `GET /pre-transactions/?status=` aceite PENDING, CONVERTED e DISCARDED e que o front use isso nas abas.

### Fase 2: Frontend – ações e abas

5. **Abas Pendentes / Processados / Descartados**
   - Na página Pré-Lançamentos, usar abas (Tabs) como no OpenMonetis.
   - Buscar lista com `status` conforme aba ativa (ou buscar todos e filtrar no cliente).
   - Pendentes: ações ativas; Processados e Descartados: somente leitura (badge de status + data).

6. **Descartar (single)**
   - Trocar o botão “Remover” por “Descartar” para itens pendentes, ou manter os dois:
     - **Descartar**: chama `POST .../discard` (ou PATCH), item vai para aba Descartados.
     - **Remover**: mantém DELETE para apagar permanentemente (opcional, pode ficar em menu “…”).
   - Diálogo de confirmação: “Descartar pré-lançamento? Ele não aparecerá mais nos pendentes.”

7. **Descartar em lote**
   - Na aba Pendentes: checkbox em cada linha (ou “selecionar todos”).
   - Botão “Descartar selecionados” que chama `POST /pre-transactions/discard-batch` com os ids.
   - Toast com quantidade descartada.

8. **Ver detalhes**
   - Se no futuro existir `original_title`/`original_text` (ex.: integração com app), abrir um diálogo somente leitura com esse conteúdo.
   - No modelo atual do BrainCash pode ser um “Ver detalhes” que mostra todos os campos do pré-lançamento (descrição, valor, data, categoria, conta, cartão, notas) em um modal/drawer.

### Fase 3: Alinhamento ao fluxo “Processar” (opcional)

9. **Processar = abrir formulário de lançamento**
   - Como no OpenMonetis: ao clicar “Processar”, abrir o mesmo formulário usado para criar transação (LancamentoDialog / TransactionForm), com campos pré-preenchidos a partir do pré-lançamento.
   - Ao salvar a transação: chamar `POST /pre-transactions/{id}/convert` (e no backend marcar como CONVERTED).
   - Isso já está parcialmente coberto no BrainCash (converter com dados atuais); melhorar seria apenas UX (abrir formulário de transação pré-preenchido em vez de converter direto).

---

## 5. Resumo das ações a implementar no BrainCash

| # | Ação | Onde | Prioridade |
|---|------|------|------------|
| 1 | Adicionar status DISCARDED + discarded_at (opcional) | Backend (model + migration) | Alta |
| 2 | POST/PATCH descartar um item | Backend | Alta |
| 3 | POST descartar em lote | Backend | Média |
| 4 | Abas Pendentes / Processados / Descartados | Frontend | Alta |
| 5 | Botão + confirmação “Descartar” (single) | Frontend | Alta |
| 6 | Seleção múltipla + “Descartar selecionados” | Frontend | Média |
| 7 | “Ver detalhes” (campos do pré-lançamento) | Frontend | Baixa |
| 8 | (Opcional) Processar = abrir formulário de transação pré-preenchido | Frontend | Baixa |

---

## 6. Referências de código OpenMonetis

- Ações: `D:\HomeAssistant\source\openmonetis\app\(dashboard)\pre-lancamentos\actions.ts`
- Dados/lista: `D:\HomeAssistant\source\openmonetis\app\(dashboard)\pre-lancamentos\data.ts`
- UI página: `D:\HomeAssistant\source\openmonetis\components\pre-lancamentos\inbox-page.tsx`
- Card e ações por item: `D:\HomeAssistant\source\openmonetis\components\pre-lancamentos\inbox-card.tsx`
- Schema BD: `D:\HomeAssistant\source\openmonetis\db\schema.ts` (tabela `pre_lancamentos`)

---

*Documento gerado para alinhar as ações de Pré-Lançamentos do BrainCash ao comportamento do OpenMonetis.*
