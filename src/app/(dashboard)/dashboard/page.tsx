import { getUser, createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

// ── Stat Card ────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: 'teal' | 'amber' | 'green' | 'red'
}) {
  const accentColor = {
    teal:  'var(--color-teal-700)',
    amber: 'var(--color-amber-500)',
    green: 'var(--color-paid)',
    red:   'var(--color-overdue)',
  }[accent ?? 'teal']

  return (
    <div className="stat-card card">
      <span className="stat-label">{label}</span>
      <span className="stat-value" style={{ color: accentColor }}>{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}

      <style jsx>{`
        .stat-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .stat-value {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin-top: 4px;
        }
        .stat-sub {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          margin-top: 2px;
        }
      `}</style>
    </div>
  )
}

// ── Unit Grid Cell ───────────────────────────────
function UnitCell({
  number,
  status,
  tenant,
}: {
  number: string
  status: 'paid' | 'pending' | 'overdue' | 'vacant' | 'maintenance'
  tenant?: string
}) {
  const config = {
    paid:        { bg: '#dcfce7', border: '#86efac', dot: '#16a34a', label: 'Paid' },
    pending:     { bg: '#fef3c7', border: '#fde68a', dot: '#d97706', label: 'Pending' },
    overdue:     { bg: '#fee2e2', border: '#fca5a5', dot: '#dc2626', label: 'Overdue' },
    vacant:      { bg: '#f3f4f6', border: '#d1d5db', dot: '#9ca3af', label: 'Vacant' },
    maintenance: { bg: '#f5f3ff', border: '#c4b5fd', dot: '#7c3aed', label: 'Maintenance' },
  }[status]

  return (
    <div
      className="unit-cell"
      title={`Unit ${number}${tenant ? ` — ${tenant}` : ''} (${config.label})`}
      style={{
        background: config.bg,
        border: `1.5px solid ${config.border}`,
      }}
    >
      <span className="unit-num">{number}</span>
      <span className="unit-dot" style={{ background: config.dot }} />

      <style jsx>{`
        .unit-cell {
          border-radius: var(--radius-sm);
          padding: 0.5rem 0.4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: default;
          transition: transform 0.1s;
          min-width: 48px;
        }
        .unit-cell:hover { transform: scale(1.05); }
        .unit-num {
          font-family: var(--font-display);
          font-size: 0.7rem;
          font-weight: 700;
          color: #374151;
          line-height: 1;
        }
        .unit-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  )
}

// ── Main Dashboard Page ──────────────────────────
export default async function DashboardPage() {
  const user = await getUser()
  const supabase = await createServerSupabaseClient()

  // Fetch real properties and units (will be empty for new accounts)
  const { data: properties } = await supabase
    .from('properties')
    .select('*, units(*)')
    .eq('owner_id', user!.id)
    .limit(5)

  const allUnits = properties?.flatMap((p: any) => p.units ?? []) ?? []
  const totalUnits     = allUnits.length
  const occupiedUnits  = allUnits.filter((u: any) => u.status === 'occupied').length
  const vacantUnits    = allUnits.filter((u: any) => u.status === 'vacant').length

  // Fetch payment count for the dashboard stat
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('id')
    .eq('tenants.units.properties.owner_id', user!.id)

  const totalPayments = payments?.length ?? 0

  const isNewUser = (properties?.length ?? 0) === 0

  // Demo data for the unit grid preview (shown until real data exists)
  const demoUnits: { number: string; status: 'paid' | 'pending' | 'overdue' | 'vacant' | 'maintenance' }[] = [
    { number: '1A', status: 'paid' },
    { number: '1B', status: 'paid' },
    { number: '1C', status: 'pending' },
    { number: '2A', status: 'paid' },
    { number: '2B', status: 'overdue' },
    { number: '2C', status: 'paid' },
    { number: '3A', status: 'vacant' },
    { number: '3B', status: 'paid' },
    { number: '3C', status: 'maintenance' },
    { number: '4A', status: 'paid' },
    { number: '4B', status: 'paid' },
    { number: '4C', status: 'pending' },
  ]

  return (
    <div className="page">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-KE', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
        {!isNewUser && (
          <Link href="/properties/new" className="btn-primary">
            + Add unit
          </Link>
        )}
      </div>

      {/* ── Empty state for new users ── */}
      {isNewUser ? (
        <div className="empty-state card">
          <div className="empty-icon">⌂</div>
          <h2 className="empty-title">Add your first property</h2>
          <p className="empty-desc">
            Once you add a building and its units, this dashboard lights up with rent
            status, tenant info, and payment tracking — all in one place.
          </p>
          <Link href="/properties/new" className="btn-primary">
            Add a property
          </Link>

          {/* Preview of what the dashboard will look like */}
          <div className="preview-label">Here's what it'll look like:</div>
          <div className="unit-preview">
            {demoUnits.map(u => (
              <UnitCell key={u.number} number={u.number} status={u.status} />
            ))}
          </div>
          <div className="legend">
            {[
              { status: 'paid',        label: 'Paid',        dot: '#16a34a' },
              { status: 'pending',     label: 'Pending',     dot: '#d97706' },
              { status: 'overdue',     label: 'Overdue',     dot: '#dc2626' },
              { status: 'vacant',      label: 'Vacant',      dot: '#9ca3af' },
              { status: 'maintenance', label: 'Maintenance', dot: '#7c3aed' },
            ].map(item => (
              <span key={item.status} className="legend-item">
                <span className="legend-dot" style={{ background: item.dot }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ── Stats grid ── */}
          <div className="stats-grid">
            <Link href="/units">
              <StatCard
                label="Total units"
                value={totalUnits}
                sub="Across all properties"
                accent="teal"
              />
            </Link>
            <Link href="/tenants">
              <StatCard
                label="Occupied"
                value={occupiedUnits}
                sub={`${totalUnits - occupiedUnits} vacant`}
                accent="green"
              />
            </Link>
            <Link href="/units?filter=vacant">
              <StatCard
                label="Vacant"
                value={vacantUnits}
                accent="amber"
              />
            </Link>
            <Link href="/properties">
              <StatCard
                label="Properties"
                value={properties?.length ?? 0}
                accent="teal"
              />
            </Link>
            <Link href="/payments">
              <StatCard
                label="Payments"
                value={totalPayments}
                sub="Total received"
                accent="green"
              />
            </Link>
          </div>

          {/* ── Quick Actions ── */}
          <div className="space-y-4">
            <h2 className="font-semibold">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/properties/new" className="btn-primary">
                + Add Property
              </Link>
              <Link href="/payments/new" className="btn-secondary">
                Record Payment
              </Link>
              <Link href="/tenants/new" className="btn-outline">
                Add Tenant
              </Link>
            </div>
          </div>

          {/* ── Unit grid per property ── */}
          {properties?.map((property: any) => (
            <div key={property.id} className="property-section card">
              <div className="property-header">
                <div>
                  <h3 className="property-name">{property.name}</h3>
                  <span className="property-address">{property.address}, {property.city}</span>
                </div>
                <Link href={`/properties/${property.id}`} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
                  View details
                </Link>
              </div>
              <div className="unit-grid">
                {(property.units ?? []).map((unit: any) => (
                  <UnitCell
                    key={unit.id}
                    number={unit.unit_number}
                    status={unit.status}
                  />
                ))}
                {(property.units ?? []).length === 0 && (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    No units added yet. <Link href={`/properties/${property.id}`} style={{ color: 'var(--color-teal-700)' }}>Add units →</Link>
                  </p>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      <style jsx>{`
        .page {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .page-title {
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--color-text);
          letter-spacing: -0.02em;
        }
        .page-subtitle {
          color: var(--color-text-muted);
          font-size: 0.875rem;
          margin-top: 2px;
        }

        /* Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
        }

        /* Empty state */
        .empty-state {
          padding: 2.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          max-width: 600px;
        }
        .empty-icon {
          font-size: 3rem;
          color: var(--color-teal-400);
        }
        .empty-title {
          font-family: var(--font-display);
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--color-text);
        }
        .empty-desc {
          color: var(--color-text-muted);
          font-size: 0.9rem;
          line-height: 1.7;
          max-width: 420px;
        }
        .preview-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.5rem;
        }
        .unit-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
          max-width: 400px;
        }

        /* Unit grid (real data) */
        .property-section {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .property-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .property-name {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-text);
        }
        .property-address {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          display: block;
          margin-top: 2px;
        }
        .unit-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        /* Legend */
        .legend {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: center;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.78rem;
          color: var(--color-text-muted);
        }
        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  )
}
