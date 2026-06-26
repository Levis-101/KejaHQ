import { useState } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import UnitForm from '@/components/dashboard/UnitForm'

export default async function NewUnitPage() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const propertyId = params.id

  if (!user) return null
  if (!propertyId) return <div>Property ID missing</div>

  // Pass the propertyId to the UnitForm component
  return (
    <UnitForm
      propertyId={propertyId}
      onSuccess={() => {
        router.push(`/properties/${propertyId}`)
      }}
    />
  )
}