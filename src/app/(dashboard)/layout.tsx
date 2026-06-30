import { redirect } from 'next/navigation'
import { getUser, createServerSupabaseClient } from '@/lib/supabase-server'
import type { Database } from '@/lib/supabase'
import DashboardLayoutClient from './DashboardLayoutClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  // Auth guard — kick unauthenticated users to login
  if (!user) {
    redirect('/login')
  }

  // Fetch landlord profile
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Assert the expected type so TypeScript knows `full_name` exists
  const profile = data as { full_name: string | null } | null

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Landlord'

  return <DashboardLayoutClient displayName={displayName} children={children} />
}