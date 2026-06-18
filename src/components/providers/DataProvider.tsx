'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { getLeadsData } from '@/lib/services/queries'
import { createClient } from '@/lib/supabase/client'

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { setLeadsData, setUser } = useAppStore()

  useEffect(() => {
    const supabase = createClient()

    // Fetch leads and conversations from lead_memory
    async function loadLeads() {
      try {
        const { leads, conversations } = await getLeadsData()
        setLeadsData(leads, conversations)
      } catch (error) {
        console.error('Failed to fetch leads from Supabase:', error)
      }
    }

    // Fetch authenticated user profile from Supabase Auth
    async function loadUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return

        const rawName = user.user_metadata?.name || user.user_metadata?.full_name || ''
        const displayName = rawName || user.email?.split('@')[0] || 'Usuario'
        const email = user.email || ''

        // Build initials: up to 2 letters from the display name
        const initials = displayName
          .split(' ')
          .slice(0, 2)
          .map((w: string) => w[0]?.toUpperCase() || '')
          .join('')

        setUser({ name: displayName, email, initials })
      } catch (error) {
        console.error('Failed to fetch user from Supabase Auth:', error)
      }
    }

    loadLeads()
    loadUser()
  }, [setLeadsData, setUser])

  return <>{children}</>
}
