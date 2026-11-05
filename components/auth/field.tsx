'use client'

import { useState, type ComponentType, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const inputClass =
  'h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-[15px] transition-colors placeholder:text-muted-foreground aria-invalid:border-destructive'

export function IconField({
  icon: Icon,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon: ComponentType<{ className?: string }> }) {
  return (
    <div className={cn('relative', className)}>
      <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input {...props} className={inputClass} />
    </div>
  )
}

export function PasswordField({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon?: ComponentType<{ className?: string }> }) {
  const [show, setShow] = useState(false)
  const Icon = props.icon ?? (() => null)
  return (
    <div className={cn('relative', className)}>
      <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className={cn(inputClass, 'pr-10')}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  )
}
