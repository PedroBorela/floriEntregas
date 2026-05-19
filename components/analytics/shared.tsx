'use client'

import React from 'react'

export const COLORS = {
  primary: '#166534',
  secondary: '#22c55e',
  accent: '#ea580c',
  info: '#0369a1',
  warning: '#b45309',
  danger: '#be123c',
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    400: '#94a3b8',
    500: '#64748b',
    900: '#0f172a',
  },
}

export function KpiCard({ label, value, sub, color }: Readonly<{ label: string; value: string; sub?: string; color: string }>) {
  return (
    <div className="bg-white rounded-2xl py-5 px-3 shadow-sm border border-slate-100 hover:shadow-md transition-shadow text-center flex flex-col justify-center min-h-[130px] overflow-hidden">
      <p className="text-xl sm:text-2xl font-black tracking-tight whitespace-nowrap overflow-hidden text-ellipsis" style={{ color }}>{value}</p>
      <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">{label}</p>
      {sub && <p className="text-[10px] sm:text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

export function CardShell({ title, children, className = '', action }: Readonly<{ title: string; children: React.ReactNode; className?: string; action?: React.ReactNode }>) {
  return (
    <div className={`bg-white rounded-3xl shadow-sm border border-slate-100 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider opacity-70">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

export function EmptyState({ msg }: Readonly<{ msg?: string }>) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-300">
      <svg className="w-10 h-10 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm font-medium">{msg ?? 'Nenhum dado encontrado no período'}</p>
    </div>
  )
}

const SKELETON_KPIS = ['sk-a', 'sk-b', 'sk-c']
const SKELETON_CARDS = ['sk-x', 'sk-y']

export function TabSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {SKELETON_KPIS.map((k) => <div key={k} className="bg-white rounded-2xl border border-slate-100 shadow-sm h-32" />)}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {SKELETON_CARDS.map((k) => <div key={k} className="bg-white rounded-3xl border border-slate-100 shadow-sm h-72" />)}
      </div>
    </div>
  )
}

export function TabErro({ erro, onRetry }: Readonly<{ erro: string | null; onRetry: () => void }>) {
  return (
    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
      <p className="text-lg font-bold text-slate-800">Erro ao carregar dados</p>
      {erro && <p className="text-xs text-rose-400 font-mono mt-2 break-all max-w-sm mx-auto">{erro}</p>}
      <button onClick={onRetry} className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
        Tentar novamente
      </button>
    </div>
  )
}
