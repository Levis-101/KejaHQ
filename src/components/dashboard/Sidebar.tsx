'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard',    icon: '⊞', label: 'Overview' },
  { href: '/properties',  icon: '⌂', label: 'Properties' },
  { href: '/tenants',     icon: '👥', label: 'Tenants' },
  { href: '/payments',    icon: '₿', label: 'Payments' },
  { href: '/maintenance', icon: '🔧', label: 'Maintenance' },
  { href: '/documents',   icon: '📄', label: 'Documents' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="logo-icon">⌂</span>
        <span className="logo-text">KejaHQ</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(item => {
          const active = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${active ? 'nav-item--active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {active && <span className="nav-dot" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="sidebar-footer">
        <Link href="/settings" className="nav-item">
          <span className="nav-icon">⚙</span>
          <span className="nav-label">Settings</span>
        </Link>
        <button className="nav-item signout-btn" onClick={handleSignOut}>
          <span className="nav-icon">↩</span>
          <span className="nav-label">Sign out</span>
        </button>
      </div>

      <style jsx>{`
        .sidebar {
          width: 220px;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          background-color: var(--color-teal-900);
          display: flex;
          flex-direction: column;
          padding: 0;
          z-index: 40;
          border-right: 1px solid rgba(255,255,255,0.06);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 1.5rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .logo-icon {
          font-size: 1.5rem;
          color: var(--color-amber-400);
          line-height: 1;
        }
        .logo-text {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.2rem;
          color: white;
          letter-spacing: -0.02em;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 1rem 0.75rem;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0.6rem 0.75rem;
          border-radius: var(--radius-md);
          text-decoration: none;
          color: rgba(255,255,255,0.55);
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.15s;
          position: relative;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }
        .nav-item:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.9);
        }
        .nav-item--active {
          background: rgba(18, 153, 144, 0.25);
          color: white;
        }
        .nav-icon {
          font-size: 1rem;
          width: 20px;
          text-align: center;
          flex-shrink: 0;
        }
        .nav-label { flex: 1; }
        .nav-dot {
          width: 6px;
          height: 6px;
          background: var(--color-amber-400);
          border-radius: 50%;
        }

        .sidebar-footer {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0.75rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .signout-btn {
          color: rgba(255,255,255,0.4);
          font-family: var(--font-body);
        }
        .signout-btn:hover {
          color: #fca5a5;
          background: rgba(220, 38, 38, 0.15);
        }
      `}</style>
    </aside>
  )
}
