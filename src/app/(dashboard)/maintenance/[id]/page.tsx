import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default async function MaintenanceRequestDetail() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const requestId = params.id

  if (!user) return null
  if (!requestId) return <div>Request ID missing</div>

  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRequest()
  }, [requestId])

  const loadRequest = async () => {
    setLoading(true)
    try {
      // Fetch maintenance request with related unit and property data
      const { data: requestData, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          units (
            unit_number,
            properties (
              name,
              address
            )
          ),
          profiles!reported_by (
            full_name
          )
        `)
        .eq('id', requestId)
        .single()

      if (error) throw error
      if (!requestData) {
        router.push('/maintenance')
        return
      }

      // Verify that the user has access to this request (through property ownership)
      const hasAccess = requestData.units?.properties?.owner_id === user.id
      if (!hasAccess) {
        router.push('/maintenance')
        return
      }

      setRequest(requestData)
    } catch (err: any) {
      console.error('Error loading maintenance request:', err)
      setError(err.message || 'Failed to load request')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2">Loading request details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold">Error Loading Request</h2>
          <p className="text-muted-foreground">{error}</p>
          <Link href="/maintenance" className="btn-primary mt-4">
            Back to Requests
          </Link>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold">Request Not Found</h2>
          <p className="text-muted-foreground">
            The maintenance request you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/maintenance" className="btn-primary mt-4">
            Back to Requests
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-wrap">
        <h1 className="text-2xl font-bold">Maintenance Request</h1>
        <div className="space-x-3">
          <Link
            href="/maintenance"
            className="btn-outline"
          >
            Back to Requests
          </Link>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Request Details</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Request ID:</span>
            <span className="font-mono">#{request.id.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Property:</span>
            <span>{request.units?.properties?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Unit:</span>
            <span>{request.units?.unit_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reported By:</span>
            <span>{request.profiles?.full_name || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date Reported:</span>
            <span>{new Date(request.created_at).toLocaleDateString()}</span>
          </div>
          {request.resolved_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resolved On:</span>
              <span className="text-green-600">{new Date(request.resolved_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Issue Description</h2>
        <div className="space-y-2">
          <h3 className="font-medium">{request.title}</h3>
          <p className="text-muted-foreground">{request.description || 'No description provided.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Priority & Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(request.priority)}`}
                >
                {getPriorityLabel(request.priority)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(request.status)}`}
                >
                {getStatusLabel(request.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Actions</h2>
          {request.status !== 'resolved' ? (
            <div className="space-y-3">
              <button
                onClick={() => updateStatus('in_progress')}
                className="btn-warning w-full"
              >
                Mark as In Progress
              </button>
              <button
                onClick={() => updateStatus('resolved')}
                className="btn-success w-full"
              >
                Mark as Resolved
              </button>
            </div>
          ) : (
            <p className="text-center text-green-600">
              This request has been resolved and is closed.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

async function updateStatus(status: 'in_progress' | 'resolved') {
  // This would be implemented with a proper update function
  // For now, just show an alert
  alert(`Status update to ${status} coming soon!`)
}

function getPriorityClass(priority: string) {
  switch (priority) {
    case 'low': return 'bg-blue-50 text-blue-600'
    case 'medium': return 'bg-yellow-50 text-yellow-600'
    case 'high': return 'bg-orange-50 text-orange-600'
    case 'urgent': return 'bg-red-50 text-red-600'
    default: return 'bg-gray-50 text-gray-600'
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case 'open': return 'bg-blue-50 text-blue-600'
    case 'in_progress': return 'bg-yellow-50 text-yellow-600'
    case 'resolved': return 'bg-green-50 text-green-600'
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

function getStatusLabel(status: string) {
  switch (status) {
    case 'open': return 'Open'
    case 'in_progress': return 'In Progress'
    case 'resolved': return 'Resolved'
    default: return status.charAt(0).toUpperCase() + status.slice(1)
  }
}