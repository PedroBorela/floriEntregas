export const CATEGORIAS_PRODUTO = [
  'Vaso', 'Orquídea', 'Folhagem', 'Flor', 'Árvore', 'Corte', 'Especiais',
  'Buquê Rosas', 'Combo', 'Buquê Girassol', 'Buquê Lírio', 'Chocolate', 'Buquê Flores do Campo',
] as const

export type CategoriaProduto = typeof CATEGORIAS_PRODUTO[number]

export interface ProdutoCatalogo {
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

export interface Vendedor {
  id: string
  nome: string
  ativo: boolean
  created_at: string
}

export type PedidoStatus =
  | 'pendente'
  | 'em_preparo'
  | 'pronto'
  | 'saiu_entrega'
  | 'entregue'
  | 'retirado'
  | 'cancelado'

export type PedidoTipo = 'entrega' | 'retirada'

export type PagamentoTipo = 'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito'

export interface ClienteData {
  id: string
  cliente_id: string
  nome: string
  data: string   // ISO date: YYYY-MM-DD
  created_at: string
}

export interface ClienteNota {
  id: string
  cliente_id: string
  tipo: 'preferencia' | 'observacao'
  texto: string
  created_at: string
}

export interface Cliente {
  id: string
  nome: string
  telefone: string
  whatsapp: string | null
  preferencias: string | null
  observacoes: string | null
  created_at: string
  cliente_datas?: ClienteData[]
}

export interface PedidoItem {
  id: string
  pedido_id: string
  produto_catalogo_id: string | null
  nome_produto: string
  valor_unitario: number
  quantidade: number
  subtotal: number
  observacao: string | null
  ordem: number
}

export interface Pedido {
  id: string
  codigo: string
  tipo: PedidoTipo
  status: PedidoStatus

  cliente_id: string | null
  cliente_nome: string
  cliente_telefone: string

  destinatario_nome: string | null
  destinatario_telefone: string | null

  endereco_apelido: string | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  bairro: string | null
  cidade: string
  estado: string
  referencia: string | null
  latitude: number | null
  longitude: number | null

  data_entrega: string | null
  horario_entrega: string | null
  zona_frete_id: string | null
  valor_frete: number

  tem_cartao: boolean
  mensagem_cartao: string | null

  pago: boolean
  pagamento_tipo: PagamentoTipo | null
  pagamento_parcial: boolean
  valor_pago: number

  valor_produtos: number
  valor_total: number

  vendedor_id: string | null
  vendedor?: { id: string; nome: string } | null

  impresso: boolean
  impresso_em: string | null
  observacoes: string | null
  motivo_cancelamento: string | null

  whatsapp_confirmacao_enviado: boolean
  whatsapp_confirmacao_em: string | null
  whatsapp_saiu_enviado: boolean
  whatsapp_saiu_em: string | null

  created_at: string
  updated_at: string

  pedido_itens?: PedidoItem[]
}

export interface PedidoFormData {
  tipo: PedidoTipo
  cliente_nome: string
  cliente_telefone: string
  destinatario_nome?: string
  destinatario_telefone?: string
  endereco?: string
  numero?: string
  bairro?: string
  referencia?: string
  data_entrega?: string
  horario_entrega?: string
  tem_cartao: boolean
  mensagem_cartao?: string
  pago: boolean
  pagamento_tipo?: PagamentoTipo
  pagamento_parcial: boolean
  valor_pago?: number
  valor_frete: number
  observacoes?: string
  itens: {
    nome_produto: string
    valor_unitario: number
    quantidade: number
    observacao?: string
  }[]
}

export interface Database {
  public: {
    Tables: {
      pedidos: {
        Row: Pedido
        Insert: Omit<Pedido, 'id' | 'codigo' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Pedido, 'id' | 'codigo' | 'created_at'>>
      }
      pedido_itens: {
        Row: PedidoItem
        Insert: Omit<PedidoItem, 'id' | 'subtotal'>
        Update: Partial<Omit<PedidoItem, 'id'>>
      }
      clientes: {
        Row: Cliente
        Insert: Omit<Cliente, 'id' | 'created_at'>
        Update: Partial<Omit<Cliente, 'id'>>
      }
    }
  }
}
