import { useState } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, SubmitHandler } from 'react-hook-form'

export default async function NewMaintenanceRequestPage() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()
  const router = useRouter()

  if (!user) return null

  const [properties, setProperties] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadProperties()
  }, [])

  const loadProperties = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, address')
        .eq('owner_id', user.id)
        .order('name')

      if (error) throw error
      setProperties(data || [])
    } catch (err: any) {
      console.error('Error loading properties:', err)
      setError(err.message || 'Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  const [formData, setFormData] = useState({
    property_id: '',
    unit_id: '',
    title: '',
    description: '',
    priority: 'medium' as const,
  })

  const handlePropertyChange = (value: string) => {
    setFormData(prev => ({ ...prev, property_id: value }))
    loadUnitsForProperty(value)
  }

  const loadUnitsForProperty = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('id, unit_number')
        .eq('property_id', propertyId)
        .order('unit_number')

      if (error) throw error
      setUnits(data || [])
      // Reset unit selection when property changes
      setFormData(prev => ({ ...prev, unit_id: '' }))
    } catch (err: any) {
      console.error('Error loading units:', err)
      setUnits([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    try {
      if (!formData.property_id) {
        throw new Error('Please select a property')
      }
      if (!formData.unit_id) {
        throw new Error('Please select a unit')
      }
      if (!formData.title.trim()) {
        throw new Error('Please enter a title for the request')
      }

      const { error } = await supabase
        .from('maintenance_requests')
        .insert({
          unit_id: formData.unit_id,
          reported_by: user.id, // Assuming the reporter is the landlord/property owner
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          priority: formData.priority,
          status: 'open',
        })

      if (error) throw error

      setSuccess(true)
      // Reset form
      setFormData({
        property_id: '',
        unit_id: '',
        title: '',
        description: '',
        priority: 'medium',
      })
      setUnits([])

      // Redirect to maintenance list after a brief delay
      setTimeout(() => {
        router.push('/maintenance')
      }, 1500)
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit request')
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="mb-6">
            <svg className="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mb-4 text-xl font-bold">Request Submitted Successfully!</h1>
          <p className="text-muted-foreground mb-6">
            Your maintenance request has been submitted and is now open for resolution.
          </p>
          <Link
            href="/maintenance"
            className="btn-primary"
          >
            View All Requests
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border">
        <h1 className="mb-6 text-2xl font-bold">Report Maintenance Issue</h1>
        <p className="mb-6 text-muted-foreground">
          Report a maintenance issue for one of your properties. Please provide as much detail as possible.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-500">
            {error}
          </div>
        )}

        {formError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-500">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="property" className="font-medium">
              Property
            </label>
            <select
              id="property"
              onChange={(e) => handlePropertyChange(e.target.value)}
              value={formData.property_id}
              className="select w-full"
            >
              <option value="">Select a property...</option>
              {properties.map((prop: any) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name} - {prop.address}
                }
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="unit" className="font-medium">
              Unit
            </label>
            <select
              id="unit"
              value={formData.unit_id}
              onChange={(e) => setFormData(prev => ({ ...prev, unit_id: e.target.value }))}
              className="select w-full"
              disabled={!formData.property_id}
            >
              <option value="">Select a unit...</option>
              {units.map((unit: any) => (
                <option key={unit.id} value={unit.id}>
                  {unit.unit_number}
                }
              ))}
            </select>
            {(!formData.property_id || units.length === 0) && formData.property_id && (
              <p className="mt-1 text-sm text-muted-foreground">
                No units found for this property. Add units first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="font-medium">
              Issue Title
            </label>
            <input
              type="text"
              id="title"
              defaultValue={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="input-input w-full"
              placeholder="e.g., Leaking kitchen faucet"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="font-medium">
              Description (optional)
            </label>
            <textarea
              id="description"
              defaultValue={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="textarea w-full"
              placeholder="Describe the issue in detail..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="priority" className="font-medium">
              Priority Level
            </label>
            <select
              id="priority"
              defaultValue={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' }))}
              className="select w-full"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full md:w-auto px-6 py-3 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
            <Link
              href="/maintenance"
              className="btn-secondary"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}