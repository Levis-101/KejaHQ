import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default async function UnitsPage() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()

  if (!user) return null

  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'vacant' | 'occupied' | 'maintenance'>('all')

  useEffect(() => {
    loadUnits()
  }, [filter])

  const loadUnits = async () => {
    setLoading(true)
    try {
      // Build the query based on filter
      let query = supabase
        .from('units')
        .select(`
          *,
          properties (
            id,
            name,
            address
          )
        `)
        .eq('properties.owner_id', user.id)

      // Apply filter if not 'all'
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query.order('unit_number')

      if (error) throw error
      setUnits(data || [])
    } catch (err: any) {
      console.error('Error loading units:', err)
      setError(err.message || 'Failed to load units')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2">Loading units...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold">Error Loading Units</h2>
          <p className="text-muted-foreground">{error}</p>
          <Link href="/dashboard" className="btn-primary mt-4">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-wrap">
        <h1 className="text-2xl font-bold">All Units</h1>
        <div className="space-x-3">
          <Link
            href="/properties/new"
            className="btn-outline"
          >
            + Add Property
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Showing {units.length} units
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${filter === 'all' ? 'bg-teal-500 text-white' : 'bg-white/5 border border-transparent hover:border-teal-300'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('vacant')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${filter === 'vacant' ? 'bg-amber-500 text-white' : 'bg-white/5 border border-transparent hover:border-amber-300'}`}
            >
              Vacant
            </button>
            <button
              onClick={() => setFilter('occupied')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${filter === 'occupied' ? 'bg-green-500 text-white' : 'bg-white/5 border border-transparent hover:border-green-300'}`}
            >
              Occupied
            </button>
            <button
              onClick={() => setFilter('maintenance')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${filter === 'maintenance' ? 'bg-purple-500 text-white' : 'bg-white/5 border border-transparent:hover:border-purple-300'}`}
            >
              Maintenance
            </button>
          </div>
        </div>
      </div>

      {units.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            No units found. Add a property and units to get started.
          </p>
          <div className="flex justify-center space-x-3 mt-6">
            <Link
              href="/properties/new"
              className="btn-primary"
            >
              Add Property
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {units.map((unit: any) => (
            <div key={unit.id} className="border rounded-lg p-4 flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{unit.unit_number}</h3>
                <p className="text-sm text-muted-foreground">
                  {unit.properties?.name} • {unit.properties?.address.split(',')[0]}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {unit.bedrooms} BR • {unit.rent_amount} KES/month
                </p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(unit.status)}`}
                  >
                  {getStatusLabel(unit.status)}
                </span>
              </div>
              <div className="space-x-2">
                <Link
                  href={`/properties/${unit.properties?.id}/units/${unit.id}`}
                  className="btn-secondary btn-sm"
                >
                  View
                </Link>
                <Link
                  href={`/properties/${unit.properties?.id}/units/${unit.id}/edit`}
                  className="btn-outline btn-sm"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
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