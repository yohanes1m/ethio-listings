'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useResetPassword } from '@/hooks/useAuth'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const reset = useResetPassword()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (!token) {
      setError('Invalid or missing reset token')
      return
    }
    setError('')
    reset.mutate({ token, password })
  }

  if (!token) {
    return (
      <Card className="shadow-sm border border-border text-center p-8">
        <p className="text-destructive mb-4">Invalid or missing reset link.</p>
        <Link href="/auth/forgot-password">
          <Button variant="outline">Request a new link</Button>
        </Link>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">New Password</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Choose a new password for your account.</p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min. 8 characters"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={reset.isPending}>
            {reset.isPending ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        <Link href="/auth/login" className="text-primary font-medium hover:underline">
          Back to Sign In
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
