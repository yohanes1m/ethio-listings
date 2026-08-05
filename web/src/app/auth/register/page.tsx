'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useRegister } from '@/hooks/useAuth'

export default function RegisterPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  })
  const [error, setError] = useState('')
  const register = useRegister()

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    setError('')
    register.mutate({
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      ...(form.phone ? { phone: form.phone } : {}),
      password: form.password,
    })
  }

  return (
    <Card className="shadow-sm border border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">ተመዝገብ</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Create your EthioListings account</p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                required
                value={form.first_name}
                onChange={update('first_name')}
                placeholder="Yohanis"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                required
                value={form.last_name}
                onChange={update('last_name')}
                placeholder="Haile"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Phone Number{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={update('phone')}
              placeholder="+251 9xx xxx xxx"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={form.password}
              onChange={update('password')}
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
              value={form.confirm}
              onChange={update('confirm')}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={register.isPending}>
            {register.isPending ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        Already have an account?&nbsp;
        <Link href="/auth/login" className="text-primary font-medium hover:underline">
          Sign In
        </Link>
      </CardFooter>
    </Card>
  )
}
