'use client'

import { useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import { useAdminUsers, useChangeUserRole, useCreateBroker } from '@/hooks/useAdminListings'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { RoleGuard } from '@/components/auth/RoleGuard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'react-hot-toast'

export default function UsersPage() {
  return (
    <RoleGuard roles={['ADMIN']}>
      <UsersContent />
    </RoleGuard>
  )
}

const ROLE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  ADMIN: 'default',
  BROKER: 'outline',
  BUYER: 'secondary',
}

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
}

function UsersContent() {
  const { data: users, isLoading } = useAdminUsers()
  const changeRole = useChangeUserRole()
  const createBroker = useCreateBroker()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  async function handleCreate() {
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      toast.error('Please fill in all required fields')
      return
    }
    try {
      await createBroker.mutateAsync(form)
      toast.success('Broker account created!')
      setShowModal(false)
      setForm(EMPTY_FORM)
    } catch {
      toast.error('Failed to create broker. Email may already be registered.')
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Users</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{users?.length ?? 0} total</p>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Create Broker
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      )}

      {users && (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-4 p-4 bg-card hover:bg-muted/30 transition-colors">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {u.first_name[0]}{u.last_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{u.first_name} {u.last_name}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <Badge variant={ROLE_VARIANT[u.role] ?? 'secondary'} className="text-[10px] shrink-0">
                {u.role}
              </Badge>
              <Select
                value={u.role}
                onValueChange={(v) => { if (v) changeRole.mutate({ id: u.id, role: v }) }}
              >
                <SelectTrigger className="w-28 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUYER">Buyer</SelectItem>
                  <SelectItem value="BROKER">Broker</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

      {/* Create Broker Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold">Create Broker Account</h2>
              <button
                onClick={() => { setShowModal(false); setForm(EMPTY_FORM) }}
                className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>First Name <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.first_name}
                    onChange={(e) => update('first_name', e.target.value)}
                    placeholder="Dawit"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.last_name}
                    onChange={(e) => update('last_name', e.target.value)}
                    placeholder="Bekele"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="broker@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone <span className="text-muted-foreground font-normal text-xs">optional</span></Label>
                <Input
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+251911000000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Password <span className="text-destructive">*</span></Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="Min 8 characters"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The account will be created with Broker role. Share the credentials with the broker.
              </p>
            </div>
            <div className="flex gap-3 p-5 border-t border-border">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setShowModal(false); setForm(EMPTY_FORM) }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={createBroker.isPending}
              >
                {createBroker.isPending ? 'Creating...' : 'Create Broker'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
