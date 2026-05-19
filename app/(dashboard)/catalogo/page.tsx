'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { ProdutoCatalogo } from '@/lib/types'
import { normalizar } from '@/lib/formatters'
import CardProduto from '@/components/catalogo/CardProduto'
import FiltroCategorias from '@/components/catalogo/FiltroCategorias'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

const POR_PAGINA = 8

export default function CatalogoPage() {
  const { toast } = useToast()
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [apenasAtivos, setApenasAtivos] = useState(true)
  const [pagina, setPagina] = useState(1)

  // Edição de produto
  const [editando, setEditando] = useState<ProdutoCatalogo | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editPreco, setEditPreco] = useState('')
  const [editImgFile, setEditImgFile] = useState<File | null>(null)
  const [editImgPreview, setEditImgPreview] = useState<string | null>(null)
  const [salvandoEdit, setSalvandoEdit] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const { data } = await supabase
        .from('produtos_catalogo')
        .select('*')
        .order('categoria')
        .order('nome')
      setProdutos((data as ProdutoCatalogo[]) ?? [])
      setCarregando(false)
    }
    carregar()
  }, [])

  // Reset página ao mudar filtros
  useEffect(() => { setPagina(1) }, [busca, categoria, apenasAtivos])

  const contagens = useMemo(() => {
    const base = apenasAtivos ? produtos.filter((p) => p.ativo) : produtos
    return base.reduce<Record<string, number>>((acc, p) => {
      if (p.categoria) acc[p.categoria] = (acc[p.categoria] ?? 0) + 1
      return acc
    }, {})
  }, [produtos, apenasAtivos])

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      if (apenasAtivos && !p.ativo) return false
      if (categoria && p.categoria !== categoria) return false
      if (busca.trim().length > 0) {
        const termo = normalizar(busca)
        return (
          normalizar(p.nome).includes(termo) ||
          normalizar(p.categoria ?? '').includes(termo) ||
          normalizar(p.tamanho ?? '').includes(termo)
        )
      }
      return true
    })
  }, [produtos, busca, categoria, apenasAtivos])

  const totalPaginas = Math.max(1, Math.ceil(produtosFiltrados.length / POR_PAGINA))
  const produtosPaginados = produtosFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  async function handlePrecoChange(id: string, preco: number) {
    await supabase.from('produtos_catalogo').update({ preco_padrao: preco }).eq('id', id)
    setProdutos((prev) => prev.map((p) => p.id === id ? { ...p, preco_padrao: preco } : p))
  }

  async function handleToggleAtivo(id: string, ativo: boolean) {
    await supabase.from('produtos_catalogo').update({ ativo }).eq('id', id)
    setProdutos((prev) => prev.map((p) => p.id === id ? { ...p, ativo } : p))
  }

  function abrirEditar(produto: ProdutoCatalogo) {
    setEditando(produto)
    setEditNome(produto.nome)
    setEditPreco(String(produto.preco_padrao))
    setEditImgFile(null)
    setEditImgPreview(null)
  }

  function fecharEditar() {
    setEditando(null)
    setEditImgFile(null)
    setEditImgPreview(null)
  }

  function handleImgFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEditImgFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setEditImgPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function salvarEdicao() {
    if (!editando) return
    setSalvandoEdit(true)

    let imagem_url = editando.imagem_url

    if (editImgFile) {
      const ext = editImgFile.name.split('.').pop() ?? 'jpg'
      const path = `${editando.id}.${ext}`

      // Cria o bucket se ainda não existir (idempotente)
      await supabase.storage.createBucket('produtos', { public: true })

      const { error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(path, editImgFile, { upsert: true })

      if (uploadError) {
        toast('Erro no upload da imagem: ' + uploadError.message)
        setSalvandoEdit(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('produtos').getPublicUrl(path)
      imagem_url = publicUrl
    }

    const novoPreco = Number.parseFloat(editPreco)
    const update: Partial<ProdutoCatalogo> = {
      nome: editNome.trim() || editando.nome,
      preco_padrao: !Number.isNaN(novoPreco) && novoPreco > 0 ? novoPreco : editando.preco_padrao,
      imagem_url,
    }

    const { data, error } = await supabase
      .from('produtos_catalogo')
      .update(update)
      .eq('id', editando.id)
      .select()
      .single()

    setSalvandoEdit(false)
    if (error) { toast('Erro ao salvar: ' + error.message); return }

    setProdutos((prev) => prev.map((p) => p.id === editando.id ? (data as ProdutoCatalogo) : p))
    fecharEditar()
  }

  const imgExibida = editImgPreview ?? editando?.imagem_url ?? null

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-green-900">Catálogo de Produtos</h1>
        <span className="text-sm text-gray-500">
          {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Barra de busca + toggle ativos */}
      <div className="flex gap-3 mb-4">
        <input
          type="search"
          placeholder="Buscar por nome, categoria ou tamanho..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 form-input"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none whitespace-nowrap">
          <input
            type="checkbox"
            checked={apenasAtivos}
            onChange={(e) => setApenasAtivos(e.target.checked)}
            className="accent-green-700 w-4 h-4"
          />
          Só ativos
        </label>
      </div>

      {/* Filtros por categoria */}
      <div className="mb-5">
        <FiltroCategorias
          categoriaSelecionada={categoria}
          onChange={setCategoria}
          contagens={contagens}
        />
      </div>

      {/* Grid de produtos */}
      {carregando ? (
        <div className="text-center py-16 text-gray-400">Carregando catálogo...</div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          Nenhum produto encontrado.
          {busca && (
            <button onClick={() => setBusca('')} className="ml-2 text-green-700 hover:underline">
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {produtosPaginados.map((p) => (
              <CardProduto
                key={p.id}
                produto={p}
                onPrecoChange={handlePrecoChange}
                onToggleAtivo={handleToggleAtivo}
                onEditar={abrirEditar}
              />
            ))}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-500">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de edição */}
      <Modal open={!!editando} onClose={fecharEditar} title="Editar produto">
        {editando && (
          <div className="space-y-4">
            {/* Preview da imagem */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-32 h-32 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer hover:border-green-400 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                {imgExibida ? (
                  <img src={imgExibida} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-gray-300">🌸</span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImgFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-green-700 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-50 transition"
              >
                {editImgFile ? editImgFile.name : 'Trocar foto'}
              </button>
              {editImgFile && (
                <button
                  type="button"
                  onClick={() => { setEditImgFile(null); setEditImgPreview(null) }}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Cancelar troca
                </button>
              )}
            </div>

            <div>
              <label className="form-label">Nome</label>
              <input
                className="form-input"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Preço padrão</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">R$</span>
                <input
                  type="number"
                  className="form-input w-32"
                  min="0"
                  step="0.01"
                  value={editPreco}
                  onChange={(e) => setEditPreco(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={fecharEditar}
                disabled={salvandoEdit}
                className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                disabled={salvandoEdit}
                className="px-4 py-1.5 text-sm font-semibold text-white bg-green-800 rounded-lg hover:bg-green-900 disabled:opacity-50"
              >
                {salvandoEdit ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
