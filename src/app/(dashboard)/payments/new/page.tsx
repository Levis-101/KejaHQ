import { useState } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default async function NewPaymentPage() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()
  const router = useRouter()

  if (!user) return null

  const [tenants, setTenants] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError: Dispatch<SetStateAction<string | null>> = useState(null)

  // Load tenants for this user's properties
  const loadTenants = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          units (
            unit_number,
            properties (
              name,
              address
            )
          )
        `)
        .eq('units.properties.owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTenants(data || [])
    } catch (err: any) {
      console.error('Error loading tenants:', err)
      setError(err.message || 'Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }

  // Load units for a specific tenant
  const loadUnitsForTenant = async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select(`
          *,
          properties (
            name
          )
        `)
        .eq('id', (await supabase.from('tenants').select('unit_id').eq('id', tenantId).single()).data?.unit_id)
        .order('unit_number')

      if (error) throw error
      setUnits(data || [])
    } catch (err: any) {
      console.error('Error loading units:', err)
      setUnits([])
    }
  }

  const handleTenantChange = async (tenantId: string) => {
    await loadUnitsForTenant(tenantId)
  }

  const [formData, setFormData] = useState({
    tenant_id: '',
    unit_id: '',
    amount: '',
    payment_date: '',
    payment_period: '',
    payment_method: '',
    status: 'pending' as const,
    transaction_id: '',
    notes: '',
  })

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      // Validate required fields
      if (!formData.tenant_id) {
        throw new Error('Please select a tenant')
      }
      if (!formData.unit_id) {
        throw new Error('Please select a unit')
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Please enter a valid amount')
      }
      if (!formData.payment_date) {
        throw new Error('Please select a payment date')
      }
      if (!formData.payment_period) {
        throw new Error('Please select a payment period')
      }

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          tenant_id: formData.tenant_id,
          unit_id: formData.unit_id,
          amount: parseFloat(formData.amount),
          payment_date: formData.payment_date,
          payment_period: formData.payment_period,
          payment_method: formData.payment_method || null,
          status: formData.status,
          transaction_id: formData.transaction_id || null,
          notes: formData.notes || null,
        })

      if (paymentError) throw paymentError

      // Reset form
      setFormData({
        tenant_id: '',
        unit_id: '',
        amount: '',
        payment_date: '',
        payment_period: '',
        payment_method: '',
        status: 'pending',
        transaction_id: '',
        notes: '',
      })
      setUnits([])

      // Show success message and redirect
      alert('Payment recorded successfully!')
      router.push('/payments')
    } catch (err: any) {
      setError(err.message || 'Failed to record payment')
    }
  }

  // Initial load
  // Note: We can't use useEffect directly in server components, so we'll load data in a useEffect in the client component
  // For now, we'll load it when the component mounts by calling the function directly
  // In a real app, we might want to use suspense or a different approach
  // But for simplicity, we'll load it in a useEffect in the client portion

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
          <Link href="/payments" className="btn-primary mt-4">
            Back to Payments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border">
        <h1 className="mb-6 text-2xl font-bold">Record Payment</h1>
        <p className="mb-6 text-muted-foreground">
          Record a rent payment made by a tenant.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="tenant" className="font-medium">
              Tenant
            </label>
            <select
              id="tenant"
              onChange={(e) => handleTenantChange(e.target.value)}
              value={formData.tenant_id}
              className="select w-full"
              required
            >
              <option value="">Select a tenant...</option>
              {tenants.map((tenant: any) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.full_name} ({tenant.units?.unit_number} - {tenant.units?.properties?.name})
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
              required
              disabled={!formData.tenant_id}
            >
              <option value="">Select a unit...</option>
              {units.map((unit: any) => (
                <option key={unit.id} value={unit.id}>
                  {unit.unit_number} ({unit.properties?.name})
                }
              ))}
            </select>
            {(!formData.tenant_id || units.length === 0) && formData.tenant_id && (
              <p className="mt-1 text-sm text-muted-foreground">
                No units found for this tenant. Please assign the tenant to a unit first.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="font-medium">
                Amount (KES)
              </label>
              <input
                type="number"
                id="amount"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="input-input w-full"
                required
                min="0.01"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="payment_date" className="font-medium">
                Payment Date
              </label>
              <input
                type="date"
                id="payment_date"
                value={formData.payment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                className="input-input w-full"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="payment_period" className="font-medium">
                Payment Period (Month)
              </label>
              <input
                type="month"
                id="payment_period"
                value={formData.payment_period}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_period: e.target.value }))}
                className="input-input w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="payment_method" className="font-medium">
                Payment Method
              </label>
              <select
                id="payment_method"
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as any }))}
                className="select w-full"
              >
                <option value="">Select payment method...</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="credit_card">Credit Card</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="font-medium">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'pending' | 'completed' | 'failed' | 'refunded' }))}
              className="select w-full"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="transaction_id" className="font-medium">
              Transaction ID (optional)
            </label>
            <input
              type="text"
              id="transaction_id"
              value={formData.transaction_id}
              onChange={(e) => setFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
              className="input-input w-full"
              placeholder="e.g., MPESA reference, bank transaction ID..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="font-medium">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="textarea w-full"
              placeholder="Any additional details about the payment..."
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full md:w-auto px-6 py-3 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
            <Link
              href="/payments"
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