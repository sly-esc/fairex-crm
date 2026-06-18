'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useAppStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

export default function RecoverPasswordPage() {
  const [isSent, setIsSent] = useState(false)
  const { addToast } = useAppStore()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSent(true)
    addToast({
      title: 'Enlace enviado',
      description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.',
      type: 'success'
    })
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md px-4 z-10"
      >
        <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-bold tracking-tight text-white">
              Recuperar Contraseña
            </CardTitle>
            <CardDescription className="text-center text-zinc-400">
              Ingresa tu correo para recibir un enlace de restablecimiento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">Correo Electrónico</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="ejemplo@empresa.com" 
                    required 
                    className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-primary/50"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full mt-2" 
                >
                  Enviar enlace de recuperación
                </Button>
              </form>
            ) : (
              <div className="text-center py-4 text-emerald-400 font-medium">
                ¡Enlace enviado correctamente! Redirigiendo...
              </div>
            )}
            
            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors inline-flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
