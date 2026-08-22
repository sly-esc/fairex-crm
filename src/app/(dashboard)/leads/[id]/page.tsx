'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, MessageSquare, Calendar, Building, Sparkles, Target, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { EmptyState } from '@/components/ui/empty-state'
import LeadPaymentsCard from '@/components/domain/LeadPaymentsCard'

export default function LeadDetailPage() {
  const params = useParams()
  const { pipelineLeads, conversations, setActiveConversationId, _hasHydrated } = useAppStore()
  
  if (!_hasHydrated) return null

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || '1'
  const lead = pipelineLeads.find(l => l.id === id)
  const conversation = conversations.find(c => c.id === id)

  if (!lead || !conversation) {
    return (
      <div className="flex items-center justify-center h-full pt-20">
        <EmptyState 
          icon={AlertTriangle}
          title="Lead no encontrado"
          description="El lead que buscas no existe o ha sido eliminado."
        />
      </div>
    )
  }

  // Derive data from memory
  const leadData = {
    name: lead.name, 
    initials: 'WA', 
    company: lead.company, 
    phone: lead.name, // "numero" is mapped to "name" in store
    email: 'No disponible', 
    avatarColor: 'bg-primary/20 text-primary',
    score: lead.score, 
    stage: lead.stage,
    summary: conversation.lastMessage || 'Sin resumen disponible.',
    needs: [], // Not stored globally
    objections: [], // Not stored globally
    history: [] // Not stored globally
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Nav */}
      <div>
        <Link href="/leads">
          <Button variant="ghost" className="text-zinc-400 hover:text-white -ml-4 mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Directorio
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20 border-2 border-white/10 shadow-2xl">
              <AvatarFallback className={`${leadData.avatarColor} text-2xl font-bold`}>{leadData.initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{leadData.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                <span className="flex items-center gap-1"><Building className="h-4 w-4 text-zinc-500" /> {leadData.company}</span>
                <span className="flex items-center gap-1"><Phone className="h-4 w-4 text-zinc-500" /> {leadData.phone}</span>
                <span className="flex items-center gap-1"><Mail className="h-4 w-4 text-zinc-500" /> {leadData.email}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/conversaciones" onClick={() => setActiveConversationId(id)}>
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-full shadow-[0_0_15px_color-mix(in_srgb,var(--primary)_30%,transparent)] transition-all">
                <MessageSquare className="mr-2 h-4 w-4" /> Chatear
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: History & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Historial de Actividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {leadData.history.length === 0 ? (
                  <EmptyState 
                    icon={Calendar}
                    title="Sin historial de actividad"
                    description="El historial detallado se cargará próximamente."
                  />
                ) : (
                  <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                    {leadData.history.map((item: any) => (
                      <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${item.type === 'ai' ? 'border-primary/30 bg-primary/20 shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_20%,transparent)]' : 'border-white/10 bg-zinc-900'}`}>
                          {item.type === 'ai' ? <Sparkles className="h-4 w-4 text-primary" /> : <MessageSquare className="h-4 w-4 text-zinc-400" />}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-white text-sm">{item.title}</span>
                            <span className={`text-xs font-medium ${item.type === 'ai' ? 'text-emerald-400' : 'text-zinc-500'}`}>{item.time}</span>
                          </div>
                          <p className="text-sm text-zinc-400">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Lead Memory + Payments */}
        <div className="space-y-6">
          {/* Pagos */}
          <LeadPaymentsCard leadSessionId={id} />

          <Card className="bg-black/40 backdrop-blur-xl border-white/10 border-t-4 border-t-primary shadow-[0_0_30px_color-mix(in_srgb,var(--primary)_10%,transparent)] overflow-hidden">
            <CardHeader className="pb-4 bg-primary/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Cerebro IA
                </CardTitle>
                <div className={`flex items-center justify-center h-12 w-12 rounded-full border-2 shadow-lg ${leadData.score >= 90 ? 'border-emerald-500/50 bg-emerald-500/10 shadow-emerald-500/30' : leadData.score >= 60 ? 'border-amber-500/50 bg-amber-500/10 shadow-amber-500/30' : 'border-red-500/50 bg-red-500/10 shadow-red-500/30'}`}>
                  <span className={`font-bold ${leadData.score >= 90 ? 'text-emerald-400' : leadData.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{leadData.score}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Target className="h-3 w-3" /> Etapa Sugerida
                </h4>
                <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm px-3 py-1 tracking-wider">
                  {leadData.stage}
                </Badge>
              </div>

              <Separator className="bg-white/10" />

              <div>
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" /> Briefing
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                  {leadData.summary}
                </p>
              </div>

              {leadData.needs.length === 0 && leadData.objections.length === 0 ? (
                <EmptyState 
                  icon={Target}
                  title="Sin datos adicionales"
                  description="Aún no se han detectado necesidades u objeciones en la conversación."
                />
              ) : (
                <>
                  {leadData.needs.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Necesidades</h4>
                      <div className="flex flex-wrap gap-2">
                        {leadData.needs.map((need: string, i: number) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">{need}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {leadData.objections.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Objeciones / Riesgos</h4>
                      <div className="flex flex-wrap gap-2">
                        {leadData.objections.map((obj: string, i: number) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">{obj}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
