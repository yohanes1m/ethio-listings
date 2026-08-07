'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive' | 'warning'
  isLoading?: boolean
  onConfirm: () => void
  requireText?: string
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
  onConfirm,
  requireText,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('')
  const canConfirm = !requireText || typed === requireText

  function handleClose() {
    onOpenChange(false)
    setTyped('')
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          {(variant === 'destructive' || variant === 'warning') && (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
              variant === 'destructive' ? 'bg-destructive/10' : 'bg-amber-500/10'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                variant === 'destructive' ? 'text-destructive' : 'text-amber-500'
              }`} />
            </div>
          )}
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {requireText && (
          <div className="space-y-1.5 py-1">
            <p className="text-xs text-muted-foreground">
              Type <span className="font-mono font-semibold text-foreground">{requireText}</span> to confirm
            </p>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={requireText}
              className="font-mono text-sm"
              autoComplete="off"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={() => { onConfirm(); setTyped('') }}
            disabled={isLoading || !canConfirm}
          >
            {isLoading ? 'Working…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
