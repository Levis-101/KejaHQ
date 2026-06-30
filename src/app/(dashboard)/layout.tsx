'use client';

import { redirect } from 'next/navigation'
import { getUser, createServerSupabaseClient } from '@/lib/supabase-server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import type { Database } from '@/lib/supabase'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  // Auth guard — kick unauthenticated users to login
  if (!user) {
    redirect('/login')
  }

  // Fetch landlord profile
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: { full_name: string | null } | null; error: any }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Landlord'

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-left">
            {/* Page title is injected by children */}
          </div>
          <div className="topbar-right">
            <div className="user-chip">
              <div className="user-avatar">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{displayName}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="content">
          {children}
        </main>
      </div>

      <style jsx>{`
        .layout {
          display: flex;
          min-height: 100vh;
          background: var(--color-bg);
        }

        .main {
          margin-left: 220px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .topbar {
          height: 60px;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 100px;
          padding: 4px 12px 4px 4px;
        }
        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--color-teal-700);
          color: white;
          font-size: 0.8rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
        }
        .user-name {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--color-text);
        }

        .content {
          flex: 1;
          padding: 2rem;
          max-width: 1200px;
          width: 100%;
        }
      `}</style>
    </div>
  )
}