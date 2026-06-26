'use client'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import FinancialMetricCard from '@/components/dashboard/FinancialMetricCard'
import FinancialChart from '@/components/dashboard/FinancialChart'

export default async function FinancePage() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()

  if (!user) return null

  // State for financial data
  const [financialData, setFinancialData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch financial data
  useEffect(() => {
    loadFinancialData()
  }, [])

  const loadFinancialData = async () => {
    setLoading(true)
    try {
      // Fetch payments summary
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          amount,
          payment_date,
          payment_method,
          status,
          tenants (
            full_name,
            units (
              unit_number,
              properties (
                name
              )
            )
          )
        `)
        .eq('tenants.units.properties.owner_id', user.id)
        .order('payment_date', { ascending: false })

      if (paymentsError) throw paymentsError

      // Calculate monthly income for the last 6 months
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const recentPayments = paymentsData?.filter(p =>
        new Date(p.payment_date) >= sixMonthsAgo
      ) || []

      // Group by month
      const monthlyIncome: { month: string; amount: number }[] = []
      recentPayments.forEach(payment => {
        const date = new Date(payment.payment_date)
        const monthKey = date.toISOString().slice(0, 7) // YYYY-MM

        const existing = monthlyIncome.find(m => m.month === monthKey)
        if (existing) {
          existing.amount += payment.amount
        } else {
          monthlyIncome.push({ month: monthKey, amount: payment.amount })
        }
      })

      // Sort by month
      monthlyIncome.sort((a, b) => a.month.localeCompare(b.month))

      // Calculate totals
      const totalIncome = paymentsData?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
      const pendingPayments = paymentsData?.filter((p: any) => p.status === 'pending').length || 0
      const overduePayments = paymentsData?.filter((p: any) => p.status === 'failed').length || 0

      // Format monthly data for chart
      const chartData = monthlyIncome.map(item => ({
        month: new Date(`${item.month}-01`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: item.amount
      }))

      setFinancialData({
        totalIncome,
        pendingPayments,
        overduePayments,
        monthlyIncome,
        chartData,
        recentPayments: recentPayments.slice(0, 5) // Latest 5 payments
      })
    } catch (err: any) {
      console.error('Error loading financial data:', err)
      setError(err.message || 'Failed to load financial data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2">Loading financial data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold">Error Loading Financial Data</h2>
          <p className="text-muted-foreground">{error}</p>
          <Link href="/dashboard" className="btn-primary mt-4">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!financialData) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold">No Financial Data</h2>
          <p className="text-muted-foreground">
            No payment data available yet. Record some payments to see financial reports.
          </p>
          <Link href="/payments/new" className="btn-primary mt-4">
            Record First Payment
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-wrap">
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <Link href="/payments/new" className="btn-outline">
          + Record Payment
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FinancialMetricCard
          title="Total Income"
          value={`${financialData.totalIncome.toLocaleString()} KES`}
          subtitle="All time"
          href="/payments"
          icon="💰"
        />
        <FinancialMetricCard
          title="Pending Payments"
          value={financialData.pendingPayments}
          subtitle="Requires attention"
          trend={financialData.pendingPayments > 0 ? 'up' : 'neutral'}
          href="/payments"
          icon="⏳"
        />
        <FinancialMetricCard
          title="Failed Payments"
          value={financialData.overduePayments}
          subtitle="Needs follow-up"
          trend={financialData.overduePayments > 0 ? 'down' : 'neutral'}
          href="/payments"
          icon="❌"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income Trend */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
          <h2 className="font-semibold mb-4">Monthly Income Trend</h2>
          <div className="h-64">
            <FinancialChart
              data={financialData.chartData}
              title="Income Over Last 6 Months"
            />
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
          <h2 className="font-semibold mb-4">Payment Methods</h2>
          {/* TODO: Add pie chart for payment methods */}
          <p className="text-muted-foreground">
            Payment method breakdown chart coming soon.
          </p>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
        <h2 className="font-semibold mb-4">Recent Payments</h2>
        {financialData.recentPayments.length === 0 ? (
          <p className="text-muted-foreground">No recent payments</p>
        ) : (
          <div className="space-y-4">
            {financialData.recentPayments.map((payment: any) => (
              <div key={payment.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{payment.tenants?.full_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {payment.tenants?.units?.unit_number} - {payment.tenants?.units?.properties?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">{payment.amount} KES</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusClass(payment.status)}`}
                      >
                        {getPaymentStatusLabel(payment.status)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {new Date(payment.payment_date).toLocaleDateString()} •
                  {getPaymentMethodLabel(payment.payment_method)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper functions
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