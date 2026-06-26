import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default async function TenantsPage() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()

  if (!user) return null

  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    setLoading(true)
    try {
      // Fetch tenants for properties owned by the user
      const { data: tenantsData, error } = await supabase
        .from('tenants')
        .select(`
          *,
          units!inner (
            unit_number,
            properties!inner (
              name
            )
          )
        `)
        .eq('units.properties.owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTenants(tenantsData || [])
    } catch (err: any) {
      console.error('Error loading tenants:', err)
      setError(err.message || 'Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2">Loading tenants...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold">Error Loading Tenants</h2>
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
        <h1 className="text-2xl font-bold">Tenants</h1>
        <Link
          href="/tenants/new"
          className="btn-primary"
        >
          + Add Tenant
        </Link>
      </div>

      {tenants.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            No tenants yet. Add your first tenant to get started.
          </p>
          <Link
            href="/tenants/new"
            className="mt-4 inline-block btn-primary"
          >
            Add Tenant
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tenants.map((tenant: any) => (
            <div key={tenant.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold">{tenant.full_name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {tenant.units?.unit_number} • {tenant.units?.properties?.name}
                  </p>
                  {tenant.phone && (
                    <p className="text-xs text-muted-foreground mt-1">
                      📞 {tenant.phone}
                    </p>
                  )}
                  {tenant.email && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ✉️ {tenant.email}
                    </p>
                  )}
                </div>
                <div className="space-x-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600`}
                    >
                    Active Tenant
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Lease: {new Date(tenant.lease_start).toLocaleDateString()} to {
                    tenant.lease_end
                      ? new Date(tenant.lease_end).toLocaleDateString()
                      : 'Month-to-month'
                  }
                </p>
                {tenant.deposit_paid && (
                  <p className="text-sm text-muted-foreground">
                    Deposit: {tenant.deposit_paid} KES
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}