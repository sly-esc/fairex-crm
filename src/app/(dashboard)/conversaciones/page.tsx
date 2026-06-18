'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MoreVertical, Phone, Video, Send, Bot, User, Check, CheckCheck, Sparkles, X, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { useRouter } from 'next/navigation'
import { updateLeadEstado, getChatHistory, getLeadMemory } from '@/lib/services/queries'

export default function ConversacionesPage() {
  const [showAI, setShowAI] = useState(true)
  const [localMessages, setLocalMessages] = useState<Record<string, any[]>>({})
  const [leadMemory, setLeadMemory] = useState<Record<string, any>>({})
  const [draftMessage, setDraftMessage] = useState('')
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  const router = useRouter()
  const { conversations, markConversationAsRead, activeConversationId: activeId, setActiveConversationId: setActiveId, addToast, _hasHydrated, toggleLeadEstado } = useAppStore()

  // When active conversation changes, fetch its real messages and lead memory
  const loadConversationData = useCallback(async (id: string) => {
    const conv = conversations.find(c => c.id === id)
    if (!conv) return

    setIsLoadingMessages(true)
    try {
      // Fetch messages from n8n_chat_histories using the lead's phone number as session_id
      const messages = await getChatHistory(conv.name) // conv.name is the numero
      setLocalMessages(prev => ({ ...prev, [id]: messages }))

      // Fetch lead memory for the right panel
      if (!leadMemory[id]) {
        const memory = await getLeadMemory(id)
        if (memory) {
          setLeadMemory(prev => ({ ...prev, [id]: memory }))
        }
      }
    } catch (error) {
      console.error('Error loading conversation data:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [conversations, leadMemory])

  useEffect(() => {
    if (!_hasHydrated || !activeId) return
    loadConversationData(activeId)
  // We only want to re-run when the active conversation ID changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, _hasHydrated])

  if (!_hasHydrated) return null

  const handleSelectConv = (id: string) => {
    setActiveId(id)
    markConversationAsRead(id)
  }

  const activeConv = conversations.find(c => c.id === activeId)
  const activeMessages = localMessages[activeId] || []
  const activeMemory = leadMemory[activeId] || null

  const handleToggleEstado = async (id: string, currentEstado?: string) => {
    const newEstado = currentEstado === 'EXCLUIR' ? 'ACTIVO' : 'EXCLUIR'
    toggleLeadEstado(id, newEstado)
    try {
      await updateLeadEstado(id, newEstado)
      addToast({ title: 'Estado actualizado', description: `Lead marcado como ${newEstado}`, type: 'success' })
      if (newEstado === 'EXCLUIR') {
        const nextActive = conversations.find(c => c.id !== id && c.estado !== 'EXCLUIR')
        if (nextActive) setActiveId(nextActive.id)
      }
    } catch (error) {
      toggleLeadEstado(id, currentEstado as any || 'ACTIVO')
      addToast({ title: 'Error', description: 'No se pudo actualizar el estado en la base de datos', type: 'error' })
    }
  }

  const handleSendMessage = () => {
    if (!draftMessage.trim()) return
    const newMsg = {
      id: `m-new-${Date.now()}`,
      senderId: 'ai',
      text: draftMessage,
      time: 'Ahora',
      status: 'delivered'
    }
    setLocalMessages(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMsg]
    }))
    setDraftMessage('')

    if (showAI) {
      setShowAI(false)
      addToast({
        title: 'IA Pausada',
        description: 'Has tomado el control manual de la conversación.',
        type: 'warning'
      })
    }
  }

  const handleToggleAI = () => {
    const newState = !showAI
    setShowAI(newState)
    addToast({
      title: newState ? 'Agente IA Activado' : 'Agente IA Pausado',
      description: newState ? 'FAIREX retomará la conversación automáticamente.' : 'Control manual transferido al agente humano.',
      type: newState ? 'success' : 'warning'
    })
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
      
      {/* LEFT PANEL: Inbox List */}
      <div className="w-80 flex flex-col border-r border-white/10 bg-zinc-950/50">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Mensajes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Buscar chats..." 
              className="bg-black/50 border-white/10 pl-9 focus-visible:ring-primary/50 text-white rounded-full"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-2 space-y-1">
            {conversations.filter(c => c.estado !== 'EXCLUIR').map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConv(conv.id)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                  activeId === conv.id 
                    ? 'bg-primary/15 border border-primary/30 shadow-[0_0_15px_color-mix(in_srgb,var(--primary)_10%,transparent)]' 
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <Avatar className="h-10 w-10 border border-white/10 shrink-0">
                  <AvatarFallback className={
                    conv.status === 'hot' ? 'bg-red-500/20 text-red-500 font-bold' :
                    conv.status === 'warm' ? 'bg-amber-500/20 text-amber-500 font-bold' :
                    'bg-blue-500/20 text-blue-500 font-bold'
                  }>
                    {conv.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-semibold truncate ${activeId === conv.id ? 'text-white' : 'text-zinc-200'}`}>{conv.name}</span>
                    <span className="text-xs text-zinc-500 shrink-0 ml-2">{conv.time}</span>
                  </div>
                  <p className="text-sm text-zinc-400 truncate pr-2">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <Badge className="bg-primary hover:bg-primary text-white rounded-full px-2 py-0.5 h-5 min-w-[20px] flex items-center justify-center shrink-0">
                    {conv.unread}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MIDDLE PANEL: Chat View */}
      <div className="flex-1 flex flex-col bg-[#09090b] relative">
        {/* Chat Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-zinc-950/50 backdrop-blur-md gap-4 shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 border border-white/10 shrink-0">
              <AvatarFallback className={
                    activeConv?.status === 'hot' ? 'bg-red-500/20 text-red-500 font-bold' :
                    activeConv?.status === 'warm' ? 'bg-amber-500/20 text-amber-500 font-bold' :
                    'bg-blue-500/20 text-blue-500 font-bold'
                  }>{activeConv?.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">{activeConv?.name}</h3>
              <p className="text-xs text-emerald-400 flex items-center gap-1 truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                <span className="truncate">En línea (WhatsApp)</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-zinc-400 hover:text-white rounded-full"
              onClick={() => addToast({ title: 'Llamando...', description: 'Funcionalidad VoIP próximamente', type: 'default' })}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-zinc-400 hover:text-white rounded-full"
              onClick={() => addToast({ title: 'Iniciando videollamada...', description: 'Integración Zoom próximamente', type: 'default' })}
            >
              <Video className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleToggleAI}
              className={`rounded-full transition-colors ${showAI ? 'text-primary bg-primary/10 shadow-[0_0_15px_color-mix(in_srgb,var(--primary)_30%,transparent)]' : 'text-amber-500 bg-amber-500/10'}`}
              title={showAI ? "IA Activa" : "IA Pausada"}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center outline-none h-10 w-10 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full focus-visible:ring-0 shrink-0">
                  <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-zinc-950 border-white/10 text-zinc-200" align="end">
                <DropdownMenuItem onClick={() => router.push(`/leads/${activeId}`)}>
                  Ver Ficha CRM
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addToast({ title: 'Exportar chat', description: 'Próximamente', type: 'default' })}>
                  Exportar conversación
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addToast({ title: 'Prioridad actualizada', description: 'Se marcó como alta prioridad.', type: 'success' })}>
                  Marcar prioridad
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => handleToggleEstado(activeId, activeConv?.estado)}>
                  {activeConv?.estado === 'EXCLUIR' ? 'Activar lead' : 'Excluir lead'}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-400" onClick={() => addToast({ title: 'Lead silenciado', description: 'No recibirás notificaciones.', type: 'warning' })}>
                  Silenciar lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col-reverse">
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-20 text-zinc-500 text-sm gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-zinc-600 border-t-primary rounded-full" />
                  Cargando mensajes...
                </div>
              ) : activeMessages.length === 0 ? (
                <EmptyState 
                  icon={MessageSquare}
                  title="Sin mensajes"
                  description="Este lead aún no tiene mensajes en su historial."
                  actionLabel="Iniciar conversación"
                  onAction={() => handleToggleAI()}
                />
              ) : (
                <motion.div
                  key={activeId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {activeMessages.map((msg) => {
                    const isLead = msg.senderId === 'lead'
                    const isAI = msg.senderId === 'ai'
                    
                    return (
                      <div 
                        key={msg.id}
                        className={`flex gap-3 ${isLead ? 'flex-row' : 'flex-row-reverse'}`}
                      >
                        <Avatar className="h-8 w-8 border border-white/10 shrink-0 mt-auto">
                          <AvatarFallback className={isLead ? 'bg-zinc-800 text-zinc-300' : isAI ? 'bg-primary/20 text-primary' : 'bg-blue-600'}>
                            {isLead ? <User className="h-4 w-4" /> : isAI ? <Bot className="h-4 w-4" /> : 'YO'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`flex flex-col max-w-[70%] ${isLead ? 'items-start' : 'items-end'}`}>
                          <div 
                            className={`p-3 rounded-2xl ${
                              isLead 
                                ? 'bg-zinc-900 border border-white/5 text-zinc-200 rounded-bl-none' 
                                : isAI
                                  ? 'bg-primary/10 border border-primary/20 text-primary-100 rounded-br-none shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_10%,transparent)]'
                                  : 'bg-blue-600 text-white rounded-br-none shadow-[0_0_10px_rgba(37,99,235,0.2)]'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500 font-medium">
                            {msg.time && <span>{msg.time}</span>}
                            {!isLead && (
                              msg.status === 'read' ? <CheckCheck className="h-3 w-3 text-blue-400" /> : <Check className="h-3 w-3" />
                            )}
                            {isAI && <span className="ml-1 text-primary/70">· Respondido por FAIREX</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-zinc-950/80 backdrop-blur-md border-t border-white/10">
          <div className="flex items-end gap-2 bg-black/50 border border-white/10 p-2 rounded-2xl focus-within:ring-1 focus-within:ring-primary/50 transition-all">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white shrink-0 rounded-full h-10 w-10" onClick={() => handleToggleAI()}>
              <Bot className={`h-5 w-5 ${showAI ? 'text-primary' : 'text-zinc-500'}`} />
            </Button>
            <textarea 
              className="flex-1 bg-transparent border-none text-white text-sm resize-none focus:outline-none max-h-32 min-h-[40px] py-2.5 placeholder:text-zinc-400"
              placeholder={`Toma el control y escribe a ${activeConv?.name?.split(' ')[0]}...`}
              rows={1}
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <Button 
              onClick={handleSendMessage}
              className="shrink-0 rounded-full h-10 w-10 bg-primary hover:bg-primary/90 text-white p-0 shadow-[0_0_15px_color-mix(in_srgb,var(--primary)_30%,transparent)]"
            >
              <Send className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <p className="text-center text-[10px] text-zinc-500 mt-2 font-medium">
            {showAI ? 'Si envías un mensaje manual, la IA pausará su seguimiento automáticamente.' : 'La IA está pausada. Tu control es manual.'}
          </p>
        </div>
      </div>

      {/* RIGHT PANEL: AI Lead Memory */}
      <AnimatePresence>
        {showAI && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-white/10 bg-zinc-950/50 flex flex-col"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-primary/5">
              <h2 className="text-sm font-bold text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Lead Memory
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAI(false)} className="h-6 w-6 text-zinc-500 hover:text-white rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={`memory-${activeId}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-5 space-y-6"
                >
                  {!activeMemory ? (
                    <p className="text-sm text-zinc-500 text-center pt-4">Cargando datos del lead...</p>
                  ) : (
                    <>
                      {/* Score & Stage */}
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 flex items-center justify-center">
                          <svg className="absolute inset-0 h-full w-full -rotate-90 transform">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-white/5" />
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="175" strokeDashoffset={175 - (175 * activeMemory.score) / 100} className="text-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                          </svg>
                          <span className="text-xl font-bold text-white">{activeMemory.score}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-400">Score de Cierre</p>
                          <Badge className="mt-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold tracking-wide">
                            {activeMemory.stage.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <Separator className="bg-white/10" />

                      {/* AI Summary */}
                      <div>
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Resumen Inteligente</h3>
                        <p className="text-sm text-zinc-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/10 shadow-inner">
                          {activeMemory.summary}
                        </p>
                      </div>

                      {/* Needs */}
                      {activeMemory.needs.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Necesidades Detectadas</h3>
                          <div className="flex flex-wrap gap-2">
                            {activeMemory.needs.map((need: string, i: number) => (
                              <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                                {need}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Objections */}
                      {activeMemory.objections.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Objeciones</h3>
                          <div className="flex flex-wrap gap-2">
                            {activeMemory.objections.map((obj: string, i: number) => (
                              <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                                {obj}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
