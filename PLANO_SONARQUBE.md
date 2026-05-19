# Plano de Correções SonarQube — Issues Pendentes

Issues que exigem atenção cuidadosa e foram deixados para implementação planejada.
Todas as correções abaixo foram identificadas via SonarQube (projeto `PedroBorela_floriEntregas`).

---

## 1. Cognitive Complexity — CRITICAL (S3776)

> Regra: funções não devem ter complexidade cognitiva acima de 15.

| Arquivo | Complexidade atual | Meta |
|---|---|---|
| `app/api/pedidos/[id]/route.ts` | 77 | ≤ 15 |
| `components/pedidos/BotaoWhatsApp.tsx` | 23 | ≤ 15 |
| `components/impressao/ComandaImpressao.tsx` | 17 | ≤ 15 |
| `app/(dashboard)/pedidos/PaginaPedidos.tsx` | 16 | ≤ 15 |
| `app/api/pedidos/route.ts` | 18 | ≤ 15 |

### Como resolver

**`app/api/pedidos/[id]/route.ts`** (maior prioridade — complexidade 77)
- Extrair cada `acao` do PATCH em handlers separados: `handleMarcarWhatsapp()`, `handleAtualizarStatus()`, `handleAtualizarPagamento()`, etc.
- Criar uma função `dispatch(acao, body, pedidoId)` que roteia para o handler correto.

**`components/pedidos/BotaoWhatsApp.tsx`** (complexidade 23)
- Extrair `gerarMensagemConfirmacao(pedido)` e `gerarMensagemSaiuEntrega(pedido)` separados.
- Mover a lógica de endereço para `formatarEndereco(pedido)`.

**`app/api/pedidos/route.ts`** (complexidade 18)
- Extrair a construção dos filtros da query para uma função `buildPedidosQuery(params)`.

**`app/(dashboard)/pedidos/PaginaPedidos.tsx` e `ComandaImpressao.tsx`** (complexidade 16-17)
- Extrair blocos de JSX condicional em subcomponentes menores.

---

## 2. Ternários Aninhados — MAJOR (S3358)

> Regra: ternários aninhados dificultam a leitura — extrair em variável ou if/else.

Padrão de correção:
```tsx
// Antes (aninhado — ruim)
const label = a ? 'x' : b ? 'y' : 'z'

// Depois (claro)
let label = 'z'
if (a) label = 'x'
else if (b) label = 'y'
```

| Arquivo | Linhas | Descrição |
|---|---|---|
| `app/(dashboard)/dashboard/page.tsx` | 165–177 | Status do dashboard |
| `app/(dashboard)/analytics/page.tsx` | 159–178 | Renderização de KPIs |
| `app/(dashboard)/catalogo/page.tsx` | 200–246 | Exibição de cards do catálogo |
| `app/(dashboard)/clientes/page.tsx` | 81–123 | Lista de clientes |
| `app/p/[codigo]/page.tsx` | 113–115 | Status público do pedido |
| `components/dashboard/SinaisDeGestao.tsx` | 27–28 | Sinais de gestão |
| `components/dashboard/BadgeAtrasados.tsx` | 135, 138 | Badge de atraso |
| `components/dashboard/HeaderSaudacao.tsx` | 5 | Saudação por horário |
| `components/pedidos/StatusDropdown.tsx` | 55–57 | Dropdown de status |
| `components/pedidos/ModalStatus.tsx` | 31–33 | Modal de status |
| `components/pedidos/PainelStatus.tsx` | 134–136 | Painel de status |
| `components/pedidos/ListaPedidos.tsx` | 243–290 | Lista de pedidos |
| `components/formulario/FormularioBalcao.tsx` | 63 | Valor pago parcial |
| `components/impressao/ComandaImpressao.tsx` | 156–164 | Status de pagamento na comanda |

---

## 3. Labels de Formulário sem Controle Associado — MAJOR (S6853)

> Regra: todo `<label>` deve ter `htmlFor` apontando para o `id` do input correspondente
> (ou envolver o input diretamente).

| Arquivo | Linhas | Labels afetados |
|---|---|---|
| `app/(dashboard)/clientes/[id]/page.tsx` | 355, 365, 380, 390, 400, 409, 419 | Campos de edição de endereço/perfil |
| `app/(dashboard)/catalogo/page.tsx` | 290, 299 | Campos do catálogo |
| `components/formulario/FormularioBalcao.tsx` | 185, 207 | Campos do formulário de balcão |
| `components/endereco/CampoEndereco.tsx` | 261 | Campo de endereço |
| `components/pedidos/ModalEdicaoPedido.tsx` | 277 | Campo no modal de edição |

### Como resolver

```tsx
// Antes
<label className="...">Nome</label>
<input type="text" ... />

// Depois (opção 1 — htmlFor + id)
<label htmlFor="campo-nome" className="...">Nome</label>
<input id="campo-nome" type="text" ... />

// Depois (opção 2 — label envolvendo o input)
<label className="...">
  Nome
  <input type="text" ... />
</label>
```

---

## 4. Condições Negadas — MINOR (S7735)

> Regra: evitar `!condition` como ramo principal — inverter a condição.

```tsx
// Antes
{!carregando ? <Conteudo /> : <Spinner />}

// Depois
{carregando ? <Spinner /> : <Conteudo />}
```

| Arquivo | Linha |
|---|---|
| `components/dashboard/BadgeAtrasados.tsx` | 71 |
| `components/dashboard/BadgeDevedores.tsx` | 77 |
| `components/pedidos/ListaPedidos.tsx` | 257, 275 |
| `components/vendedores/ModalSeletorVendedor.tsx` | 81 |
| `components/impressao/BotaoImprimir.tsx` | 89 |

---

## 5. Acessibilidade — MAJOR (S6848 / S1082)

> Regra: elementos não-nativos com interação devem ter `role` e suporte a teclado.

| Arquivo | Linha | Problema |
|---|---|---|
| `app/(dashboard)/catalogo/page.tsx` | 254–257 | `<div onClick>` sem `role` e sem `onKeyDown` |

### Como resolver

```tsx
// Antes
<div onClick={handleClick} className="...">...</div>

// Depois
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
  className="..."
>
  ...
</div>
```

---

## 6. Outros — MINOR

| Regra | Arquivo | Linha | Correção |
|---|---|---|---|
| S4325 — Asserção de tipo desnecessária | `components/ui/Navbar.tsx` | 31 | Remover `as Node` se TypeScript permitir |
| S4325 — Asserção de tipo desnecessária | `app/(dashboard)/catalogo/page.tsx` | 105 | Remover cast desnecessário |
| S6571 — `any` em union type | `app/(dashboard)/clientes/[id]/page.tsx` | 40, 50 | Substituir `any` pelo tipo correto |
| S6479 — Index como key | `app/(dashboard)/dashboard/page.tsx` | Skeleton | Aceitável em skeleton — marcar como `// NOSONAR` se necessário |
| S3863 — Import duplicado | (resolvido) | — | Já corrigido |

---

## Ordem de Prioridade Sugerida

1. **`app/api/pedidos/[id]/route.ts`** — complexidade 77, maior risco de bug oculto
2. **Labels de formulário** (S6853) — acessibilidade, impacta usuários com leitores de tela
3. **Ternários aninhados** (S3358) — manutenção, começar pelos componentes mais simples
4. **Condições negadas** (S7735) — mudanças triviais, baixo risco
5. **Acessibilidade no catálogo** (S6848) — adicionar role/teclado no `<div onClick>`
6. **Cognitive Complexity** nos demais arquivos — refatoração mais complexa
