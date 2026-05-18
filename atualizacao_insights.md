# Plano de Atualização — Analytics com Insights por Entidade

**Data:** 2026-05-18  
**Objetivo:** Expandir a página `/analytics` com abas dedicadas a Clientes, Pedidos e Vendedores, aproveitando todas as tabelas do banco já existentes.

---

## Situação Atual

A página `/analytics` exibe:
- KPIs gerais (receita, pedidos, ticket, a receber)
- Histórico diário em gráfico de barras
- Ranking de vendedores (por receita)
- Forma de pagamento (% por tipo)
- Top produtos (por receita)
- Datas especiais próximas
- Top clientes (por receita)

**Limitações:** tudo está numa tela única sem hierarquia. Não há análise profunda de comportamento de cliente, ciclo de vida do pedido, desempenho por bairro/zona, taxa de cancelamento, etc.

---

## Arquitetura Proposta

### Estrutura de Abas

```
/analytics
  ├── [Visão Geral]    ← conteúdo atual reorganizado
  ├── [Clientes]       ← NOVO
  ├── [Pedidos]        ← NOVO
  └── [Vendedores]     ← expandido do atual
```

A seleção de período (7/30/90 dias) persiste globalmente entre abas.

### Organização de Arquivos

```
app/
  (dashboard)/
    analytics/
      page.tsx                    ← refatorado para abas
  api/
    analytics/
      route.ts                    ← mantido (visão geral)
      datas-proximas/route.ts     ← mantido
      clientes/route.ts           ← NOVO
      pedidos-insight/route.ts    ← NOVO
      vendedores/route.ts         ← NOVO

components/
  analytics/
    VisaoGeral.tsx                ← conteúdo atual extraído
    ClientesInsights.tsx          ← NOVO
    PedidosInsights.tsx           ← NOVO
    VendedoresInsights.tsx        ← NOVO
    shared/
      BarraProgresso.tsx          ← reutilizável entre abas
      TabelaRanking.tsx           ← reutilizável entre abas
```

---

## Aba: Clientes

### Métricas a Implementar

#### KPIs do Topo (cards)
| Métrica | Fonte | Cálculo |
|---|---|---|
| Clientes únicos no período | `pedidos.cliente_id` | `COUNT(DISTINCT cliente_id)` |
| Clientes novos | `pedidos` + `clientes.created_at` | clientes cujo primeiro pedido é no período |
| Clientes recorrentes | `pedidos` | clientes com ≥ 2 pedidos no período |
| LTV médio (lifetime) | `pedidos.valor_total` | `SUM(valor_total) / COUNT(DISTINCT cliente_id)` total histórico |
| Ticket médio por cliente | `pedidos.valor_total` | `SUM(valor_total) / COUNT(DISTINCT cliente_id)` no período |
| Frequência média | `pedidos` | `COUNT(pedidos) / COUNT(DISTINCT cliente_id)` no período |

#### Tabela: Top 10 Clientes
Colunas: Nome · Total de pedidos · Receita total · Último pedido · Ticket médio

Query principal:
```sql
SELECT
  cliente_id, cliente_nome,
  COUNT(*) AS total_pedidos,
  SUM(valor_total) AS receita,
  MAX(data_entrega) AS ultimo_pedido,
  SUM(valor_total) / COUNT(*) AS ticket_medio
FROM pedidos
WHERE data_entrega >= $inicio
  AND status NOT IN ('cancelado')
GROUP BY cliente_id, cliente_nome
ORDER BY receita DESC
LIMIT 10
```

#### Gráfico: Distribuição por Bairro
- `pedidos` JOIN `enderecos` via `endereco_id`
- Agrupa por `enderecos.bairro`, conta pedidos e soma receita
- Exibir como barras horizontais Top 8 bairros

#### Segmento: Novos vs Recorrentes
- Donut/pizza mostrando % de pedidos de clientes novos (primeiro pedido no período) vs recorrentes
- Comparativo: ticket médio de novos vs recorrentes

#### Calendário de Datas Especiais
- Já existe via `/api/analytics/datas-proximas`
- Mover para esta aba com listagem mais rica (nome do cliente, tipo de data, dias restantes, link para novo pedido)

### API: `GET /api/analytics/clientes?dias=30`

```typescript
// Retorna:
{
  kpis: {
    clientes_unicos: number
    clientes_novos: number
    clientes_recorrentes: number
    ltv_medio: number
    ticket_medio: number
    frequencia_media: number
  }
  top_clientes: Array<{
    cliente_id: string
    cliente_nome: string
    total_pedidos: number
    receita: number
    ultimo_pedido: string
    ticket_medio: number
  }>
  por_bairro: Array<{
    bairro: string
    total_pedidos: number
    receita: number
  }>
  novos_vs_recorrentes: {
    novos: number
    recorrentes: number
    ticket_novos: number
    ticket_recorrentes: number
  }
}
```

---

## Aba: Pedidos

### Métricas a Implementar

#### KPIs do Topo
| Métrica | Fonte | Cálculo |
|---|---|---|
| Taxa de conclusão | `pedidos.status` | `(entregue + retirado) / total * 100` |
| Taxa de cancelamento | `pedidos.status` | `cancelado / total * 100` |
| Pedidos com atraso entregues | `pedidos` | `data_entrega < updated_at::date` onde `status = 'entregue'` |
| Pedidos com cartão-mensagem | `pedidos.tem_cartao` | `COUNT WHERE tem_cartao = true` |
| Valor médio do frete | `pedidos.valor_frete` | `AVG(valor_frete) WHERE tipo = 'entrega'` |

#### Gráfico: Distribuição por Status
- Donut com contagem de cada status no período
- Cores: mesmas do `PulsoOperacional`

#### Gráfico: Pedidos por Dia da Semana
- Agrupa `data_entrega` por `EXTRACT(DOW FROM data_entrega)` (0=Dom … 6=Sáb)
- Barra mostrando volume de pedidos por dia da semana
- Útil para planejamento de capacidade

#### Gráfico: Pedidos por Faixa de Horário
- Categorias: Manhã (08-12h), Tarde (12-18h), Noite (18-22h), Sem horário
- Baseado em `horario_entrega` TEXT parsing
- Relevante para operação de entregas

#### Tabela: Cancelamentos por Motivo
- `pedidos WHERE status = 'cancelado' AND motivo_cancelamento IS NOT NULL`
- Agrupa por `motivo_cancelamento`, conta, % do total de cancelamentos

#### Tabela: Distribuição por Tipo e Zona
- Tipo (Entrega / Retirada / Balcão) × Zona de Frete
- `pedidos` JOIN `zonas_frete` via `zona_frete_id`

#### Análise: Ciclo de Status (`pedido_status_log`)
- Tempo médio entre criação e primeiro status terminal
- Baseado em `pedido_status_log`: `created_at` do log com `status_novo = 'entregue'` menos `created_at` do pedido
- Exibir como "tempo médio de conclusão: X horas"

### API: `GET /api/analytics/pedidos-insight?dias=30`

```typescript
// Retorna:
{
  kpis: {
    taxa_conclusao: number        // %
    taxa_cancelamento: number     // %
    pedidos_com_cartao: number
    frete_medio: number
    tempo_medio_conclusao_horas: number | null
  }
  por_status: Array<{ status: string; total: number }>
  por_dia_semana: Array<{ dia: number; label: string; total: number }>
  por_faixa_horario: Array<{ faixa: string; total: number }>
  cancelamentos_por_motivo: Array<{ motivo: string; total: number; pct: number }>
  por_tipo_zona: Array<{
    tipo: string
    zona: string
    total: number
    receita: number
  }>
}
```

---

## Aba: Vendedores

### Métricas a Implementar (expansão do ranking atual)

#### KPIs do Topo
| Métrica | Fonte | Cálculo |
|---|---|---|
| Vendedores ativos no período | `pedidos.vendedor_id` | `COUNT(DISTINCT vendedor_id)` |
| Maior receita individual | `pedidos` | vendedor com maior `SUM(valor_total)` |
| Maior número de pedidos | `pedidos` | vendedor com maior `COUNT(*)` |
| Taxa de cancelamento média | `pedidos` | `cancelados / total` por vendedor |

#### Tabela: Ranking Completo de Vendedores
Colunas: Posição · Nome · Pedidos · Receita · Ticket Médio · % Entrega vs Retirada · Cancelamentos

Query:
```sql
SELECT
  v.nome,
  COUNT(p.id) AS total_pedidos,
  SUM(CASE WHEN p.status != 'cancelado' THEN p.valor_total ELSE 0 END) AS receita,
  AVG(CASE WHEN p.status != 'cancelado' THEN p.valor_total END) AS ticket_medio,
  SUM(CASE WHEN p.tipo = 'entrega' AND p.status != 'cancelado' THEN 1 ELSE 0 END) AS entregas,
  SUM(CASE WHEN p.tipo = 'retirada' AND p.status != 'cancelado' THEN 1 ELSE 0 END) AS retiradas,
  SUM(CASE WHEN p.status = 'cancelado' THEN 1 ELSE 0 END) AS cancelados
FROM vendedores v
LEFT JOIN pedidos p ON p.vendedor_id = v.id AND p.data_entrega >= $inicio
WHERE v.ativo = true
GROUP BY v.id, v.nome
ORDER BY receita DESC
```

#### Gráfico: Evolução Mensal por Vendedor
- Série temporal: últimos N meses com receita de cada vendedor
- Linhas coloridas por vendedor
- Permite ver quem está crescendo vs estagnando

#### Gráfico: Mix de Tipo de Pedido por Vendedor
- Barras empilhadas: Entrega / Retirada / Balcão
- Mostra o perfil de atendimento de cada vendedor

#### Destaque: Vendedor do Mês
- Card especial no topo com foto/inicial + métricas do melhor vendedor no período

### API: `GET /api/analytics/vendedores?dias=30`

```typescript
// Retorna:
{
  kpis: {
    vendedores_ativos: number
    maior_receita: { nome: string; valor: number }
    maior_volume: { nome: string; total: number }
  }
  ranking: Array<{
    nome: string
    total_pedidos: number
    receita: number
    ticket_medio: number
    entregas: number
    retiradas: number
    cancelados: number
    pct_cancelamento: number
  }>
  evolucao_mensal: Array<{
    mes: string            // "2026-04"
    por_vendedor: Array<{ nome: string; receita: number }>
  }>
}
```

---

## Aba: Visão Geral (conteúdo atual reorganizado)

Sem novas métricas — apenas reorganizar o que já existe:
- KPIs gerais (mantidos)
- Gráfico de histórico (mantido)
- Formas de pagamento (mantido)
- Top produtos (mantido)
- Top clientes (movido para aba Clientes, aqui fica resumo de 3)
- Ranking vendedores (movido para aba Vendedores, aqui fica top 3)
- Datas especiais (movido para aba Clientes, aqui fica próximos 3)

---

## Ordem de Implementação

### Fase 1 — Refatorar página para abas
1. Extrair conteúdo atual de `analytics/page.tsx` para `components/analytics/VisaoGeral.tsx`
2. Implementar sistema de abas na `page.tsx` com seletor de período persistido
3. Criar `ClientesInsights.tsx`, `PedidosInsights.tsx`, `VendedoresInsights.tsx` com skeletons

### Fase 2 — Aba Vendedores (menor esforço, maior impacto imediato)
4. Criar `GET /api/analytics/vendedores`
5. Preencher `VendedoresInsights.tsx` com ranking completo + KPIs
6. Adicionar gráfico de mix de tipo por vendedor

### Fase 3 — Aba Clientes
7. Criar `GET /api/analytics/clientes`
8. Preencher `ClientesInsights.tsx` com top clientes, bairros, novos vs recorrentes
9. Mover datas especiais para esta aba

### Fase 4 — Aba Pedidos
10. Criar `GET /api/analytics/pedidos-insight`
11. Preencher `PedidosInsights.tsx` com distribuição de status, dia da semana, horários, cancelamentos

### Fase 5 — Polimento
12. Componentes compartilhados `BarraProgresso.tsx` e `TabelaRanking.tsx`
13. Estados vazios (sem dados no período)
14. Responsividade mobile das novas tabelas

---

## Componentes Gráficos

O projeto já usa `recharts` para os gráficos atuais (BarChart, LineChart). As novas visualizações usarão:

| Visualização | Componente Recharts |
|---|---|
| Distribuição status (donut) | `PieChart` + `Cell` |
| Pedidos por dia da semana | `BarChart` (horizontal) |
| Mix tipo/vendedor | `BarChart` empilhado (`stackId`) |
| Evolução mensal vendedores | `LineChart` multi-série |
| Novos vs Recorrentes | `PieChart` simples |

---

## Notas Técnicas

- Todas as APIs seguem o padrão existente: Server Route Handler + `supabase` singleton, sem Server Components.
- `pedido_status_log` existe na migração 012 mas pode não ter dados históricos — tratar `null` graciosamente.
- `bairro` sempre via join `enderecos`, nunca da coluna direta em `pedidos` (divergência schema/prod confirmada).
- `valor_total` em `pedidos` é a fonte de receita; `pagamentos.valor` é para análise de recebíveis.
- Vendedores com `pedidos.vendedor_id = null` devem aparecer como "Sem vendedor" ou serem filtrados conforme UX.
- Período "hoje" (dias=1) pode ter poucos dados — não esconder cards, mostrar "—" quando `n=0`.