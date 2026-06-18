'use client'

import { motion } from 'framer-motion'
import { Users, DollarSign, Activity, MessageSquareWarning, Sparkles } from 'lucide-react'
import { StatCard } from '@/components/premium/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import { useAppStore } from '@/lib/store'
import { MessageSquare } from 'lucide-react'

export default function DashboardPage() {
  const { pipelineLeads, conversations, _hasHydrated } = useAppStore()

  // Compute metrics dynamically
  const activeLeads = pipelineLeads.filter(l => l.estado !== 'EXCLUIR')
  const nuevosLeads = activeLeads.filter(l => l.stage.toLowerCase() === 'nuevo').length
  const hotLeadsCount = activeLeads.filter(l => l.score >= 90).length
  const topLeads = [...activeLeads].sort((a, b) => b.score - a.score).slice(0, 3)

  const conversacionesTotales = conversations.length
  const leadsActivosCount = activeLeads.length
  const conversionesIA = activeLeads.filter(l => l.assignee === 'IA').length
  const intervencionHumana = activeLeads.filter(l => l.assignee !== 'IA').length

  // Generate distribution data for the AreaChart
  const stageCounts: Record<string, number> = {
    'Nuevo': 0,
    'Interesado': 0,
    'Seguimiento': 0,
    'Negociación': 0,
    'Cerrado': 0,
    'Perdido': 0
  }

  activeLeads.forEach(lead => {
    const s = lead.stage.charAt(0).toUpperCase() + lead.stage.slice(1).toLowerCase()
    if (stageCounts[s] !== undefined) {
      stageCounts[s] += 1
    } else {
      stageCounts[s] = 1
    }
  })

  const distributionData = Object.keys(stageCounts).map(key => ({
    name: key,
    total: stageCounts[key]
  }))

  if (!_hasHydrated) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Dashboard Ejecutivo</h1>
        <p className="text-zinc-400">Visión general del rendimiento de ventas e IA.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/conversaciones" className="block group">
          <StatCard
            title="Conversaciones Totales"
            value={conversacionesTotales.toString()}
            description="Historial activo"
            icon={MessageSquare}
            trend={{ value: 0, label: '', isPositive: true }}
            delay={0.1}
            className="border-primary/20 shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_10%,transparent)] transition-transform group-hover:scale-[1.02]"
          />
        </Link>
        <Link href="/leads" className="block group">
          <StatCard
            title="Leads Activos"
            value={leadsActivosCount.toString()}
            description="En pipeline"
            icon={Users}
            trend={{ value: 0, label: '', isPositive: true }}
            delay={0.2}
            className="transition-transform group-hover:scale-[1.02] hover:border-white/20"
          />
        </Link>
        <Link href="/conversaciones" className="block group">
          <StatCard
            title="Conversaciones IA"
            value={conversionesIA.toString()}
            description="Manejado sin humanos"
            icon={Activity}
            trend={{ value: 0, label: '', isPositive: true }}
            delay={0.3}
            className="transition-transform group-hover:scale-[1.02] hover:border-white/20"
          />
        </Link>
        <Link href="/notifications" className="block group">
          <StatCard
            title="Intervención Humana"
            value={intervencionHumana.toString()}
            description="Alertas pendientes"
            icon={MessageSquareWarning}
            trend={{ value: 0, label: '', isPositive: false }}
            delay={0.4}
            className="transition-transform group-hover:scale-[1.02] hover:border-white/20"
          />
        </Link>
      </div>

      {/* Charts & Briefing Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Main Chart */}
        <motion.div 
          className="col-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-black/40 backdrop-blur-xl border-white/10 h-full">
            <CardHeader>
              <CardTitle className="text-white">Distribución de Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full mt-4" style={{ filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.3))' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={distributionData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#71717a" 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#71717a" 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value}
                      dx={-10}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#10b981" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#000', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Briefing Widget */}
        <motion.div 
          className="col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="bg-black/40 backdrop-blur-xl border-white/10 h-full flex flex-col shadow-[0_0_30px_color-mix(in_srgb,var(--primary)_5%,transparent)]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Briefing Diario de IA
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    "Hola. Durante la noche, el agente automatizado gestionó <span className="text-white font-bold">{nuevosLeads || 0} nuevos leads</span>. 
                    <span className="text-primary font-medium"> {hotLeadsCount || 0} de ellos</span> muestran un score mayor a 90 y están listos para cierre humano."
                  </p>
                </div>
                
                <div className="space-y-3 mt-6">
                  <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Top Leads Calientes</h4>
                  
                  {topLeads.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic px-2">No hay leads activos aún.</p>
                  ) : (
                    topLeads.map(lead => (
                      <Link key={lead.id} href={`/leads/${lead.id}`} className="block">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 hover:bg-white/10 transition-colors cursor-pointer border border-white/5 hover:border-white/20">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            <div>
                              <p className="text-sm font-medium text-white">{lead.name}</p>
                              <p className="text-xs text-zinc-500 capitalize">{lead.stage}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Score {lead.score}</span>
                        </div>
                      </Link>
                    ))
                  )}

                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
