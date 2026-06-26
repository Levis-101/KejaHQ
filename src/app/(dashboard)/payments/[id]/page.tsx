import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default async function PaymentDetailsPage() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const paymentId = params.id

  if (!user) return null
  if (!paymentId) return <div>Payment ID missing</div>

  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPayment()
  }, [paymentId])

  const loadPayment = async () => {
    setLoading(true)
    try {
      // Fetch payment with related tenant, unit, and property data
      const { data: paymentData, error } = await supabase
        .from('payments')
        .select(`
          *,
          tenants (
            full_name,
            phone,
            email,
            units (
              unit_number,
              properties (
                name,
                address
              )
            )
          )
        `)
        .eq('id', paymentId)
        .single()

      if (error) throw error
      if (!paymentData) {
        router.push('/payments')
        return
      }

      // Verify that the user has access to this payment (through property ownership)
      const hasAccess = paymentData.tenants?.units?.properties?.owner_id === user.id
      if (!hasAccess) {
        router.push('/payments')
        return
      }

      setPayment(paymentData)
    } catch (err: any) {
      console.error('Error loading payment:', err)
      setError(err.message || 'Failed to load payment')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2">Loading payment details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold">Error Loading Payment</h2>
          <p className="text-muted-foreground">{error}</p>
          <Link href="/payments" className="btn-primary mt-4">
            Back to Payments
          </Link>
        </div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold">Payment Not Found</h2>
          <p className="text-muted-foreground">
            The payment you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/payments" className="btn-primary mt-4">
            Back to Payments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-wrap">
        <h1 className="text-2xl font-bold">Payment Details</h1>
        <div className="space-x-3">
          <Link
            href="/payments"
            className="btn-outline"
          >
            Back to Payments
          </Link>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Payment Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment ID:</span>
            <span className="font-mono">#{payment.id.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tenant:</span>
            <span>{payment.tenants?.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Unit:</span>
            <span>{payment.tenants?.units?.unit_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Property:</span>
            <span>{payment.tenants?.units?.properties?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-mono">{payment.amount} KES</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Date:</span>
            <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Period:</span>
            <span>{new Date(payment.payment_period).toLocaleDateString('default', { month: 'long', year: 'numeric' })}</span>
          </div>
          {payment.payment_method && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentMethodClass(payment.payment_method)}`}
                >
                {getPaymentMethodLabel(payment.payment_method)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusClass(payment.status)}`}
              >
              {getPaymentStatusLabel(payment.status)}
            </span>
          </div>
          {payment.transaction_id && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID:</span>
              <span>{payment.transaction_id}</span>
            </div>
          )}
          {payment.created_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recorded On:</span>
              <span>{new Date(payment.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {payment.notes && (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Notes</h2>
          <p className="text-muted-foreground">{payment.notes}</p>
        </div>
      )}
    </div>
  )
}

function getPaymentMethodClass(method: string | null) {
  switch (method) {
    case 'cash': return 'bg-green-50 text-green-600'
    case 'bank_transfer': return 'bg-blue-50 text-blue-600'
    case 'mobile_money': return 'bg-purple-50 text-purple-600'
    case 'credit_card': return 'bg-indigo-50 text-indigo-600'
    case 'other': return 'bg-gray-50 text-gray-600'
    default: return 'bg-gray-50 text-gray-600'
  }
}

function getPaymentMethodLabel(method: string | null) {
  switch (method) {
    case 'cash': return 'Cash'
    case 'bank_transfer': return 'Bank Transfer'
    case 'mobile_money': return 'Mobile Money'
    case 'credit_card': return 'Credit Card'
    case 'other': return 'Other'
    default: return 'Not specified'
  }
}

function getPaymentStatusClass(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-50 text-green-600'
    case 'pending': return 'bg-yellow-50 text-yellow-600'
    case 'failed': return 'bg-red-50 text-red-600'
    case 'refunded': return 'bg-blue-50 text-blue-600'
    default: return 'bg-gray-50 text-gray-600'
  }
}

function getPaymentStatusLabel(status: string) {
  switch (status) {
    case 'completed': return 'Completed'
    case 'pending': return 'Pending'
    case 'failed': return 'Failed'
    case 'refunded': return 'Refunded'
    default: return status.charAt(0).toUpperCase() + status.slice(1)
  }
}