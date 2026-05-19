'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyticsLoginPage() {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      const res = await fetch('/api/analytics-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: senha }),
      })

      if (res.ok) {
        router.push('/analytics')
        router.refresh()
      } else {
        setErro('Senha incorreta. Tente novamente.')
      }
    } catch {
      setErro('Erro ao conectar. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 mb-4">
              <svg className="w-7 h-7 text-[#1B5E20]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Analytics</h1>
            <p className="text-slate-500 text-sm mt-1">Área restrita — insira sua senha</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="senha" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••••••"
                required
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B5E20]/30 focus:border-[#1B5E20] transition-colors"
              />
            </div>

            {erro && (
              <p className="text-sm text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando || !senha}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1B5E20] text-white font-semibold text-sm transition-all hover:bg-[#2E7D32] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {carregando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
