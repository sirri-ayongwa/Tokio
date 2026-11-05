import { redirect } from 'next/navigation'
import { RoleSelect } from '@/components/auth/role-select'
import { getAuth } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

export default async function AuthLandingPage() {
  const { data: session } = await getAuth().getSession()
  if (session?.user) redirect('/')

  return <RoleSelect />
}
