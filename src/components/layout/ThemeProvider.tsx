'use client'

import { useAppStore } from '@/lib/store'
import { useEffect } from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { branding } = useAppStore()

  // Convierte un HEX a HSL porque tailwind usa `hsl(var(--primary))`
  // Para simplificar, en el MVP simplemente forzaremos la variable hex usando un estilo en línea o inyectando hsl.
  // Tailwind de shadcn usa variables hsl en la forma "H S% L%". 
  // Una forma robusta es directamente aplicar color al :root 
  
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --primary: ${branding.primaryColor || '#10b981'};
          }
        `
      }} />
      {children}
    </>
  )

}
