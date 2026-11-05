import { redirect } from 'next/navigation'
import { AuthFrame } from '@/components/auth/auth-frame'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { auth } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

export default async function ForgotPasswordPage() {
  const { data: session } = await auth.getSession()
  if (session?.user) redirect('/')

  return (
    <AuthFrame title="auth.reset.title">
      <ForgotPasswordForm />
    </AuthFrame>
  )
}
