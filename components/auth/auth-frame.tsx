'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { BrandMark } from '@/components/app-shell'
import { useLang } from '@/lib/i18n'

export type AuthRole = 'shopper' | 'merchant'

export const otherRole = (role: AuthRole): AuthRole =>
  role === 'merchant' ? 'shopper' : 'merchant'

const TERM_LINKS = { terms: '/terms', acceptable: '/terms#acceptable-use', privacy: '/privacy' }

export function AuthFrame({
  title,
  children,
  footer,
  terms,
  role,
}: {
  title: string
  children: ReactNode
  footer?: ReactNode
  terms?: 'sign-in' | 'sign-up' | null
  role?: AuthRole
}) {
  const { t, lang } = useLang()
  const other = role ? otherRole(role) : null

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4 py-8">
      {role && other && (
        <Link
          href={`?role=${other}`}
          className="fixed right-4 top-4 inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm font-medium text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeftRight className="size-4" aria-hidden />
          {t('auth.switchTo')} {other === 'merchant' ? t('roles.merchant') : t('roles.shopper')}
        </Link>
      )}
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark className="size-12 rounded-2xl" />
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{t(title)}</h1>
          {role && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t('auth.continueAs')} {role === 'merchant' ? t('roles.merchant') : t('roles.shopper')}
            </p>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs">{children}</div>

        {footer && <p className="mt-4 text-center text-sm text-muted-foreground">{footer}</p>}
        {terms && (
          <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
            {lang === 'bn' ? (
              terms === 'sign-in' ? (
                <>
                  সাইন ইন করে, আপনি আমাদের{' '}
                  <Link href={TERM_LINKS.terms} className="underline hover:text-foreground">
                    শর্তাবলী
                  </Link>{' '}
                  ও{' '}
                  <Link href={TERM_LINKS.privacy} className="underline hover:text-foreground">
                    গোপনীয়তা নীতি
                  </Link>{' '}
                  মেনে নিচ্ছেন।
                </>
              ) : (
                <>
                  সাইন আপ করে, আপনি আমাদের{' '}
                  <Link href={TERM_LINKS.terms} className="underline hover:text-foreground">
                    শর্তাবলী
                  </Link>
                  ,{' '}
                  <Link href={TERM_LINKS.acceptable} className="underline hover:text-foreground">
                    গ্রহণযোগ্য ব্যবহার
                  </Link>{' '}
                  ও{' '}
                  <Link href={TERM_LINKS.privacy} className="underline hover:text-foreground">
                    গোপনীয়তা নীতি
                  </Link>{' '}
                  মেনে নিচ্ছেন।
                </>
              )
            ) : terms === 'sign-in' ? (
              <>
                By signing in, you agree to our{' '}
                <Link href={TERM_LINKS.terms} className="underline hover:text-foreground">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href={TERM_LINKS.privacy} className="underline hover:text-foreground">
                  Privacy Policy
                </Link>
                .
              </>
            ) : (
              <>
                By signing up, you agree to our{' '}
                <Link href={TERM_LINKS.terms} className="underline hover:text-foreground">
                  Terms
                </Link>
                ,{' '}
                <Link href={TERM_LINKS.acceptable} className="underline hover:text-foreground">
                  Acceptable Use
                </Link>
                , and{' '}
                <Link href={TERM_LINKS.privacy} className="underline hover:text-foreground">
                  Privacy Policy
                </Link>
                .
              </>
            )}
          </p>
        )}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © 2026 Tokio. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export function AuthFooter({
  leadKey,
  linkKey,
  href,
}: {
  leadKey: string
  linkKey: string
  href: string
}) {
  const { t } = useLang()
  return (
    <>
      {t(leadKey)}{' '}
      <Link href={href} className="font-medium text-primary hover:underline">
        {t(linkKey)}
      </Link>
    </>
  )
}
