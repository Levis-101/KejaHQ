import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default async function MaintenancePage() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()

  if (!user) return null

  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      // Fetch maintenance requests for properties owned by the user
      const { data: requestsData, error } = await supabase
        .from('maintenance_requests')
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
      setRequests(requestsData || [])
    } catch (err: any) {
      console.error('Error loading maintenance requests:', err)
      setError(err.message || 'Failed to load maintenance requests')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2">Loading maintenance requests...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold">Error Loading Requests</h2>
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
        <h1 className="text-2xl font-bold">Maintenance Requests</h1>
        <Link
          href="/maintenance/new"
          className="btn-primary"
        >
          + New Request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            No maintenance requests yet. Report an issue to get started.
          </p>
          <Link
            href="/maintenance/new"
            className="mt-4 inline-block btn-primary"
          >
            Report Issue
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request: any) => (
            <div key={request.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold">{request.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {request.units?.unit_number} • {request.units?.properties?.name}
                  </p>
                  {request.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {request.description}
                    </p>
                  )}
                </div>
                <div className="space-x-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(request.status)}`}
                    >
                    {getStatusLabel(request.status)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(request.priority)}`}
                    >
                    {getPriorityLabel(request.priority)}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Reported: {new Date(request.created_at).toLocaleDateString()}
                </p>
                {request.updated_at && (
                  <p className="text-sm text-muted-foreground">
                    Updated: {new Date(request.updated_at).toLocaleDateString()}
                  </p>
                )}
                {request.resolved_at && (
                  <p className="text-sm text-muted-foreground">
                    Resolved: {new Date(request.resolved_at).toLocaleDateString()}
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

function getStatusClass(status: string) {
  switch (status) {
    case 'open': return 'bg-amber-50 text-amber-600'
    case 'in_progress': return 'bg-blue-50 text-blue-600'
    case 'resolved': return 'bg-green-50 text-green-600'
    default: return 'bg-gray-50 text-gray-600'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'open': return 'Open'
    case 'in_progress': return 'In Progress'
    case 'resolved': return 'Resolved'
    default: return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

function getPriorityClass(priority: string) {
  switch (priority) {
    case 'low': return 'bg-green-50 text-green-600'
    case 'medium': return 'bg-yellow-50 text-yellow-600'
    case 'high': return 'bg-orange-50 text-orange-600'
    case 'urgent': return 'bg-red-50 text-red-600'
    default: return 'bg-gray-50 text-gray-600'
  }
}

function getPriorityLabel(priority: string) {
  switch (priority) {
    case 'low': return 'Low'
    case 'medium': return 'Medium'
    case 'high': return 'High'
    case 'urgent': return 'Urgent'
    default: return priority.charAt(0).toUpperCase() + priority.slice(1)
  }
}