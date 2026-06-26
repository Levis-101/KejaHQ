'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // If email confirmation is on, tell user to check email
    if (data.user && !data.session) {
      setSuccess(true)
      setLoading(false)
      return
    }

    // Auto-confirmed — go straight to dashboard
    router.push('/dashboard')
    router.refresh()
  }

  if (success) {
    return (
      <div className="auth-shell centered">
        <div className="success-card card">
          <div className="success-icon">✉️</div>
          <h2 className="auth-title">Check your email</h2>
          <p className="auth-subtitle">
            We sent a confirmation link to <strong>{email}</strong>.<br />
            Click it to activate your account and you're in.
          </p>
          <Link href="/login" className="btn-primary" style={{ display: 'inline-flex', marginTop: '1.5rem' }}>
            Back to login
          </Link>
        </div>

        <style jsx>{`
          .auth-shell.centered {
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            background: var(--color-bg);
          }
          .success-card {
            padding: 2.5rem;
            text-align: center;
            max-width: 420px;
            width: 100%;
          }
          .success-icon { font-size: 3rem; margin-bottom: 1rem; }
          .auth-title {
            font-family: var(--font-display);
            font-size: 1.75rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
          }
          .auth-subtitle { color: var(--color-text-muted); line-height: 1.7; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="auth-shell">
      {/* Brand panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <div className="brand-logo">
            <span className="brand-icon">⌂</span>
            <span className="brand-name">KejaHQ</span>
          </div>
          <div className="brand-copy">
            <h1>Set up in<br />minutes.</h1>
            <p>
              Add your properties, invite tenants,<br />
              and your first rent tracker is live today.
            </p>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <div>
                <strong>Create your account</strong>
                <p>Takes 60 seconds</p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <div>
                <strong>Add your building</strong>
                <p>Name it, add floors and units</p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <div>
                <strong>Add your tenants</strong>
                <p>They get a link to their portal</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-mobile-logo">
            <span className="brand-icon">⌂</span>
            <span className="brand-name">KejaHQ</span>
          </div>

          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Free to start — no credit card needed</p>

          {error && (
            <div className="auth-error" role="alert">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="auth-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full name</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="Jane Kamau"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="jane@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Phone number <span className="optional">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                className="form-input"
                placeholder="0712 345 678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create free account'}
            </button>

            <p className="terms">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="auth-link">Terms of Service</Link>{' '}
              and{' '}
              <Link href="/privacy" className="auth-link">Privacy Policy</Link>.
            </p>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link href="/login" className="auth-link font-semibold">
              Sign in
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
        .auth-brand-panel {
          display: none;
          width: 44%;
          background-color: var(--color-teal-700);
          background-image: 
            radial-gradient(ellipse at 20% 80%, rgba(61, 184, 176, 0.25) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(7, 46, 44, 0.6) 0%, transparent 60%);
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
        .brand-logo { display: flex; align-items: center; gap: 10px; }
        .brand-icon { font-size: 1.75rem; color: var(--color-amber-400); line-height: 1; }
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
        .brand-copy p { color: rgba(255,255,255,0.7); font-size: 1rem; line-height: 1.7; }

        .steps { display: flex; flex-direction: column; gap: 1rem; }
        .step {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius-md);
          padding: 1rem 1.25rem;
        }
        .step-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--color-amber-400);
          color: var(--color-teal-900);
          font-weight: 800;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-family: var(--font-display);
        }
        .step strong { color: white; font-size: 0.9rem; display: block; }
        .step p { color: rgba(255,255,255,0.55); font-size: 0.8rem; margin: 2px 0 0; }

        .auth-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
        }
        .auth-form-inner { width: 100%; max-width: 400px; }

        .auth-mobile-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2.5rem;
        }
        .auth-mobile-logo .brand-icon { color: var(--color-teal-700); }
        .auth-mobile-logo .brand-name { color: var(--color-text); }
        @media (min-width: 900px) { .auth-mobile-logo { display: none; } }

        .auth-title {
          font-family: var(--font-display);
          font-size: 1.875rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 0.4rem;
        }
        .auth-subtitle { color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 2rem; }

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

        .auth-form { display: flex; flex-direction: column; gap: 1.1rem; }
        .form-group { display: flex; flex-direction: column; }
        .optional { color: var(--color-text-muted); font-weight: 400; font-size: 0.8em; }

        .terms {
          font-size: 0.78rem;
          color: var(--color-text-muted);
          text-align: center;
          margin: 0;
        }

        .auth-link { color: var(--color-teal-700); text-decoration: none; font-size: 0.875rem; }
        .auth-link:hover { text-decoration: underline; }

        .auth-switch {
          text-align: center;
          color: var(--color-text-muted);
          font-size: 0.875rem;
          margin-top: 1.75rem;
        }
        .font-semibold { font-weight: 600; }
        .w-full { width: 100%; }
        .mt-2 { margin-top: 0.5rem; }
      `}</style>
    </div>
  )
}
