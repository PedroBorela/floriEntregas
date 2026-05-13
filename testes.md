# Testes — floriEntregas

Checklist completo pós-migração (Fase 5 — DROP COLUMN executado).
Marque cada item após verificar. Teste em produção (Railway) e localmente se necessário.

---

## 1. Pedido de entrega — criação

- [ ] Acessar `/entrega`
- [ ] Preencher nome e telefone do comprador
- [ ] Adicionar pelo menos 1 produto com quantidade e valor
- [ ] Digitar um CEP válido e confirmar que o endereço é preenchido automaticamente (ViaCEP)
- [ ] Confirmar que a zona de frete é detectada e o valor de frete aparece
- [ ] Conferir que o total = subtotal produtos + frete
- [ ] Definir data e janela de horário (Manhã / Tarde / Noite)
- [ ] Testar "Horário específico..." e digitar um horário manual
- [ ] Salvar pedido → deve redirecionar para `/pedidos` com o novo pedido listado
- [ ] Abrir o detalhe do pedido criado e conferir:
  - [ ] Endereço aparece corretamente (logradouro, número, bairro, cidade/estado)
  - [ ] Frete e total batem
  - [ ] Status inicial = `pendente`

## 2. Pedido de entrega — presente (destinatário diferente)

- [ ] Acessar `/entrega`
- [ ] Marcar "Este pedido é um presente?"
- [ ] Preencher nome e telefone do destinatário
- [ ] Salvar pedido
- [ ] No detalhe: verificar que aparece "De (comprador):" e "Para (destinatário):" com os nomes corretos
- [ ] Na comanda impressa: verificar mesma distinção comprador / destinatário
- [ ] Criar outro pedido SEM marcar presente → detalhe deve mostrar apenas "Cliente:" (sem campo destinatário)

## 3. Pedido de entrega — cartão e pagamento

- [ ] Criar pedido marcando "Incluir mensagem no cartão" e digitando uma mensagem
- [ ] No detalhe: verificar que a mensagem aparece e o botão "Copiar" funciona
- [ ] Na comanda: mensagem deve aparecer na seção do cartão
- [ ] Criar pedido com pagamento marcado como "Pago"
- [ ] Criar pedido com "Pagamento parcial" e valor pago parcial
- [ ] No detalhe de cada um: verificar badge de pagamento correto (Pago / Parcialmente pago / Não pago)
- [ ] Verificar que "Restante a pagar" aparece apenas no parcial

## 4. Pedido de retirada — criação

- [ ] Acessar `/retirada`
- [ ] Confirmar que NÃO há campo de endereço
- [ ] Confirmar que NÃO há checkbox de presente/destinatário
- [ ] Preencher e salvar
- [ ] No detalhe: tipo deve aparecer como "Retirada"
- [ ] Comanda impressa: tipo deve mostrar "RETIRADA"

## 5. Lista de pedidos — filtros e busca

- [ ] Acessar `/pedidos`
- [ ] Buscar por nome de cliente → lista filtra corretamente
- [ ] Buscar por telefone → lista filtra corretamente
- [ ] Filtrar por status (pendente / em_preparo / etc.)
- [ ] Filtrar por data de entrega
- [ ] Filtrar por tipo (entrega / retirada)
- [ ] Combinar filtros → resultado deve ser interseção
- [ ] Limpar filtros → lista volta completa
- [ ] Verificar paginação: com mais de 20 pedidos, botão "carregar mais" aparece

## 6. Detalhe do pedido — progressão de status

- [ ] Pedido tipo `entrega`, status `pendente` → clicar "Avançar status" → vira `em_preparo`
- [ ] `em_preparo` → avançar → `saiu_entrega`
- [ ] `saiu_entrega` → avançar → `entregue`
- [ ] Pedido tipo `retirada`, status `saiu_entrega` → avançar → `retirado`
- [ ] Testar dropdown "Definir status" para forçar qualquer status
- [ ] Badge de status atualiza visualmente em tempo real

## 7. Cancelamento de pedido

- [ ] Abrir detalhe de um pedido ativo
- [ ] Clicar em "Cancelar pedido"
- [ ] Modal de cancelamento abre
- [ ] Informar motivo e confirmar
- [ ] Pedido some da lista (filtro padrão oculta cancelados) ou aparece com badge "cancelado"
- [ ] Detalhe exibe o motivo de cancelamento
- [ ] Status "cancelado" não pode avançar para próximo status

## 8. Edição de pedido

- [ ] Abrir detalhe de um pedido
- [ ] Clicar em "Editar" → modal abre com dados preenchidos
- [ ] Alterar nome do comprador → salvar → detalhe reflete a mudança
- [ ] Alterar produtos (remover um item, adicionar outro) → total recalcula
- [ ] Alterar endereço → detalhe mostra novo endereço
- [ ] Alterar pagamento (pago → não pago) → badge atualiza
- [ ] Marcar / desmarcar presente → destinatário aparece/desaparece no detalhe
- [ ] Alterar mensagem do cartão → detalhe reflete mudança

## 9. WhatsApp

- [ ] No detalhe de um pedido `pendente`, clicar "Enviar confirmação WhatsApp"
- [ ] Janela do WhatsApp Web abre com mensagem pré-preenchida (nome, itens, data, endereço, total)
- [ ] Botão muda para "Confirmação enviada" (verde) sem precisar recarregar a página
- [ ] Ao recarregar a página, botão ainda aparece como "enviado" (estado persistido em `notificacoes_whatsapp`)
- [ ] Avançar status para `saiu_entrega` → botão "Avisar comprador — saiu p/ entrega" aparece
- [ ] Clicar nesse botão → janela do WhatsApp abre com mensagem de entrega
- [ ] Botão muda para "Aviso enviado"

## 10. Impressão de comanda

- [ ] No detalhe, clicar em "Imprimir"
- [ ] Preview da comanda aparece com todos os dados: código, tipo, QR code, cliente, endereço (se entrega), itens, totais, pagamento
- [ ] Imprimir / salvar como PDF → layout de 72mm está correto
- [ ] Após imprimir, `impresso_em` é registrado (visível no rodapé da comanda)
- [ ] Pedido como presente: comanda mostra "De (comprador)" e "Para (destinatário)"
- [ ] Pedido sem frete: linha de frete não aparece
- [ ] Pedido com pagamento parcial: mostra valor pago e restante a pagar

## 11. Geocoding e mapa

- [ ] No formulário de entrega, digitar um endereço no campo de busca de geocoding
- [ ] Sugestões aparecem (bairros de Manhuaçu/MG)
- [ ] Selecionar sugestão → latitude/longitude são preenchidas
- [ ] No detalhe de pedido com coordenadas, verificar se o mapa exibe o pin corretamente

## 12. Clientes — lista

- [ ] Acessar `/clientes`
- [ ] Buscar cliente por nome → lista filtra
- [ ] Buscar por telefone → lista filtra
- [ ] Cliente com data especial próxima (≤7 dias) aparece com destaque/emoji
- [ ] Cliente com data especial hoje aparece destacado de forma diferente

## 13. Clientes — perfil

- [ ] Clicar em um cliente → abre `/clientes/[id]`
- [ ] Exibe nome, telefone, WhatsApp (se diferente), data de cadastro
- [ ] Exibe histórico de pedidos do cliente
- [ ] Editar nome ou telefone → dados atualizam
- [ ] Adicionar data especial (aniversário, etc.) com nome e data
- [ ] Data adicionada aparece na lista de datas especiais
- [ ] Excluir uma data especial → some da lista
- [ ] "Próxima data" calcula quantos dias faltam corretamente

## 14. Catálogo de produtos

- [ ] Acessar `/catalogo`
- [ ] Todos os produtos aparecem com nome, categoria, preço
- [ ] Filtrar por categoria → apenas produtos da categoria aparecem
- [ ] Buscar por nome → lista filtra
- [ ] Editar preço de um produto → novo preço salvo
- [ ] Desativar produto (toggle) → produto sai da lista ativa
- [ ] Ativar produto novamente → volta para a lista
- [ ] Filtro "mostrar inativos" exibe produtos desativados

## 15. Analytics

- [ ] Acessar `/analytics`
- [ ] KPIs exibem valores corretos: total pedidos, receita, ticket médio, entregas, retiradas
- [ ] "A receber" mostra soma dos pedidos não pagos
- [ ] "Pedidos hoje" mostra pedidos com data de entrega = hoje
- [ ] Trocar período: 7 dias → 30 dias → 90 dias → valores mudam
- [ ] Gráfico de barras (pedidos por dia) renderiza
- [ ] Gráfico de linha (receita por dia) renderiza
- [ ] "Top 10 produtos" lista os mais vendidos com quantidade e receita
- [ ] "Formas de pagamento" exibe distribuição
- [ ] "Top 5 clientes" exibe clientes com mais pedidos; clicar abre perfil do cliente

## 16. Normalização — verificação pós-DROP COLUMN

> Confirmar que as colunas removidas não causam erros e os dados vêm das tabelas normalizadas.

- [ ] Criar novo pedido de entrega → detalhe mostra endereço (vindo de `enderecos`)
- [ ] Criar novo pedido com presente → detalhe mostra destinatário (vindo de `destinatarios`)
- [ ] Criar pedido pago → detalhe mostra badge "Pago" (vindo de `pagamentos`)
- [ ] Criar pedido com parcial → detalhe mostra valor correto (vindo de `pagamentos`)
- [ ] Editar endereço de pedido existente → detalhe reflete mudança (tabela `enderecos` atualizada)
- [ ] Editar pagamento → detalhe reflete mudança (tabela `pagamentos` atualizada)
- [ ] Marcar WhatsApp enviado → ao recarregar, botão continua "enviado" (vindo de `notificacoes_whatsapp`)
- [ ] Pedidos antigos (criados antes da migração): endereço, destinatário e pagamento ainda aparecem corretamente

## 17. Regressão geral

- [ ] Nenhuma página retorna erro 500
- [ ] Nenhum `console.error` crítico no navegador
- [ ] Formulários com campos obrigatórios vazios exibem alerta (não quebram)
- [ ] Pedido sem frete (retirada) tem `valor_frete = 0` e total correto
- [ ] Dois pedidos criados em sequência têm códigos diferentes e únicos
- [ ] Atualizar a página em qualquer rota não quebra (sem dependência de estado volátil)
