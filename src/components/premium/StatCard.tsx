'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  delay?: number
  className?: string
}

export function StatCard({ title, value, description, icon: Icon, trend, delay = 0, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      <Card className={cn("bg-black/40 backdrop-blur-xl border-white/10 hover:border-primary/30 transition-colors", className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-zinc-400">
            {title}
          </CardTitle>
          <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            <Icon className="h-4 w-4 text-zinc-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
          
          {(description || trend) && (
            <div className="mt-2 flex items-center text-sm">
              {trend && (
                <span className={cn("font-medium mr-2", trend.isPositive ? "text-emerald-400" : "text-red-400")}>
                  {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                </span>
              )}
              {description && (
                <span className="text-zinc-500">{description}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
