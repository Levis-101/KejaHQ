'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="auth-shell">
      {/* Left panel — brand */}
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <div className="brand-logo">
            <span className="brand-icon">⌂</span>
            <span className="brand-name">KejaHQ</span>
          </div>

          <div className="brand-copy">
            <h1>Your property<br />command center.</h1>
            <p>
              Stop chasing rent via WhatsApp.<br />
              Manage all your units from one clear dashboard.
            </p>
          </div>

          <div className="brand-stats">
            <div className="brand-stat">
              <span className="stat-value">12</span>
              <span className="stat-label">Units tracked</span>
            </div>
            <div className="brand-divider" />
            <div className="brand-stat">
              <span className="stat-value">KES 240k</span>
              <span className="stat-label">Rent this month</span>
            </div>
            <div className="brand-divider" />
            <div className="brand-stat">
              <span className="stat-value">9/12</span>
              <span className="stat-label">Paid on time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-mobile-logo">
            <span className="brand-icon">⌂</span>
            <span className="brand-name">KejaHQ</span>
          </div>

          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your landlord dashboard</p>

          {error && (
            <div className="auth-error" role="alert">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="password" className="form-label">Password</label>
                <Link href="/forgot-password" className="auth-link text-sm">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{' '}
            <Link href="/signup" className="auth-link font-semibold">
              Create one free
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-shell {
          display: flex;
          min-height: 100vh;
          background-color: var(--color-bg);
        }

        /* Left brand panel */
        .auth-brand-panel {
          display: none;
          width: 44%;
          background-color: var(--color-teal-700);
          background-image: 
            radial-gradient(ellipse at 20% 80%, rgba(61, 184, 176, 0.25) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(7, 46, 44, 0.6) 0%, transparent 60%);
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 900px) {
          .auth-brand-panel { display: flex; align-items: center; }
        }

        .auth-brand-inner {
          padding: 3rem;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-icon {
          font-size: 1.75rem;
          color: var(--color-amber-400);
          line-height: 1;
        }
        .brand-name {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.02em;
        }

        .brand-copy h1 {
          font-family: var(--font-display);
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 1rem;
        }
        .brand-copy p {
          color: rgba(255,255,255,0.7);
          font-size: 1rem;
          line-height: 1.7;
        }

        .brand-stats {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: var(--radius-lg);
          padding: 1.25rem 1.5rem;
        }
        .brand-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .stat-value {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 800;
          color: white;
        }
        .stat-label {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.55);
          white-space: nowrap;
        }
        .brand-divider {
          width: 1px;
          height: 40px;
          background: rgba(255,255,255,0.15);
        }

        /* Right form panel */
        .auth-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
        }
        .auth-form-inner {
          width: 100%;
          max-width: 400px;
        }

        .auth-mobile-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2.5rem;
        }
        .auth-mobile-logo .brand-icon {
          color: var(--color-teal-700);
        }
        .auth-mobile-logo .brand-name {
          color: var(--color-text);
        }
        @media (min-width: 900px) {
          .auth-mobile-logo { display: none; }
        }

        .auth-title {
          font-family: var(--font-display);
          font-size: 1.875rem;
          font-weight: 800;
          color: var(--color-text);
          letter-spacing: -0.02em;
          margin-bottom: 0.4rem;
        }
        .auth-subtitle {
          color: var(--color-text-muted);
          font-size: 0.9rem;
          margin-bottom: 2rem;
        }

        .auth-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
          border-radius: var(--radius-md);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          margin-bottom: 1.25rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-group { display: flex; flex-direction: column; }
        .form-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.375rem;
        }
        .form-label-row .form-label { margin-bottom: 0; }

        .auth-link {
          color: var(--color-teal-700);
          text-decoration: none;
          font-size: 0.875rem;
          transition: color 0.15s;
        }
        .auth-link:hover { color: var(--color-teal-600); text-decoration: underline; }

        .auth-switch {
          text-align: center;
          color: var(--color-text-muted);
          font-size: 0.875rem;
          margin-top: 1.75rem;
        }

        .w-full { width: 100%; }
        .mt-2 { margin-top: 0.5rem; }
      `}</style>
    </div>
  )
}
