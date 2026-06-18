'use client'

import { motion } from 'framer-motion'
import { Sparkles, MessageSquare, AlertTriangle, Target, CheckCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAppStore } from '@/lib/store'
import { EmptyState } from '@/components/ui/empty-state'

export default function NotificationsPage() {
  const { notifications, markAllNotificationsAsRead, markNotificationAsRead, setActiveConversationId, _hasHydrated } = useAppStore()

  if (!_hasHydrated) return null

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Alertas y Notificaciones</h1>
          <p className="text-zinc-400">Mantente al tanto de la actividad crítica de tu IA y leads.</p>
        </div>
        <Button 
          onClick={markAllNotificationsAsRead}
          variant="outline" 
          className="border-white/10 bg-black/40 text-white hover:bg-white/10 rounded-full transition-colors shrink-0"
        >
          <CheckCheck className="h-4 w-4 mr-2" /> Marcar todas como leídas
        </Button>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <EmptyState 
            icon={CheckCheck}
            title="Todo al día"
            description="No tienes alertas ni notificaciones pendientes en este momento."
          />
        ) : (
          notifications.map((notif, index) => {
            
            const Icon = 
              notif.type === 'lead_hot' ? Target :
              notif.type === 'ai_score' ? Sparkles :
              notif.type === 'message' ? MessageSquare :
              AlertTriangle

            const iconColorClass = 
              notif.type === 'lead_hot' ? 'text-red-400 bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]' :
              notif.type === 'ai_score' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]' :
              notif.type === 'message' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' :
              'text-zinc-400 bg-zinc-800 border-white/10'

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={notif.id}
                className={`relative flex gap-5 p-6 rounded-2xl border transition-all group ${
                  notif.read 
                    ? 'bg-black/20 border-white/5 opacity-75 hover:opacity-100' 
                    : 'bg-black/40 border-white/10 backdrop-blur-xl shadow-lg border-l-4 border-l-primary hover:border-white/20'
                }`}
              >
                {!notif.read && (
                  <div className="absolute top-6 right-6 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_50%,transparent)]" />
                )}
                
                <div className={`h-12 w-12 rounded-full border-2 flex items-center justify-center shrink-0 ${iconColorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 pr-8">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold text-lg ${notif.read ? 'text-zinc-300' : 'text-white'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-xs font-medium text-zinc-500">{notif.time}</span>
                  </div>
                  <p className={`${notif.read ? 'text-zinc-500' : 'text-zinc-400'} text-sm leading-relaxed mt-1`}>
                    {notif.description}
                  </p>

                  {!notif.read && (notif.type === 'lead_hot' || notif.type === 'ai_score') && (
                    <Link href={`/leads/${notif.leadId || '1'}`} onClick={() => markNotificationAsRead(notif.id)}>
                      <Button variant="ghost" size="sm" className={`mt-4 rounded-full h-8 px-4 text-xs font-bold border transition-all ${
                        notif.type === 'lead_hot' 
                          ? 'text-primary hover:text-primary hover:bg-primary/10 border-primary/20 group-hover:bg-primary/10' 
                          : 'text-emerald-400 hover:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/10'
                      }`}>
                        Ver Perfil CRM <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                  {!notif.read && notif.type === 'message' && (
                    <Link href="/conversaciones" onClick={() => {
                      markNotificationAsRead(notif.id)
                      if (notif.leadId) setActiveConversationId(notif.leadId)
                    }}>
                      <Button variant="ghost" size="sm" className="mt-4 text-blue-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-full h-8 px-4 text-xs font-bold border border-blue-500/20 transition-all">
                        Ir al Chat <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
