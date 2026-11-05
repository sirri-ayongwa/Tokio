import { redirect } from 'next/navigation'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { getAuth } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const { data: session } = await getAuth().getSession()
  const user = session?.user
  if (!user) redirect('/auth/sign-in')

  return <OnboardingFlow userName={user.name || user.email} />
}
