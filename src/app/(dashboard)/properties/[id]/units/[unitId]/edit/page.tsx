import { useState } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import UnitForm from '@/components/dashboard/UnitForm'

export default async function UnitEditPage() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()
  const router = useRouter()
  const params = useParams<{ id: string; unitId: string }>()
  const propertyId = params.id
  const unitId = params.unitId

  if (!user) return null
  if (!propertyId || !unitId) return <div>Missing IDs</div>

  // Pass the unitId to the UnitForm component so it knows to load existing data
  return (
    <UnitForm
      propertyId={propertyId}
      unitId={unitId}
      onSuccess={() => {
        router.push(`/properties/${propertyId}/units/${unitId}`)
      }}
    />
  )
}