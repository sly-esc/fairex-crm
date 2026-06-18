import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-8 text-center h-full w-full min-h-[300px]"
    >
      <div className="h-20 w-20 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mb-6 shadow-2xl relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-50" />
        <Icon className="h-10 w-10 text-primary relative z-10" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 max-w-md mb-6">{description}</p>
      
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_30%,transparent)] rounded-full px-8"
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}
