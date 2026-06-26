import { useState } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, SubmitHandler } from 'react-hook-form'

export default async function NewTenantPage() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()
  const router = useRouter()

  if (!user) return null

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [properties, setProperties] = useState<any[]>([])

  // Load properties for this user to populate the unit selection
  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name')
        .eq('owner_id', user.id)
        .order('name')

      if (error) throw error
      setProperties(data || [])
    } catch (err) {
      console.error('Error loading properties:', err)
    }
  }

  // Initialize form data
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      unit_id: '',
      full_name: '',
      phone: '',
      email: '',
      lease_start: '',
      lease_end: '',
      deposit_paid: '',
    },
  })

  // Load properties on mount
  // Note: We can't use useEffect directly in server component, so we'll load in client component
  // For now, we'll load it in a useEffect in the client portion

  const onSubmit: SubmitHandler<any> = async (data) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('tenants')
        .insert({
          unit_id: data.unit_id,
          full_name: data.full_name,
          phone: data.phone,
          email: data.email || null,
          lease_start: data.lease_start,
          lease_end: data.lease_end || null,
          deposit_paid: data.deposit_paid ? parseFloat(data.deposit_paid) : null,
        })

      if (error) throw error

      // Reset form
      reset({
        unit_id: '',
        full_name: '',
        phone: '',
        email: '',
        lease_start: '',
        lease_end: '',
        deposit_paid: '',
      })

      // Redirect to tenants list
      router.push('/tenants')
    } catch (err: any) {
      console.error('Error creating tenant:', err)
      setError(err.message || 'Failed to create tenant')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border">
        <h1 className="mb-6 text-2xl font-bold">Add New Tenant</h1>
        <p className="mb-6 text-muted-foreground">
          Add a new tenant to one of your units.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="unit_id" className="font-medium mb-2 block">
              Unit
            </label>
            <select
              id="unit_id"
              {...register('unit_id', {
                required: 'Please select a unit',
              })}
              className={`select w-full ${errors.unit_id ? 'border-red-500' : ''}`}
            >
              <option value="">Select a unit</option>
              {/* This would be populated client-side */}
            </select>
            {errors.unit_id && (
              <p className="mt-1 text-sm text-red-500">{errors.unit_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="full_name" className="font-medium">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                {...register('full_name', {
                  required: 'Full name is required',
                })}
                className={`input-input w-full ${errors.full_name ? 'border-red-500' : ''}`}
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-500">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="font-medium">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                {...register('phone', {
                  required: 'Phone number is required',
                })}
                className={`input-input w-full ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="e.g., 07XX XXX XXX"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="font-medium">
              Email Address (optional)
            </label>
            <input
              type="email"
              id="email"
              {...register('email')}
              className="input-input w-full"
              placeholder="e.g., tenant@example.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="lease_start" className="font-medium">
                Lease Start Date
              </label>
              <input
                type="date"
                id="lease_start"
                {...register('lease_start', {
                  required: 'Lease start date is required',
                })}
                className={`input-input w-full ${errors.lease_start ? 'border-red-500' : ''}`}
              />
              {errors.lease_start && (
                <p className="mt-1 text-sm text-red-500">{errors.lease_start.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="lease_end" className="font-medium">
                Lease End Date (optional)
              </label>
              <input
                type="date"
                id="lease_end"
                {...register('lease_end')}
                className="input-input w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="deposit_paid" className="font-medium">
              Deposit Paid (KES)
            </label>
            <input
              type="number"
              id="deposit_paid"
              {...register('deposit_paid')}
              className="input-input w-full"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className={`btn-primary w-full md:w-auto px-6 py-3 ${(isSubmitting || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting || loading ? 'Creating...' : 'Create Tenant'}
            </button>
            <Link
              href="/tenants"
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