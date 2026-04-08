'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { AdminSignInForm } from '@/components/admin-sign-in-form'
import { supabase } from '@/lib/supabase'

const ADMIN_USER_ID = '0e4963ee-0ce1-4f08-bf6f-d77583642f18'

export default function AdminPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)

  const isAdmin = session?.user?.id === ADMIN_USER_ID

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      router.push('/')
    }
  }, [isAdmin, router])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Admin sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage your Digital Inspo library.
          </p>
        </div>

        <AdminSignInForm />
      </div>
    </main>
  )
}