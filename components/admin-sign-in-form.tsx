'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AdminSignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    if (signInError) setError(signInError.message)
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col items-stretch gap-2 sm:max-w-none sm:items-end">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-end sm:justify-end">
        <Input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-9 sm:max-w-[180px]"
          required
        />
        <Input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-9 sm:max-w-[140px]"
          required
        />
        <Button type="submit" size="sm" disabled={loading} className="shrink-0">
          {loading ? '…' : 'Sign in'}
        </Button>
      </div>
      {error ? (
        <p className="text-xs text-destructive sm:text-right">{error}</p>
      ) : null}
    </form>
  )
}
