'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useForgotPassword } from '@/hooks/useAuth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const forgot = useForgotPassword()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    forgot.mutate(email, {
      onSuccess: () => setSent(true),
    })
  }

  if (sent) {
    return (
      <Card className="shadow-sm border border-border text-center p-8">
        <div className="text-4xl mb-4">✉️</div>
        <h2 className="text-lg font-semibold mb-2">Check your email</h2>
        <p className="text-sm text-muted-foreground mb-6">
          We sent a password reset link to <strong>{email}</strong>.
        </p>
        <Link href="/auth/login">
          <Button variant="outline" className="w-full">
            Back to Sign In
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">Reset Password</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button type="submit" className="w-full" disabled={forgot.isPending}>
            {forgot.isPending ? 'Sending...' : 'Send Reset Link'}
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
