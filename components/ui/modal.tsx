'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, description, children, footer, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className={cn(
        'm-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-2xl border bg-card p-0 text-card-foreground shadow-xl',
        'sm:m-auto sm:max-w-lg sm:rounded-2xl',
        'open:animate-in open:fade-in-0 open:slide-in-from-bottom-4 open:duration-200',
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[92dvh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold text-balance">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-0.5 text-sm text-muted-foreground text-pretty">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
              <span className="sr-only">Close</span>
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <footer className="flex flex-wrap justify-end gap-2 border-t bg-muted/40 px-5 py-3">{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}
