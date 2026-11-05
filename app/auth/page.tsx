import { redirect } from 'next/navigation'
import { RoleSelect } from '@/components/auth/role-select'
import { auth } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

export default async function AuthLandingPage() {
  const { data: session } = await auth.getSession()
  if (session?.user) redirect('/')

  return <RoleSelect />
}
