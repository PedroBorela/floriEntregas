# Plano de Implementação — Controle de Vendedores

> **Versão:** 1.0
> **Data:** 14/05/2026
> **Projeto:** floriEntregas — Natureza Em Flores

---

## Contexto

Adicionar o campo "Vendedor" aos pedidos para identificar quem realizou cada venda, permitindo futuras análises por vendedor e controle operacional. A associação é opcional — pedidos sem vendedor continuam válidos.

O fluxo principal é por modal: em qualquer ponto onde um pedido aparece (formulário, card, detalhe), é possível abrir o seletor e anexar ou trocar o vendedor. Vendedores são gerenciados em uma página dedicada sem exclusão física.

---

## Banco de Dados

### Migration `014_vendedores.sql`

```sql
CREATE TABLE vendedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pedidos
  ADD COLUMN vendedor_id UUID REFERENCES vendedores(id) ON DELETE SET NULL;

ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso_total_vendedores" ON vendedores FOR ALL USING (true);
```

> Não inserir vendedores padrão via migration — são dados de negócio, cadastrados pela UI de gerenciamento.

---

## API

### `GET /api/vendedores`
Lista todos os vendedores ativos, ordenados por nome.

### `POST /api/vendedores`
Cria um novo vendedor. Body: `{ nome: string }`.

### `PATCH /api/vendedores/[id]`
Edita nome ou alterna status ativo/inativo. Body: `{ nome?: string, ativo?: boolean }`.

### `PATCH /api/pedidos/[id]` (já existe)
Estender para aceitar `{ vendedor_id: string | null }` e atualizar apenas esse campo, sem tocar no restante do pedido.

---

## Tipos — `lib/types.ts`

Adicionar à interface `Pedido`:

```ts
vendedor_id: string | null
vendedor?: { id: string; nome: string } | null
```

Nova interface:

```ts
export interface Vendedor {
  id: string
  nome: string
  ativo: boolean
  created_at: string
}
```

---

## Componentes

### `ModalSeletorVendedor.tsx` (novo)

Modal central da feature. Lista os vendedores ativos como botões grandes (tap-friendly para celular).

**Comportamento:**
- Abre com o vendedor atual já marcado, se houver
- Campo de busca por nome (aparece se lista > 5 vendedores)
- Botão "Nenhum" para remover vínculo
- Ao confirmar → chama callback `onSelect(vendedor | null)`
- Não faz fetch diretamente — recebe lista via prop ou hook

### `VendedorBadge.tsx` (novo)

Pill de exibição simples: nome do vendedor ou "Sem vendedor". Variante clicável abre o `ModalSeletorVendedor`.

**Aparece em:**
- `CardPedido` — clicável, abre modal e faz PATCH ao confirmar
- Detalhe do pedido (`/pedidos/[codigo]`)
- `ModalEdicaoPedido`

---

## Fluxo de Uso

### Nos formulários (Entrega e Retirada)

Campo opcional "Vendedor" posicionado acima da seção de produtos. Exibe o nome selecionado + botão para abrir o modal. Salva `vendedor_id` no body do POST ao finalizar o pedido.

### Nos pedidos existentes

`VendedorBadge` clicável no `CardPedido` e no detalhe → abre `ModalSeletorVendedor` → ao confirmar faz `PATCH /api/pedidos/[id]` com `{ vendedor_id }` → atualiza estado local sem recarregar a página.

---

## Gerenciamento de Vendedores

Página `/vendedores` no dashboard:

- Lista de vendedores com nome e status (ativo / inativo)
- Botão "Novo vendedor" — input inline ou mini-modal com apenas o campo nome
- Toggle ativo/inativo por linha (não há exclusão física)
- Vendedores inativos ficam ocultos no seletor mas preservam o histórico nos pedidos existentes

---

## Ordem de Implementação

| Passo | O quê | Arquivos |
|---|---|---|
| 1 | Migration + aplicar no Supabase | `supabase/migrations/014_vendedores.sql` |
| 2 | Rotas da API de vendedores | `app/api/vendedores/route.ts`, `app/api/vendedores/[id]/route.ts` |
| 3 | Estender PATCH de pedidos | `app/api/pedidos/[id]/route.ts` |
| 4 | Atualizar tipos | `lib/types.ts` |
| 5 | `ModalSeletorVendedor` | `components/vendedores/ModalSeletorVendedor.tsx` |
| 6 | `VendedorBadge` + integrar no `CardPedido` | `components/vendedores/VendedorBadge.tsx`, `components/pedidos/CardPedido.tsx` |
| 7 | Integrar nos formulários de Entrega e Retirada | `components/formulario/FormularioEntrega.tsx`, `components/formulario/FormularioRetirada.tsx` |
| 8 | Exibir no detalhe do pedido e `ModalEdicaoPedido` | `app/(dashboard)/pedidos/[codigo]/page.tsx`, `components/pedidos/ModalEdicaoPedido.tsx` |
| 9 | Página de gerenciamento | `app/(dashboard)/vendedores/page.tsx` |

---

## Regras de Negócio

- Vendedor é sempre opcional — `vendedor_id` pode ser `null`
- Vendedores inativos não aparecem no seletor, mas o nome continua visível nos pedidos antigos
- Não há exclusão física de vendedores — apenas desativação
- Um pedido pode ter seu vendedor alterado a qualquer momento enquanto não estiver cancelado
- A listagem de pedidos deve exibir o nome do vendedor como informação secundária no card
