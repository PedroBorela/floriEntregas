# Plano de Implementação 2 — Integração do Catálogo de Produtos

**Data:** 2026-05-11  
**Projeto:** floriEntregas (app-pedidos)  
**Fonte de dados:** floriculturaCatalogoAntiGravity (`src/data.js` — 206 produtos)

---

## Objetivo

Integrar os 206 produtos catalogados no projeto `floriculturaCatalogoAntiGravity` ao sistema de pedidos `floriEntregas`, enriquecendo o banco de dados, melhorando a experiência de seleção de produtos nos formulários e adicionando novas funcionalidades de catálogo.

---

## Análise do Estado Atual

### O que existe no floriEntregas

- Tabela `produtos_catalogo` no Supabase com campos: `id`, `nome`, `preco_padrao`, `ativo`, `created_at`
- Hook `useProdutos(termo)` com busca por nome via `ilike`
- Componente `ProdutoLinhaItem.tsx` com autocomplete básico
- Produtos digitados livremente (sem vínculo ao catálogo) são permitidos

### O que existe no Catálogo

- 206 produtos com: `id`, `name`, `size`, `price`, `category`, `tip`
- 7 categorias: Vaso, Orquídea, Folhagem, Flor, Árvore, Corte, Especiais
- Dados estáticos em `src/data.js` (sem banco de dados)
- Imagens em `/plants/{id}.png`

### Gap a preencher

| Campo Catálogo | Campo atual Supabase | Ação necessária |
|---|---|---|
| `name` | `nome` | Migrar dados |
| `price` | `preco_padrao` | Migrar dados |
| `size` | ❌ ausente | Adicionar coluna |
| `category` | ❌ ausente | Adicionar coluna |
| `tip` | ❌ ausente | Adicionar coluna |
| imagem | ❌ ausente | Adicionar coluna `imagem_url` |

---

## Fases de Implementação

---

### Fase 1 — Migração e Enriquecimento do Banco de Dados

**Objetivo:** Levar os 206 produtos do JSON estático para o Supabase com todos os campos.

#### 1.1 — Migration SQL: adicionar colunas

Criar `app-pedidos/supabase/migrations/003_enriquecer_produtos_catalogo.sql`:

```sql
ALTER TABLE produtos_catalogo
  ADD COLUMN IF NOT EXISTS tamanho      TEXT,
  ADD COLUMN IF NOT EXISTS categoria    TEXT,
  ADD COLUMN IF NOT EXISTS dica_cuidado TEXT,
  ADD COLUMN IF NOT EXISTS imagem_url   TEXT;

-- Índice para filtro por categoria
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos_catalogo(categoria);
```

#### 1.2 — Script de seed: importar os 206 produtos

Criar `app-pedidos/scripts/seed-produtos.ts`:

- Ler `src/data.js` do projeto catálogo (ou copiar o array para `scripts/catalogo-data.ts`)
- Fazer `upsert` em `produtos_catalogo` mapeando os campos:
  - `name` → `nome`
  - `price` → `preco_padrao`
  - `size` → `tamanho`
  - `category` → `categoria`
  - `tip` → `dica_cuidado`
  - `ativo` = `true` para todos
- Executar com `npx ts-node scripts/seed-produtos.ts`

#### 1.3 — Imagens dos produtos

- Copiar `/plants/*.png` do catálogo para `app-pedidos/public/plants/`
- Popular coluna `imagem_url` com `/plants/{id_original}.png` durante o seed
- (Opcional futuro) fazer upload para Supabase Storage

**Resultado da Fase 1:** Banco de dados com 206 produtos completos, prontos para uso.

---

### Fase 2 — Atualização do Schema de Tipos TypeScript

**Objetivo:** Refletir as novas colunas nos tipos da aplicação.

#### 2.1 — Atualizar `lib/types.ts`

Atualizar o tipo `ProdutoCatalogo`:

```typescript
export type ProdutoCatalogo = {
  id: string
  nome: string
  preco_padrao: number
  tamanho: string | null
  categoria: string | null
  dica_cuidado: string | null
  imagem_url: string | null
  ativo: boolean
  created_at: string
}
```

Adicionar tipo auxiliar para as categorias disponíveis:

```typescript
export const CATEGORIAS_PRODUTO = [
  'Vaso', 'Orquídea', 'Folhagem', 'Flor', 'Árvore', 'Corte', 'Especiais'
] as const

export type CategoriaProduto = typeof CATEGORIAS_PRODUTO[number]
```

---

### Fase 3 — Melhoria do Autocomplete de Produtos nos Formulários

**Objetivo:** Enriquecer a experiência de seleção de produto nos formulários de pedido.

#### 3.1 — Atualizar `hooks/useProdutos.ts`

- Incluir os novos campos na query: `tamanho`, `categoria`, `dica_cuidado`, `imagem_url`
- Adicionar parâmetro opcional `categoria` para filtro adicional

```typescript
// Antes: busca apenas por nome
// Depois: retorna objeto completo com todos os campos
```

#### 3.2 — Atualizar `components/formulario/ProdutoLinhaItem.tsx`

No dropdown de sugestões, exibir:
- Nome do produto
- Tamanho (badge ao lado do nome, ex: "P15", "1 Haste")
- Categoria (label menor, em cinza)
- Preço padrão pré-preenchido ao selecionar
- Miniatura da imagem (16×16px ou 24×24px) se disponível

Ao selecionar um produto do catálogo:
- `nome_produto` preenchido automaticamente
- `valor_unitario` pré-preenchido com `preco_padrao` (editável)
- `produto_catalogo_id` vinculado

#### 3.3 — Filtro por categoria no campo de produtos

No componente `CampoProdutos.tsx`, adicionar chips de categoria opcionais acima da lista de itens para filtrar quais sugestões aparecem, usando os mesmos dados.

---

### Fase 4 — Página de Catálogo Interno

**Objetivo:** Criar uma página `/catalogo` dentro do dashboard para visualizar, buscar e gerenciar o catálogo de produtos sem sair do app.

#### 4.1 — Rota: `app/(dashboard)/catalogo/page.tsx`

Layout visual inspirado no `floriculturaCatalogoAntiGravity`:
- Grid responsivo de cards de produto
- Barra de busca por nome
- Filtros por categoria (chips/botões)
- Badge de tamanho em cada card
- Preço em destaque
- Dica de cuidado expansível (accordion ou tooltip)
- Imagem do produto se disponível

#### 4.2 — Funcionalidade de gerenciamento

Cada card do catálogo terá:
- Toggle ativo/inativo (para tirar produtos de temporada)
- Edição inline de preço padrão
- Modal de edição completa (nome, tamanho, categoria, preço, dica)

#### 4.3 — Ação "Adicionar ao Pedido"

Na página de catálogo, botão "Criar pedido com este produto" que:
- Navega para `/entrega` ou `/retirada`
- Pré-popula o produto no formulário (via query string ou estado global)

---

### Fase 5 — Relatórios e Visibilidade por Categoria

**Objetivo:** Aproveitar a categorização para gerar insights nos pedidos.

#### 5.1 — Filtro por categoria na listagem de pedidos

Na página `/pedidos`, adicionar filtro adicional: "Pedidos com [categoria]" para identificar períodos com alta demanda de orquídeas, flores de corte, etc.

#### 5.2 — Resumo de produtos por pedido

Na página de detalhe do pedido (`/pedidos/[codigo]`):
- Agrupar itens por categoria
- Mostrar badge de categoria em cada linha de produto
- Mostrar imagem miniatura do produto

#### 5.3 — Métricas de produtos mais pedidos

Adicionar seção no dashboard com ranking dos produtos mais vendidos, usando os dados de `pedido_itens` agrupados por `produto_catalogo_id`.

---

## Ordem de Execução Recomendada

```
Fase 1 (Dados)     ──►  Fase 2 (Tipos)  ──►  Fase 3 (Formulários)
                                          ──►  Fase 4 (Catálogo)
                                          ──►  Fase 5 (Relatórios)
```

Fases 3, 4 e 5 podem ser desenvolvidas em paralelo após Fase 2.

---

## Estimativa de Esforço

| Fase | Complexidade | Estimativa |
|---|---|---|
| Fase 1 — Migration + Seed | Baixa | 1–2h |
| Fase 2 — Tipos TypeScript | Baixa | 30min |
| Fase 3 — Autocomplete rico | Média | 3–4h |
| Fase 4 — Página Catálogo | Alta | 6–8h |
| Fase 5 — Relatórios | Média | 3–4h |
| **Total** | | **~14–18h** |

---

## Dependências e Riscos

| Item | Observação |
|---|---|
| IDs dos produtos | O catálogo usa IDs numéricos; o Supabase usa UUIDs. O seed deve criar novos UUIDs e guardar o `id_original` se necessário. |
| Imagens | Os arquivos `.png` do catálogo precisam ser copiados ou hospedados. |
| Produtos livres | Manter suporte a produtos sem vínculo com catálogo (`produto_catalogo_id = NULL`). |
| Atualização futura | Criar mecanismo para atualizar preços do catálogo sem perder histórico dos pedidos. |
| Categorias | As 7 categorias atuais cobrem bem o catálogo; validar se novos produtos precisarão de novas categorias. |

---

## Arquivos a Criar/Modificar

### Criar
- `app-pedidos/supabase/migrations/003_enriquecer_produtos_catalogo.sql`
- `app-pedidos/scripts/seed-produtos.ts`
- `app-pedidos/scripts/catalogo-data.ts` (cópia do `data.js` em TypeScript)
- `app-pedidos/app/(dashboard)/catalogo/page.tsx`
- `app-pedidos/components/catalogo/CardProduto.tsx`
- `app-pedidos/components/catalogo/FiltroCategorias.tsx`

### Modificar
- `app-pedidos/lib/types.ts` — adicionar campos ao tipo `ProdutoCatalogo`
- `app-pedidos/hooks/useProdutos.ts` — incluir novos campos na query
- `app-pedidos/components/formulario/ProdutoLinhaItem.tsx` — enriquecer autocomplete
- `app-pedidos/components/formulario/CampoProdutos.tsx` — filtro por categoria
- `app-pedidos/app/(dashboard)/pedidos/[codigo]/page.tsx` — badges de categoria
