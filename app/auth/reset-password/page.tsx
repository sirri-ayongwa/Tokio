import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AuthFrame } from '@/components/auth/auth-frame'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { getAuth } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage() {
  const { data: session } = await getAuth().getSession()
  if (session?.user) redirect('/')

  return (
    <AuthFrame title="auth.reset.newTitle">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthFrame>
  )
}
