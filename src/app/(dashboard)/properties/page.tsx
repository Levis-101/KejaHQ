import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function PropertiesPage() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()

  if (!user) return null

  // Fetch properties for the current user
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*, units(count)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching properties:', error)
    return <div className="p-6 text-red-500">Error loading properties</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-wrap">
        <h1 className="text-2xl font-bold">Properties</h1>
        <Link
          href="/properties/new"
          className="btn-primary"
        >
          Add Property
        </Link>
      </div>

      {!properties || properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            No properties yet. Add your first property to get started.
          </p>
          <Link
            href="/properties/new"
            className="mt-4 inline-block btn-primary"
          >
            Add Property
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((property: any) => (
            <div key={property.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold">{property.name}</h2>
                  <p className="text-sm text-muted-foreground">{property.address}, {property.city}</p>
                  {property.floors && (
                    <p className="text-xs text-muted-foreground">{property.floors} floors</p>
                  )}
                </div>
                <div className="space-x-3">
                  <Link
                    href={`/properties/${property.id}`}
                    className="btn-secondary btn-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center space-x-4 text-sm">
                  <div>
                    <div className="font-medium">{property.units?.count || 0}</div>
                    <div className="text-xs text-muted-foreground">Units</div>
                  </div>
                  <div>
                    <div className="font-medium">0</div>
                    <div className="text-xs text-muted-foreground">Occupied</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}