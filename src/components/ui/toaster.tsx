'use client'

import { useAppStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react'
import { useEffect } from 'react'

export function Toaster() {
  const { toasts, removeToast } = useAppStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          
          const Icon = 
            toast.type === 'success' ? CheckCircle2 :
            toast.type === 'error' ? XCircle :
            toast.type === 'warning' ? AlertCircle :
            Info

          const colorClass = 
            toast.type === 'success' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
            toast.type === 'error' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
            toast.type === 'warning' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
            'text-primary border-primary/20 bg-primary/10'

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl w-80 bg-zinc-950/80 ${colorClass}`}
            >
              <Icon className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs mt-1 text-zinc-300">{toast.description}</p>
                )}
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              
              {/* Auto dismiss effect */}
              <ToastTimer id={toast.id} onRemove={removeToast} />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function ToastTimer({ id, onRemove }: { id: string, onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id)
    }, 4000)
    return () => clearTimeout(timer)
  }, [id, onRemove])
  return null
}
