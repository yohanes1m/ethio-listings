'use client'

import { useAdminUsers, useChangeUserRole } from '@/hooks/useAdminListings'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RoleGuard } from '@/components/auth/RoleGuard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

function UsersContent() {
  const { data: users, isLoading } = useAdminUsers()
  const changeRole = useChangeUserRole()

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">{users?.length ?? 0} total</p>
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
    </div>
  )
}
