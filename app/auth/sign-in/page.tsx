import { redirect } from 'next/navigation'
import { AuthFooter, AuthFrame, type AuthRole } from '@/components/auth/auth-frame'
import { SignInForm } from '@/components/auth/sign-in-form'
import { auth } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { data: session } = await auth.getSession()
  if (session?.user) redirect('/')
  const { role } = await searchParams
  const resolved: AuthRole = role === 'merchant' ? 'merchant' : 'shopper'

  return (
    <AuthFrame
      title="auth.signin.title"
      terms="sign-in"
      role={resolved}
      footer={
        <AuthFooter
          leadKey="auth.newHere"
          linkKey="auth.createAccount"
          href={`/auth/sign-up?role=${resolved}`}
        />
      }
    >
      <SignInForm />
    </AuthFrame>
  )
}
