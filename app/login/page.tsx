'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(147, 107, 218, 0.1) 0%, rgba(13, 17, 23, 0.95) 50%, rgba(0, 0, 0, 0.98) 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(147, 107, 218, 0.2)',
        boxShadow: '0 4px 40px rgba(0,0,0,0.5), 0 0 80px rgba(147, 107, 218, 0.05)',
        padding: '48px',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Gradient line at top */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(147, 107, 218, 0.4), transparent)',
        }} />
        
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #00FFD4 0%, #926BD9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#000' }}>B</span>
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: '-0.3px',
              margin: 0,
            }}>
              BuilderPulse
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: '#8b8b9e' }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: '#c4c4d4',
              marginBottom: '8px',
            }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'rgba(147, 107, 218, 0.08)',
                border: '1px solid rgba(147, 107, 218, 0.15)',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#FFFFFF',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(0, 255, 212, 0.4)';
                e.target.style.boxShadow = '0 0 0 3px rgba(0, 255, 212, 0.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(147, 107, 218, 0.15)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: '#c4c4d4',
              marginBottom: '8px',
            }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'rgba(147, 107, 218, 0.08)',
                border: '1px solid rgba(147, 107, 218, 0.15)',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#FFFFFF',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(0, 255, 212, 0.4)';
                e.target.style.boxShadow = '0 0 0 3px rgba(0, 255, 212, 0.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(147, 107, 218, 0.15)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '13px',
              color: '#EF4444',
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: loading ? '#00d4b3' : '#00FFD4',
              color: '#000000',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1,
              marginTop: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#00e6be';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 212, 0.3)';
              }
            }}
            onMouseLeave={e => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#00FFD4';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{
          fontSize: '12px',
          color: '#4a4a5a',
          textAlign: 'center',
          marginTop: '28px',
        }}>
          hammad@homebuildermarketers.com · BuilderPulse2026!
        </p>
      </div>
    </div>
  );
}
