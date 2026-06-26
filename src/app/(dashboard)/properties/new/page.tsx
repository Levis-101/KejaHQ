import { useState } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default async function NewPropertyPage() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()
  const router = useRouter()

  if (!user) return null

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    floors: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('properties')
        .insert({
          owner_id: user.id,
          name: formData.name,
          address: formData.address,
          city: formData.city,
          floors: formData.floors ? parseInt(formData.floors) : null,
          notes: formData.notes,
        })

      if (error) throw error

      setSuccess(true)
      // Redirect to property list after a short delay
      setTimeout(() => {
        router.push('/properties')
      }, 1500)
    } catch (err: any) {
      console.error('Error creating property:', err)
      setError(err.message || 'Failed to create property')
    } finally {
      setLoading(false)
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
          <h1 className="mb-4 text-xl font-bold">Property Added Successfully!</h1>
          <p className="text-muted-foreground mb-6">
            Your property "{formData.name}" has been created. You can now add units to it.
          </p>
          <Link
            href="/properties"
            className="btn-primary"
          >
            Go to Properties
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border">
        <h1 className="mb-6 text-2xl font-bold">Add New Property</h1>
        <p className="mb-6 text-muted-foreground">
          Add your first property to start managing your rental business.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="font-medium">
              Property Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-input w-full"
              placeholder="e.g., Kamau Court"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="font-medium">
              Street Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="input-input w-full"
              placeholder="e.g., 123 Moi Avenue"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="city" className="font-medium">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="input-input w-full"
              placeholder="e.g., Nairobi"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="floors" className="font-medium">
              Number of Floors
            </label>
            <input
              type="number"
              id="floors"
              name="floors"
              value={formData.floors}
              onChange={handleChange}
              className="input-input w-full"
              min-w-full w-full"
              placeholder="e.g., 3"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="font-medium">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="textarea w-full"
              placeholder="Any additional details about the property..."
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full md:w-auto px-6 py-3 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Creating...' : 'Create Property'}
            </button>
            <Link
              href="/properties"
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