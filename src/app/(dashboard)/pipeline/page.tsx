'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, MoreHorizontal, Building, DollarSign, Target } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore, Lead } from '@/lib/store'
import { getStageConfig } from '@/lib/utils/stages'
import { useRouter } from 'next/navigation'
import { updateLeadEstado } from '@/lib/services/queries'

const STAGES = ['Nuevo', 'Interesado', 'Seguimiento', 'Caliente', 'Cerrado', 'Perdido']

export default function PipelinePage() {
  const { pipelineLeads: leads, updateLeadStage, addToast, _hasHydrated, toggleLeadEstado } = useAppStore()
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, lead: Lead) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = 'move'
    // Delay necessary for native drag and drop to not capture the hidden opacity immediately
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = '0.4'
      }
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedLead(null)
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '1'
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, stage: string) => {
    e.preventDefault()
    if (!draggedLead) return

    if (draggedLead.stage !== stage) {
      updateLeadStage(draggedLead.id, stage)
    }
  }

  // Prevenimos renderizado en servidor de listas dinámicas animadas (soluciona error de hidratación / crash)
  if (!_hasHydrated) return null

  const handleToggleEstado = async (id: string, currentEstado?: string) => {
    const newEstado = currentEstado === 'EXCLUIR' ? 'ACTIVO' : 'EXCLUIR'
    toggleLeadEstado(id, newEstado)
    try {
      await updateLeadEstado(id, newEstado)
      addToast({ title: 'Estado actualizado', description: `Lead marcado como ${newEstado}`, type: 'success' })
    } catch (error) {
      toggleLeadEstado(id, currentEstado as any || 'ACTIVO')
      addToast({ title: 'Error', description: 'No se pudo actualizar', type: 'error' })
    }
  }

  const filteredLeads = leads.filter(l => 
    l.estado !== 'EXCLUIR' && (
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.company.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  return (
    <div className="h-full flex flex-col space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Pipeline de Ventas</h1>
          <p className="text-zinc-400">Arrastra las oportunidades para actualizar su etapa visualmente.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Buscar oportunidad..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-black/40 border-white/10 text-white rounded-full focus-visible:ring-primary/50"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
              <Filter className="h-4 w-4 mr-2" /> Filtros
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-zinc-950 border-white/10 text-zinc-200" align="end">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={() => addToast({ title: 'Filtro aplicado', description: 'Próximamente', type: 'default' })}>
                Mis Leads (Asignados)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addToast({ title: 'Filtro aplicado', description: 'Próximamente', type: 'default' })}>
                Leads Calientes (Score &gt; 90)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addToast({ title: 'Filtro aplicado', description: 'Próximamente', type: 'default' })}>
                Origen: WhatsApp
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-6 h-full min-w-max">
          
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter(l => l.stage === stage)
            
            // Color coding based on stage
            const stageColor = getStageConfig(stage).dotClass

            return (
              <div 
                key={stage} 
                className="w-[320px] flex flex-col bg-zinc-950/40 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-xl shadow-xl"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${stageColor} shadow-[0_0_8px_currentColor]`} />
                    <h3 className="font-semibold text-white">{stage}</h3>
                  </div>
                  <Badge className="bg-white/5 border-white/10 text-zinc-400 font-normal">
                    {stageLeads.length}
                  </Badge>
                </div>

                {/* Column Body */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                  <AnimatePresence>
                    {stageLeads.map((lead) => (
                      <motion.div
                        layout
                        layoutId={`lead-${lead.id}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        key={lead.id}
                        draggable
                        onDragStart={(e: any) => handleDragStart(e, lead)}
                        onDragEnd={(e: any) => handleDragEnd(e)}
                        className="bg-zinc-900/80 hover:bg-zinc-800/80 border border-white/10 rounded-xl p-4 cursor-grab active:cursor-grabbing transition-colors shadow-lg hover:shadow-xl hover:border-primary/30 group relative"
                        onClick={() => router.push(`/leads/${lead.id}`)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-white text-sm hover:underline hover:text-primary transition-colors cursor-pointer">{lead.name}</h4>
                            <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                              <Building className="h-3 w-3" /> {lead.company}
                            </p>
                          </div>
                          
                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-full h-6 w-6 text-zinc-500 hover:text-white hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-40 bg-zinc-950 border-white/10 text-zinc-200" align="end">
                                <DropdownMenuItem onClick={() => router.push(`/leads/${lead.id}`)}>
                                  Abrir perfil
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => addToast({ title: 'Editando...', description: 'Próximamente modal de edición', type: 'default' })}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-400" onClick={() => handleToggleEstado(lead.id, lead.estado)}>
                                  Excluir lead
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-3 text-xs">
                          <Badge className="bg-primary/10 text-primary border border-primary/20 font-normal">
                            {lead.source}
                          </Badge>
                          <div className="flex items-center gap-1 text-zinc-300 font-medium">
                            <DollarSign className="h-3 w-3 text-emerald-400" />
                            {lead.value}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-white/10">
                              <AvatarFallback className="bg-zinc-800 text-[10px]">{lead.assignee}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex items-center gap-1.5" title="Score IA">
                            <Target className="h-3 w-3 text-zinc-500" />
                            <span className={`text-xs font-bold ${lead.score >= 90 ? 'text-emerald-400' : lead.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                              {lead.score}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {stageLeads.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-xs text-zinc-500">
                      Mueve una oportunidad aquí
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
