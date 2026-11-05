import { redirect } from 'next/navigation'
import { AuthFooter, AuthFrame, type AuthRole } from '@/components/auth/auth-frame'
import { SignUpForm } from '@/components/auth/sign-up-form'
import { getAuth } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { data: session } = await getAuth().getSession()
  if (session?.user) redirect('/')
  const { role } = await searchParams
  const resolved: AuthRole = role === 'merchant' ? 'merchant' : 'shopper'

  return (
    <AuthFrame
      title="auth.signup.title"
      terms="sign-up"
      role={resolved}
      footer={
        <AuthFooter
          leadKey="auth.haveAccount"
          linkKey="auth.signIn"
          href={`/auth/sign-in?role=${resolved}`}
        />
      }
    >
      <SignUpForm role={resolved} />
    </AuthFrame>
  )
}
