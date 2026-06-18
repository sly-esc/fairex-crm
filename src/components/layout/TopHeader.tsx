'use client'

import { useState, useEffect } from 'react'
import { Bell, Search, Menu, Users, MessageSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'

export function TopHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { notifications, markNotificationAsRead, setActiveConversationId, conversations, addToast, user } = useAppStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Cierra el sidebar móvil automáticamente al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const unreadNotifications = notifications.filter(n => !n.read)
  const hasUnread = unreadNotifications.length > 0

  // Búsqueda global simulada
  const searchResults = conversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-black/40 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden text-zinc-400 hover:text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-none bg-transparent w-64" showCloseButton={false}>
            <AppSidebar />
          </SheetContent>
        </Sheet>
        <div 
          className="relative w-full max-w-md hidden md:block"
          onBlur={(e) => {
            // Close search dropdown when clicking outside
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setIsSearchOpen(false)
            }
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            type="search"
            placeholder="Buscar leads, conversaciones..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsSearchOpen(true)
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full bg-black/50 border-white/10 pl-10 text-sm text-zinc-200 focus-visible:ring-primary/50 rounded-full"
          />
          
          {/* Dropdown de Búsqueda Global */}
          {isSearchOpen && searchQuery.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-white/10 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden z-50">
              <div className="p-2 border-b border-white/5 bg-white/[0.02]">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-2">Resultados Rápidos</p>
              </div>
              <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar">
                {searchResults.length === 0 ? (
                  <div className="py-8">
                    <EmptyState 
                      icon={Search} 
                      title="Sin resultados" 
                      description={`No encontramos coincidencias para "${searchQuery}"`}
                    />
                  </div>
                ) : (
                  searchResults.map(res => (
                    <div 
                      key={res.id} 
                      tabIndex={0}
                      className="p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors flex items-center justify-between group focus:bg-white/5 focus:outline-none"
                    >
                      <div 
                        className="flex items-center gap-3 flex-1 overflow-hidden"
                        onClick={() => {
                          setSearchQuery('')
                          setIsSearchOpen(false)
                          setActiveConversationId(res.id)
                          router.push(`/leads/${res.id}`)
                        }}
                      >
                        <Avatar className="h-8 w-8 shrink-0 border border-white/10">
                          <AvatarFallback className={
                            res.status === 'hot' ? 'bg-red-500/20 text-red-500' :
                            res.status === 'warm' ? 'bg-amber-500/20 text-amber-500' :
                            'bg-blue-500/20 text-blue-500'
                          }>
                            {res.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{res.name}</p>
                          <p className="text-xs text-zinc-400 truncate">{res.lastMessage}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-zinc-400 hover:text-white bg-black/50 rounded-md"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSearchQuery('')
                            setIsSearchOpen(false)
                            setActiveConversationId(res.id)
                            router.push(`/leads/${res.id}`)
                          }}
                          title="Abrir Ficha CRM"
                        >
                          <Users className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-primary hover:text-primary bg-primary/10 rounded-md"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSearchQuery('')
                            setIsSearchOpen(false)
                            setActiveConversationId(res.id)
                            router.push(`/conversaciones`)
                          }}
                          title="Ir a Conversación"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center outline-none relative text-zinc-400 hover:bg-white/10 hover:text-white rounded-full focus-visible:ring-0 h-10 w-10">
              <Bell className="h-5 w-5" />
              {hasUnread && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-black shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
              )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 bg-zinc-950 border-white/10 text-zinc-200 shadow-2xl p-0" align="end" forceMount>
            <div className="p-4 border-b border-white/10 font-medium text-white flex justify-between items-center">
              Notificaciones
              {hasUnread && (
                <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-bold">{unreadNotifications.length} nuevas</span>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {notifications.slice(0, 5).map(notif => {
                const isSystem = notif.type === 'system';
                const href = notif.type === 'message' 
                  ? '/conversaciones' 
                  : (notif.type === 'lead_hot' || notif.type === 'ai_score') 
                    ? `/leads/${notif.leadId || '1'}` 
                    : '#';

                const innerContent = (
                  <div className={`p-3 border-b border-white/5 transition-colors flex gap-3 ${isSystem ? '' : 'hover:bg-white/5 cursor-pointer'}`}>
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${notif.read ? 'bg-transparent' : 'bg-primary'}`} />
                    <div>
                      <p className={`text-sm font-medium ${notif.read ? 'text-zinc-300' : 'text-white'}`}>{notif.title}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{notif.description}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">{notif.time}</p>
                    </div>
                  </div>
                );

                if (isSystem) {
                  return (
                    <div key={notif.id} onClick={() => markNotificationAsRead(notif.id)}>
                      {innerContent}
                    </div>
                  );
                }

                return (
                  <Link 
                    key={notif.id} 
                    href={href}
                    onClick={() => {
                      markNotificationAsRead(notif.id)
                      if (notif.leadId && notif.type === 'message') setActiveConversationId(notif.leadId)
                    }}
                  >
                    {innerContent}
                  </Link>
                );
              })}
            </div>
            <div className="p-2 border-t border-white/10">
              <Link href="/notifications">
                <Button variant="ghost" className="w-full text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-md">
                  Ver todas las notificaciones
                </Button>
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center outline-none relative h-8 w-8 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/10">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {user.initials || '?'}
                </AvatarFallback>
              </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-zinc-950 border-white/10 text-zinc-200 shadow-2xl" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-white">{user.name || 'Usuario'}</p>
                <p className="text-xs leading-none text-zinc-500 mt-1">
                  {user.email || ''}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer" onClick={() => router.push('/settings')}>
              Configuración
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer" onClick={() => addToast({ title: 'Soporte técnico', description: 'Próximamente: Panel de Ayuda', type: 'default' })}>
              Soporte
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer" onClick={async () => {
              addToast({ title: 'Cerrando sesión', description: 'Por favor espera...', type: 'default' })
              const supabase = createClient()
              await supabase.auth.signOut()
              router.push('/login')
              router.refresh()
            }}>
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
