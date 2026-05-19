# Script References — FloriEntregas

Índice de todos os scripts do projeto, organizados por categoria.

---

## npm Scripts (`package.json`)

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `next dev` | Inicia o servidor de desenvolvimento Next.js |
| `build` | `next build` | Compila a aplicação para produção |
| `start` | `next start` | Inicia o servidor de produção |
| `lint` | `next lint` | Executa o ESLint para verificação de qualidade de código |

---

## API Routes (`app/api/`)

### Pedidos

| Arquivo | Métodos | Descrição |
|---------|---------|-----------|
| `app/api/pedidos/route.ts` | GET, POST | Lista pedidos com filtros; cria novo pedido |
| `app/api/pedidos/[id]/route.ts` | PATCH, DELETE | Avança status, cancela, marca WhatsApp enviado, atribui vendedor, edita, marca como impresso; exclui pedido |

### Clientes

| Arquivo | Métodos | Descrição |
|---------|---------|-----------|
| `app/api/clientes/route.ts` | GET, POST | Lista clientes com busca e paginação; cria novo cliente |
| `app/api/clientes/[id]/route.ts` | GET, PATCH, DELETE | Busca detalhes do cliente com dados relacionados; atualiza; exclui (somente sem pedidos) |
| `app/api/clientes/[id]/datas/route.ts` | POST | Cadastra data especial para o cliente com associação ao vendedor |
| `app/api/clientes/[id]/datas/[dataId]/route.ts` | DELETE | Remove uma data especial |
| `app/api/clientes/[id]/notas/route.ts` | POST | Adiciona nota de preferência ou observação ao cliente |
| `app/api/clientes/[id]/notas/[notaId]/route.ts` | DELETE | Remove uma nota do cliente |

### Endereços

| Arquivo | Métodos | Descrição |
|---------|---------|-----------|
| `app/api/enderecos/[id]/route.ts` | PATCH, DELETE | Atualiza ou exclui endereço cadastrado |

### Vendedores

| Arquivo | Métodos | Descrição |
|---------|---------|-----------|
| `app/api/vendedores/route.ts` | GET, POST | Lista todos os vendedores; cadastra novo vendedor |
| `app/api/vendedores/[id]/route.ts` | PATCH, DELETE | Atualiza ou exclui vendedor |

### Catálogo

| Arquivo | Métodos | Descrição |
|---------|---------|-----------|
| `app/api/catalogo/[id]/route.ts` | PATCH | Atualiza preço, nome ou imagem de produto do catálogo |

### Utilitários de Localização

| Arquivo | Métodos | Descrição |
|---------|---------|-----------|
| `app/api/cep/[cep]/route.ts` | GET | Consulta endereço a partir do CEP via API ViaCEP |
| `app/api/geocoding/route.ts` | GET | Busca coordenadas geográficas via OpenStreetMap Nominatim |

### Rastreamento Público (QR Code)

| Arquivo | Métodos | Descrição |
|---------|---------|-----------|
| `app/api/p/[codigo]/route.ts` | GET, POST | Retorna status do pedido pelo código; marca pedido como entregue via QR Code |

### Dashboard

| Arquivo | Métodos | Descrição |
|---------|---------|-----------|
| `app/api/dashboard/kpis/route.ts` | GET | KPIs gerais: faturamento hoje/semana/mês, pedidos, ticket médio, valores a receber |
| `app/api/dashboard/pedidos-hoje/route.ts` | GET | Lista pedidos do dia atual |
| `app/api/dashboard/atrasados/route.ts` | GET | Lista pedidos atrasados |
| `app/api/dashboard/devedores/route.ts` | GET | Clientes com pedidos não pagos e total em aberto |
| `app/api/dashboard/vendedores-hoje/route.ts` | GET | Desempenho dos vendedores no dia |
| `app/api/dashboard/pulso/route.ts` | GET | Métricas gerais de saúde do negócio (pulso) |
| `app/api/dashboard/meta-datas/route.ts` | GET | Datas especiais próximas para o cronômetro/termômetro de metas |

### Analytics

| Arquivo | Métodos | Descrição |
|---------|---------|-----------|
| `app/api/analytics/route.ts` | GET | Analytics completo: top produtos, breakdown diário, formas de pagamento, top clientes e vendedores |
| `app/api/analytics/vendedores/route.ts` | GET | Analytics por vendedor |
| `app/api/analytics/pedidos-insight/route.ts` | GET | Insights de pedidos com breakdown por quantidade |
| `app/api/analytics/datas-proximas/route.ts` | GET | Datas especiais de clientes próximas da data atual |
| `app/api/analytics/clientes/route.ts` | GET | Analytics e segmentação de clientes |

---

## Migrações SQL (`supabase/migrations/`)

| Arquivo | Descrição |
|---------|-----------|
| `001_clientes.sql` | Cria tabela `clientes` com nome, telefone e índices |
| `002_produtos_catalogo.sql` | Cria tabela `produtos_catalogo` com nome, preço e status ativo |
| `003_zonas_frete.sql` | Cria tabela `zonas_frete` (zonas de entrega e frete) |
| `004_pedidos.sql` | Cria tabela `pedidos` com detalhes do pedido, endereço de entrega e campos de pagamento |
| `005_pedido_itens.sql` | Cria tabela `pedido_itens` para itens de linha do pedido |
| `006_codigo_pedido_telefone.sql` | Adiciona geração de código único e coluna de telefone em pedidos |
| `007_enriquecer_produtos_catalogo.sql` | Adiciona categoria, dicas de cuidado e URL de imagem ao catálogo |
| `008_atualizar_zonas_frete.sql` | Atualiza estrutura da tabela de zonas de frete |
| `009_cancelamento_e_whatsapp.sql` | Adiciona campos de motivo de cancelamento e rastreamento de notificação WhatsApp |
| `010_clientes_datas_especiais.sql` | Cria tabelas `cliente_datas` e `cliente_notas`; adiciona campos de WhatsApp aos clientes |
| `011_horario_entrega_text.sql` | Converte campo de horário de entrega para tipo TEXT |
| `012_normalizacao_fase1.sql` | Cria tabelas normalizadas: `enderecos`, `destinatarios`, `pagamentos`, `notificacoes_whatsapp`, `pedido_status_log` |
| `013_normalizacao_fase2_backfill.sql` | Migração de dados para a fase 2 de normalização |
| `014_vendedores.sql` | Cria tabela `vendedores` para representantes de vendas |
| `015_presente_anonimo.sql` | Adiciona campos de presente anônimo aos pedidos |
| `016_venda_balcao.sql` | Adiciona suporte ao tipo de venda balcão nos pedidos |

---

## Scripts Utilitários (`scripts/`)

| Arquivo | Como executar | Descrição |
|---------|--------------|-----------|
| `scripts/catalogo-data.ts` | — (importado) | Arquivo de dados com 207 produtos florais (nome, tamanho, preço, categoria, dicas de cuidado). Usado como fonte para seed do catálogo |
| `scripts/seed-produtos.ts` | `npx ts-node --project tsconfig.json scripts/seed-produtos.ts` | Importa os produtos do catálogo para o Supabase via upsert. Requer `.env.local` com credenciais |
| `scripts/migrate.mjs` | `DB_PASSWORD=senha node scripts/migrate.mjs` | Aplica migrações SQL diretamente via conexão PostgreSQL. Requer variável de ambiente `DB_PASSWORD` |
