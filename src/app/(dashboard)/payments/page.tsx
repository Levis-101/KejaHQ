import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default async function PaymentsPage() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()

  if (!user) return null

  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    setLoading(true)
    try {
      // Fetch payments for properties owned by the user
      const { data: paymentsData, error } = await supabase
        .from('payments'
        .select(`
          *,
          tenants!inner (
            full_name,
            units!inner (
              unit_number,
              properties!inner (
                name
              )
            )
          )
        `)
        .eq('tenants.units.properties.owner_id', user.id)
        .order('payment_date', { ascending: false })

      if (error) throw error
      setPayments(paymentsData || [])
    } catch (err: any) {
      console.error('Error loading payments:', err)
      setError(err.message || 'Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2">Loading payments...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold">Error Loading Payments</h2>
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
        <h1 className="text-2xl font-bold">Payments</h1>
        <Link
          href="/payments/new"
          className="btn-primary"
        >
          + Record Payment
        </Link>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            No payments recorded yet. Record your first payment to get started.
          </p>
          <Link
            href="/payments/new"
            className="mt-4 inline-block btn-primary"
          >
            Record Payment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">Tenant</th>
                  <th className="text-left">Unit</th>
                  <th className="text-left">Amount (KES)</th>
                  <th className="text-left">Method</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-muted">
                    <td className="px-4 py-3">{new Date(payment.payment_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{payment.tenants?.full_name}</td>
                    <td className="px-4 py-3">
                      {payment.tenants?.units?.unit_number} - {payment.tenants?.units?.properties?.name}
                    </td>
                    <td className="px-4 py-3 font-mono">{payment.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentMethodClass(
                        payment.payment_method
                      )}`}>
                        {getPaymentMethodLabel(payment.payment_method)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusClass(
                        payment.status
                      )}`}>
                        {getPaymentStatusLabel(payment.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <Link
                        href={`/payments/${payment.id}`}
                        className="btn-sm btn-outline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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