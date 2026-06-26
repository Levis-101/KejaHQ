import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import UnitForm from '@/components/dashboard/UnitForm'

export default async function UnitDetailPage() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()
  const router = useRouter()
  const params = useParams<{ id: string; unitId: string }>()
  const propertyId = params.id
  const unitId = params.unitId

  if (!user) return null
  if (!propertyId || !unitId) return <div>Missing IDs</div>

  const [unit, setUnit] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUnitData()
  }, [propertyId, unitId])

  const loadUnitData = async () => {
    setLoading(true)
    try {
      // First verify the property belongs to the user
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .eq('owner_id', user.id)
        .single()

      if (propertyError) throw propertyError
      if (!propertyData) {
        router.push('/properties')
        return
      }

      setProperty(propertyData)

      // Fetch the unit details
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select('*')
        .eq('id', unitId)
        .eq('property_id', propertyId)
        .single()

      if (unitError) throw unitError
      if (!unitData) {
        router.push(`/properties/${propertyId}`)
        return
      }

      setUnit(unitData)
    } catch (err: any) {
      console.error('Error loading unit data:', err)
      setError(err.message || 'Failed to load unit data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold">Error Loading Unit</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="mt-4">
            <Link href={`/properties/${propertyId}`} className="btn-secondary">
              Back to Property
            </Link>
            <Link href="/properties" className="btn-outline ml-2">
              All Properties
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!unit || !property) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold">Unit Not Found</h2>
          <p className="text-muted-foreground">
            The unit you're looking for doesn't exist or you don't have access to it.
          </p>
          <div className="mt-4">
            <Link href={`/properties/${propertyId}`} className="btn-secondary">
              Back to Property
            </Link>
            <Link href="/properties" className="btn-outline ml-2">
              All Properties
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-wrap">
        <h1 className="text-2xl font-bold">
          Unit {unit.unit_number}
        </h1>
        <div className="space-x-3">
          <Link
            href={`/properties/${propertyId}/units/${unitId}/edit`}
            className="btn-secondary"
          >
            Edit Unit
          </Link>
          <Link
            href={`/properties/${propertyId}`}
            className="btn-outline"
          >
            Back to Property
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Unit Details</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit Number:</span>
                <span className="font-mono">{unit.unit_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Floor:</span>
                <span>{unit.floor || 'Ground'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bedrooms:</span>
                <span>{unit.bedrooms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Rent:</span>
                <span className="font-medium">{unit.rent_amount} KES</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(unit.status)}`}
                  >
                  {getStatusLabel(unit.status)}
                </span>
              </div>
              {unit.notes && (
                <div className="mt-3">
                  <span className="text-muted-foreground">Notes:</span>
                  <p className="mt-1 line-clamp-3">{unit.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Tenants</h2>
            {/* This would show tenants for this unit - to be implemented in Phase 2 */}
            <p className="text-muted-foreground text-center py-8">
              Tenant management will be available in the next update.
              <br className="hidden sm:inline" />
              For now, you can add tenants through the units section.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="border-t pt-4">
          <div className="flex justify-between items-wrap">
            <span className="text-sm text-muted-foreground">
              Unit ID: {unit.id}
            </span>
            <div className="space-x-2">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
                    deleteUnit()
                  }
                }}
                className="btn-outline btn-sm text-red-500 hover:bg-red-50"
              >
                Delete Unit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

async function deleteUnit() {
  // This would be implemented with a proper delete function
  // For now, just show an alert
  alert('Delete functionality coming soon!')
}

function getStatusClass(status: string) {
  switch (status) {
    case 'occupied': return 'bg-green-50 text-green-600'
    case 'vacant': return 'bg-amber-50 text-amber-600'
    case 'maintenance': return 'bg-purple-50 text-purple-600'
    default: return 'bg-gray-50 text-gray-600'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'occupied': return 'Occupied'
    case 'vacant': return 'Vacant'
    case 'maintenance': return 'Under Maintenance'
    default: return status.charAt(0).toUpperCase() + status.slice(1)
  }
}