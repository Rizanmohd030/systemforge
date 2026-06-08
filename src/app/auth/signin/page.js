'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { Space_Grotesk } from 'next/font/google'

const font = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] })

// ─── COLORS ───────────────────────────────────────────────────────────────────
const C = {
  white:      'rgba(255,255,255,1)',
  whiteHi:    'rgba(255,255,255,0.92)',
  whiteMid:   'rgba(255,255,255,0.60)',
  whiteLow:   'rgba(255,255,255,0.35)',
  whiteGhost: 'rgba(255,255,255,0.08)',
  accent:     'rgba(120,180,255,1)',
  accentMid:  'rgba(120,180,255,0.55)',
  accentLow:  'rgba(120,180,255,0.12)',
  ready:      'rgba(100,220,255,1)',
  error:      'rgba(255,100,100,0.9)',
  cardBorder: 'rgba(255,255,255,0.14)',
}

// ─── CORNER BRACKETS ──────────────────────────────────────────────────────────
function Brackets({ color = C.cardBorder, size = 10 }) {
  const s = { position: 'absolute', width: size, height: size }
  const b = { border: `1px solid ${color}` }
  return (
    <>
      <div style={{ ...s, top: 0, left: 0, borderTop: b.border, borderLeft: b.border }} />
      <div style={{ ...s, top: 0, right: 0, borderTop: b.border, borderRight: b.border }} />
      <div style={{ ...s, bottom: 0, left: 0, borderBottom: b.border, borderLeft: b.border }} />
      <div style={{ ...s, bottom: 0, right: 0, borderBottom: b.border, borderRight: b.border }} />
    </>
  )
}

// ─── SIGN-IN FORM ─────────────────────────────────────────────────────────────
function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('google') // 'google' | 'credentials'
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState(null)

  const callbackUrl = searchParams.get('callbackUrl') || '/'

  // Redirect if already signed in
  useEffect(() => {
    if (status === 'authenticated') router.replace(callbackUrl)
  }, [status, callbackUrl, router])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    await signIn('google', { redirect: true, callbackUrl })
    setLoading(false)
  }

  const handleCredentials = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setError('')
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setError('Invalid credentials. Please try again.')
      } else if (result?.ok) {
        router.replace(callbackUrl)
      }
    } catch {
      setError('Sign-in failed. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field) => ({
    width: '100%',
    background: focusedField === field ? 'rgba(120,180,255,0.06)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${focusedField === field ? C.accentMid : C.cardBorder}`,
    color: C.whiteHi,
    padding: '11px 14px',
    fontFamily: 'monospace',
    fontSize: '13px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    letterSpacing: '0.03em',
  })

  return (
    <main
      className={font.className}
      style={{
        minHeight: '100vh',
        background: '#040c2d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Blueprint grid background ─── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(120,180,255,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(120,180,255,0.035) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      {/* ── Corner markers ─── */}
      {[
        { top: 20, left: 20, borderTop: `1px solid ${C.cardBorder}`, borderLeft: `1px solid ${C.cardBorder}` },
        { top: 20, right: 20, borderTop: `1px solid ${C.cardBorder}`, borderRight: `1px solid ${C.cardBorder}` },
        { bottom: 20, left: 20, borderBottom: `1px solid ${C.cardBorder}`, borderLeft: `1px solid ${C.cardBorder}` },
        { bottom: 20, right: 20, borderBottom: `1px solid ${C.cardBorder}`, borderRight: `1px solid ${C.cardBorder}` },
      ].map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: 40, height: 40, ...s }} />
      ))}

      {/* ── Radial glow ─── */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(120,180,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* ── Sign-in card ─── */}
      <div style={{
        position: 'relative',
        width: 400,
        padding: '44px 40px',
        background: 'rgba(8,20,70,0.65)',
        border: `1px solid ${C.cardBorder}`,
        backdropFilter: 'blur(12px)',
        zIndex: 2,
      }}>
        <Brackets color="rgba(120,180,255,0.30)" size={12} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ fontSize: 9, color: C.whiteLow, letterSpacing: '0.20em', margin: '0 0 10px 0', fontFamily: 'monospace' }}>
            {'// AUTH_MODULE_v2.1'}
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: C.white, margin: '0 0 8px 0', letterSpacing: '0.08em' }}>
            SYSTEMFORGE
          </h1>
          <p style={{ fontSize: 11, color: C.whiteMid, margin: 0, letterSpacing: '0.10em' }}>
            SIGN IN TO YOUR WORKSPACE
          </p>
        </div>

        {/* ── Tab switcher ─── */}
        <div style={{ display: 'flex', marginBottom: 28, borderBottom: `1px solid ${C.whiteGhost}` }}>
          {[
            { id: 'google', label: 'GOOGLE OAUTH' },
            { id: 'credentials', label: 'EMAIL' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError('') }}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? C.accent : 'transparent'}`,
                color: activeTab === tab.id ? C.accent : C.whiteLow,
                padding: '8px 0',
                fontFamily: 'monospace',
                fontSize: '9px',
                letterSpacing: '0.14em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Error banner ─── */}
        {error && (
          <div style={{
            marginBottom: 20,
            padding: '10px 14px',
            border: `1px solid ${C.error}`,
            background: 'rgba(255,100,100,0.06)',
            fontSize: 11,
            color: C.error,
            fontFamily: 'monospace',
            letterSpacing: '0.04em',
          }}>
            ✕ {error}
          </div>
        )}

        {/* ── GOOGLE TAB ─── */}
        {activeTab === 'google' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 11, color: C.whiteLow, margin: 0, lineHeight: 1.7, fontFamily: 'monospace' }}>
              Sign in with your Google account. Your blueprints will be saved and restored across devices.
            </p>

            <button
              id="signin-google-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                padding: '13px 20px',
                background: loading ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${loading ? C.whiteGhost : C.cardBorder}`,
                color: loading ? C.whiteLow : C.whiteHi,
                fontFamily: 'monospace', fontSize: 12, letterSpacing: '0.08em',
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
                width: '100%',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = C.accentMid; e.currentTarget.style.background = 'rgba(120,180,255,0.08)' } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
            >
              {/* Google G logo */}
              {!loading && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {loading ? '[ CONNECTING... ]' : '[ SIGN IN WITH GOOGLE ]'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: '1px', background: C.whiteGhost }} />
              <span style={{ fontSize: 9, color: C.whiteLow, fontFamily: 'monospace', letterSpacing: '0.10em' }}>SECURE · JWT · 30 DAYS</span>
              <div style={{ flex: 1, height: '1px', background: C.whiteGhost }} />
            </div>
          </div>
        )}

        {/* ── CREDENTIALS TAB ─── */}
        {activeTab === 'credentials' && (
          <form onSubmit={handleCredentials} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 9, color: C.whiteLow, letterSpacing: '0.14em', marginBottom: 7, fontFamily: 'monospace' }}>
                EMAIL ADDRESS
              </label>
              <input
                id="signin-email-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="you@example.com"
                required
                style={inputStyle('email')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 9, color: C.whiteLow, letterSpacing: '0.14em', marginBottom: 7, fontFamily: 'monospace' }}>
                PASSWORD
              </label>
              <input
                id="signin-password-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                required
                style={inputStyle('password')}
              />
            </div>

            <button
              id="signin-submit-btn"
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              style={{
                padding: '12px 20px',
                background: loading ? 'rgba(120,180,255,0.06)' : 'rgba(120,180,255,0.15)',
                border: `1px solid ${loading ? C.whiteGhost : C.accentMid}`,
                color: loading ? C.whiteLow : C.accent,
                fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.10em',
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
                width: '100%',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(120,180,255,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(120,180,255,0.15)' }}
            >
              {loading ? '[ AUTHENTICATING... ]' : '[ SIGN IN ]'}
            </button>
          </form>
        )}

        {/* Footer note */}
        <p style={{
          marginTop: 28, fontSize: 10, color: C.whiteLow,
          textAlign: 'center', fontFamily: 'monospace', letterSpacing: '0.06em', lineHeight: 1.7,
        }}>
          Your blueprints are encrypted and stored<br />
          per-user in PostgreSQL. Data never shared.
        </p>

        {/* Version stamp */}
        <p style={{
          position: 'absolute', bottom: -20, right: 0,
          fontSize: 8, color: 'rgba(255,255,255,0.10)',
          fontFamily: 'monospace', letterSpacing: '0.10em',
        }}>
          SF_AUTH_MODULE // v2.1.0
        </p>
      </div>

      <style>{`
        @keyframes gridPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </main>
  )
}

// Wrap in Suspense for useSearchParams()
export default function SignIn() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  )
}
