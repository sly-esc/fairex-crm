export const STAGE_CONFIG: Record<string, { dotClass: string, badgeClass: string }> = {
  'Nuevo': {
    dotClass: 'bg-slate-400',
    badgeClass: 'bg-slate-400/10 text-slate-50 border-slate-400/30 shadow-[0_0_10px_rgba(248,250,252,0.15)]'
  },
  'Interesado': {
    dotClass: 'bg-blue-500',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  },
  'Seguimiento': {
    dotClass: 'bg-purple-500',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  },
  'Caliente': {
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  },
  'Cerrado': {
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  },
  'Perdido': {
    dotClass: 'bg-red-500',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20'
  }
}

export const getStageConfig = (stage: string) => {
  return STAGE_CONFIG[stage] || {
    dotClass: 'bg-zinc-500',
    badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
  }
}
