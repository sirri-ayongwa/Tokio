import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { getAuth } from '@/lib/auth-server'
import { ensureSchema, sqlDirect } from '@/lib/db'
import { StoreProvider } from '@/lib/store'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const { data: session } = await getAuth().getSession()
  const user = session?.user

  if (!user) redirect('/auth')

  await ensureSchema()
  const [profile] = await sqlDirect`
    SELECT role FROM profiles WHERE user_id = ${user.id}`.catch(() => [])
  const initialRole = profile?.role === 'merchant' ? 'seller' : 'buyer'
  const realtimeUrl = process.env.NEON_REALTIME_URL || process.env.NEXT_PUBLIC_NEON_REALTIME_URL

  if (!realtimeUrl) {
    throw new Error('Missing NEON_REALTIME_URL')
  }

  return (
    <StoreProvider
      user={{ id: user.id, name: user.name || user.email, email: user.email }}
      initialRole={initialRole}
      realtimeUrl={realtimeUrl}
    >
      <AppShell />
    </StoreProvider>
  )
}
