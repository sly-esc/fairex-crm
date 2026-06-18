'use client'

import { motion } from 'framer-motion'
import { Search, Filter, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { getStageConfig } from '@/lib/utils/stages'
import { updateLeadEstado } from '@/lib/services/queries'
import { useState } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import { UserX } from 'lucide-react'

export default function LeadsPage() {
  const router = useRouter()
  const { pipelineLeads: leads, conversations, addToast, toggleLeadEstado } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Activos' | 'Excluidos'>('Todos')

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

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lead.company.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    
    const isActivo = lead.estado !== 'EXCLUIR'
    if (statusFilter === 'Activos') return isActivo
    if (statusFilter === 'Excluidos') return !isActivo
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Directorio de Leads</h1>
          <p className="text-zinc-400">Gestiona todos los contactos evaluados por FAIREX AI.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Buscar por nombre o empresa..." 
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
              <DropdownMenuLabel>Estado</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setStatusFilter('Todos')}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('Activos')}>Activos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('Excluidos')}>Excluidos</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuLabel>Otros filtros</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => addToast({ title: 'Filtro aplicado', description: 'Próximamente', type: 'default' })}>
                Leads Calientes (Score &gt; 90)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addToast({ title: 'Filtro aplicado', description: 'Próximamente', type: 'default' })}>
                Origen: WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addToast({ title: 'Filtro aplicado', description: 'Próximamente', type: 'default' })}>
                Fecha de creación
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl"
      >
        <Table>
          <TableHeader className="bg-white/5 border-b border-white/10">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-zinc-400 font-medium">Lead</TableHead>
              <TableHead className="text-zinc-400 font-medium hidden md:table-cell">Origen</TableHead>
              <TableHead className="text-zinc-400 font-medium">Estado</TableHead>
              <TableHead className="text-zinc-400 font-medium">Etapa</TableHead>
              <TableHead className="text-zinc-400 font-medium text-center">Score IA</TableHead>
              <TableHead className="text-zinc-400 font-medium hidden lg:table-cell">Último Contacto</TableHead>
              <TableHead className="text-right text-zinc-400 font-medium">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow className="hover:bg-transparent border-none">
                <TableCell colSpan={6} className="h-64">
                  <EmptyState 
                    icon={UserX}
                    title="No hay leads que coincidan"
                    description={searchQuery ? `No se encontraron leads para "${searchQuery}"` : "Tu directorio de leads está vacío en este momento."}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow 
                  key={lead.id} 
                  className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => router.push(`/leads/${lead.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                          {lead.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-white">{lead.name}</p>
                        <p className="text-xs text-zinc-500">{lead.company}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge className="text-zinc-400 border border-white/10 bg-black/20 font-normal">
                      {lead.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-medium text-sm">
                      {lead.estado === 'EXCLUIR' ? (
                        <span className="text-red-400 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400"></span> EXCLUIDO</span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400"></span> ACTIVO</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStageConfig(lead.stage).badgeClass} border font-medium tracking-wide`}>
                      {lead.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <span className={`font-bold ${lead.score >= 90 ? 'text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] bg-emerald-500/10 px-2 py-0.5 rounded' : lead.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                        {lead.score}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-zinc-400 text-sm">
                    {conversations.find(c => c.id === lead.id)?.time || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                          <span className="sr-only">Abrir menú</span>
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-950 border-white/10 text-zinc-200">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/leads/${lead.id}`) }}>
                          Ver Ficha CRM
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); addToast({ title: 'Editando...', description: 'Próximamente modal de edición', type: 'default' }) }}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleEstado(lead.id, lead.estado) }}>
                          {lead.estado === 'EXCLUIR' ? 'Activar lead' : 'Excluir lead'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  )
}
