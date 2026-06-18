'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MessageSquare, Users, KanbanSquare, CheckSquare, Bell, Settings, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { useAppStore } from '@/lib/store'

// Mock de configuración Multiempresa (White Label)
// Posteriormente esto vendrá de Supabase (tabla: company_settings)
const COMPANY_CONFIG = {
  name: 'FAIREX',
}

export function AppSidebar() {
  const pathname = usePathname()
  const { conversations, notifications, branding } = useAppStore()
  
  const unreadConversations = conversations.reduce((acc, c) => acc + c.unread, 0)
  const unreadNotifications = notifications.filter(n => !n.read).length

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Conversaciones', href: '/conversaciones', icon: MessageSquare, badge: unreadConversations > 0 ? unreadConversations : undefined },
    { name: 'Leads', href: '/leads', icon: Users },
    { name: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
    { name: 'Tareas', href: '/tasks', icon: CheckSquare },
    { name: 'Alertas', href: '/notifications', icon: Bell, badge: unreadNotifications > 0 ? unreadNotifications : undefined },
  ]

  return (
    <div className="flex flex-col h-full w-64 bg-black/40 backdrop-blur-xl border-r border-white/10">
      
      {/* Brand Header (White Label Ready) */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          {/* Logo container que podrá recibir imágenes personalizadas del cliente */}
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_color-mix(in_srgb,var(--primary)_30%,transparent)] overflow-hidden">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Sparkles className="h-4 w-4 text-primary" />
            )}
          </div>
          <span className="text-white font-bold tracking-tight text-xl">{COMPANY_CONFIG.name}</span>
        </div>
      </div>

      <TooltipProvider>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group',
                    isActive 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-zinc-500 group-hover:text-zinc-300')} />
                  <span className="flex-1 font-medium">{item.name}</span>
                  {item.badge !== undefined && (
                    <span className="bg-primary/20 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-primary/20">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </TooltipProvider>

      <div className="p-4 border-t border-white/10 space-y-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Settings className="h-5 w-5 text-zinc-500" />
          <span className="font-medium">Configuración</span>
        </Link>
        
        {/* Discreto branding original para agencias/White Label */}
        <div className="text-center pt-2">
          <p className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase">
            Powered by FAIREX AI
          </p>
        </div>
      </div>

    </div>
  )
}
