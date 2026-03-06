# Mapeamento Descrição → Categoria (com tipo)

## Requisitos

1. **Não cadastrar a mesma descrição mais de uma vez para a mesma categoria** – O mapeamento deve ser único por `(descrição, tipo, categoria)`.

2. **Cadastrar junto o tipo (despesa ou receita)** – O mapeamento deve incluir `transaction_type` (EXPENSE ou INCOME).

3. **Mesma descrição, tipos diferentes → categorias diferentes** – Ex.: "PIX" como despesa pode mapear para "Transferências", enquanto "PIX" como receita pode mapear para "Salário".

## Alterações no backend

### Modelo de dados

- Incluir `transaction_type` (EXPENSE | INCOME) na tabela de mapeamento descrição–categoria.
- Garantir unicidade em `(category_id, description, transaction_type)`.

### Endpoints

- **GET `/categories/{id}/description-mappings`** – Retornar `transaction_type` em cada item.
- **GET `/categories/by-description/mappings`** – Aceitar parâmetro opcional `transaction_type` para filtrar.
- **PUT `/pre-transactions/{id}`** (com `category_id`) – Ao criar/atualizar o mapeamento, usar `description` e `transaction_type` do pré-lançamento.

### Ao processar pré-lançamento

- Ao converter em transação ou ao atualizar categoria, criar mapeamento com `(description, transaction_type, category_id)`.
- Evitar duplicatas: se já existir mapeamento para `(description, transaction_type)` na mesma categoria, não inserir novamente.
