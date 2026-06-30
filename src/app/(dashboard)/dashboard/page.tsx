import { getUser, createServerSupabaseClient } from '@/lib/supabase-server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const user = await getUser()
  const supabase = await createServerSupabaseClient()

  // Fetch real properties and units (will be empty for new accounts)
  const { data: properties } = await supabase
    .from('properties')
    .select('*, units(*)')
    .eq('owner_id', user!.id)
    .limit(5)

  const allUnits = properties?.flatMap((p: any) => p.units ?? []) ?? []
  const totalUnits     = allUnits.length
  const occupiedUnits  = allUnits.filter((u: any) => u.status === 'occupied').length
  const vacantUnits    = allUnits.filter((u: any) => u.status === 'vacant').length

  // Fetch payment count for the dashboard stat
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('id')
    .eq('tenants.units.properties.owner_id', user!.id)

  const totalPayments = payments?.length ?? 0

  const isNewUser = (properties?.length ?? 0) === 0

  return (
    <DashboardClient
      user={user}
      properties={properties}
      totalUnits={totalUnits}
      occupiedUnits={occupiedUnits}
      vacantUnits={vacantUnits}
      totalPayments={totalPayments}
      isNewUser={isNewUser}
    />
  )
}