/**
 * Importa os 277 produtos do catálogo para o Supabase.
 *
 * Pré-requisitos:
 *   - Migration 007 já aplicada
 *   - Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local
 *
 * Execução:
 *   npx ts-node --project tsconfig.json scripts/seed-produtos.ts
 */

import { createClient } from '@supabase/supabase-js'
import { catalogoData } from './catalogo-data'
import * as fs from 'fs'
import * as path from 'path'

// Lê e parseia .env.local sem dependência externa
function carregarEnv(caminho: string): Record<string, string> {
  const env: Record<string, string> = {}
  if (!fs.existsSync(caminho)) return env
  const linhas = fs.readFileSync(caminho, 'utf-8').split('\n')
  for (const linha of linhas) {
    const match = linha.match(/^([^#=]+)=(.*)$/)
    if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
  }
  return env
}

const env = carregarEnv(path.resolve(__dirname, '../.env.local'))
const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey  = env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function seed() {
  console.log(`Iniciando seed de ${catalogoData.length} produtos...`)

  const rows = catalogoData.map((p) => ({
    nome:         p.nome,
    preco_padrao: p.preco_padrao,
    tamanho:      p.tamanho,
    categoria:    p.categoria,
    dica_cuidado: p.dica_cuidado,
    imagem_url:   `/plants/${p.id_original}.png`,
    ativo:        true,
  }))

  const { error, data } = await supabase
    .from('produtos_catalogo')
    .upsert(rows, { onConflict: 'nome,tamanho' })
    .select('id')

  if (error) {
    console.error('Erro no upsert:', error.message)
    console.error('Detalhes:', error.details)
    process.exit(1)
  }

  console.log(`Seed concluído. ${data?.length ?? 0} linhas inseridas/atualizadas.`)
}

seed()
