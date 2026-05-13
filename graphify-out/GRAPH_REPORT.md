# Graph Report - floriEntregas  (2026-05-13)

## Corpus Check
- 62 files · ~2,812,493 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 144 nodes · 99 edges · 7 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]

## God Nodes (most connected - your core abstractions)
1. `GET()` - 7 edges
2. `PATCH()` - 4 edges
3. `POST()` - 3 edges
4. `atalhosDatas()` - 3 edges
5. `carregar()` - 2 edges
6. `DELETE()` - 2 edges
7. `logStatus()` - 2 edges
8. `mascaraCep()` - 2 edges
9. `handleCepChange()` - 2 edges
10. `set()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `set()`  [INFERRED]
  app\api\pedidos\route.ts → components\endereco\CampoEndereco.tsx
- `PATCH()` --calls--> `DELETE()`  [INFERRED]
  app\api\pedidos\[id]\route.ts → app\api\clientes\[id]\datas\[dataId]\route.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.29
Nodes (2): GET(), POST()

### Community 2 - "Community 2"
Cohesion: 0.33
Nodes (3): handleCepChange(), mascaraCep(), set()

### Community 3 - "Community 3"
Cohesion: 0.33
Nodes (1): carregar()

### Community 4 - "Community 4"
Cohesion: 0.4
Nodes (3): DELETE(), logStatus(), PATCH()

### Community 6 - "Community 6"
Cohesion: 0.6
Nodes (3): aplicarAtalho(), atalhosDatas(), formatISO()

### Community 11 - "Community 11"
Cohesion: 0.67
Nodes (2): BotaoWhatsApp(), limparTelefone()

### Community 12 - "Community 12"
Cohesion: 0.67
Nodes (2): calcularAlerta(), CardPedido()

## Knowledge Gaps
- **Thin community `Community 0`** (8 nodes): `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `GET()`, `POST()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 3`** (6 nodes): `page.tsx`, `page.tsx`, `carregar()`, `handlePrecoChange()`, `handleToggleAtivo()`, `salvarEdicao()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (4 nodes): `BotaoWhatsApp()`, `gerarMensagem()`, `limparTelefone()`, `BotaoWhatsApp.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (4 nodes): `calcularAlerta()`, `CardPedido()`, `formatarData()`, `CardPedido.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GET()` connect `Community 0` to `Community 2`, `Community 4`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `set()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._