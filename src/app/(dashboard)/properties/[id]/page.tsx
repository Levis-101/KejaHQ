import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import UnitForm from '@/components/dashboard/UnitForm' // We'll create this next

export default async function PropertyDetailPage() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const propertyId = params.id

  if (!user) return null
  if (!propertyId) return <div>Property ID missing</div>

  const [property, setProperty] = useState<any>(null)
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPropertyData()
  }, [propertyId])

  const loadPropertyData = async () => {
    setLoading(true)
    try {
      // Fetch property details
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

      // Fetch units for this property
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .eq('property_id', propertyId)
        .order('unit_number')

      if (unitsError) throw unitsError
      setUnits(unitsData || [])
    } catch (err: any) {
      console.error('Error loading property data:', err)
      setError(err.message || 'Failed to load property data')
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
          <h2 className="mb-4 text-xl font-bold">Error Loading Property</h2>
          <p className="text-muted-foreground">{error}</p>
          <Link href="/properties" className="btn-primary mt-4">
            Back to Properties
          </Link>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold">Property Not Found</h2>
          <p className="text-muted-foreground">
            The property you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/properties" className="btn-primary mt-4">
            Back to Properties
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-wrap">
        <h1 className="text-2xl font-bold">{property.name}</h1>
        <div className="space-x-3">
          <Link
            href={`/properties/${property.id}/units/new`}
            className="btn-primary"
          >
            + Add Unit
          </Link>
          <Link
            href="/properties"
            className="btn-secondary"
          >
            Back to Properties
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Property Info</h2>
          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-medium">Address:</span> {property.address}, {property.city}
          </p>
          {property.floors && (
            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-medium">Floors:</span> {property.floors}
            </p>
          )}
          {property.notes && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Notes:</span> {property.notes}
            </p>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Unit Statistics</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Units:</span>
              <span className="font-medium">{units.length}</span>
            </div>
            <div class="flex justify-between">
              <span>Occupied:</span>
              <span className="font-medium text-green-600">
                {units.filter(u => u.status === 'occupied').length}
              </span>
            </div>
            <div class="flex justify-between">
              <span>Vacant:</span>
              <span className="font-medium text-amber-600">
                {units.filter(u => u.status === 'vacant').length}
              </span>
            </div>
            <div class="flex justify-between">
              <span>Maintenance:</span>
              <span className="font-medium text-purple-600">
                {units.filter(u => u.status === 'maintenance').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="font-semibold">Units</h2>

      {units.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No units added yet. Click "Add Unit" above to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {units.map((unit: any) => (
            <div key={unit.id} className="border rounded-lg p-4 flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{unit.unit_number}</h3>
                <p className="text-sm text-muted-foreground">
                  Floor: {unit.floor || 'N/A'} •
                  {unit.bedrooms} BR •
                  {unit.rent_amount} KES/month
                </p>
                {unit.status && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(unit.status)}`}
                    >
                    {getStatusLabel(unit.status)}
                  </span>
                )}
              </div>
              <div className="space-x-2">
                <Link
                  href={`/properties/${property.id}/units/${unit.id}`}
                  className="btn-secondary btn-sm"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case 'occupied': return 'bg-green-50 text-green-600'
    case 'vacant': return 'bg-amber-50 text-amber-600'
    case 'maintenance': return 'bg-purple-50 text-purple-600'
    case 'rented': return 'bg-blue-50 text-blue-600'
    default: return 'bg-gray-50 text-gray-600'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'occupied': return 'Occupied'
    case 'vacant': return 'Vacant'
    case 'maintenance': return 'Under Maintenance'
    case 'rented': return 'Rented'
    default: return status.charAt(0).toUpperCase() + status.slice(1)
  }
}