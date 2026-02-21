import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginWithGoogle } from './LoginWithGoogle';
import { apiPost, setAccessToken } from '../../lib/api';

interface Props {
  onSuccess?: () => void;
}

/**
 * Inline login/register form — rendered inside the Account settings tab.
 * Not a full-page blocker; the dashboard is always accessible.
 */
export function LoginScreen({ onSuccess }: Props) {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function switchMode(next: 'login' | 'register') {
    setMode(next);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        const data = await apiPost<{ accessToken: string }>('/auth/register', { email, password, name });
        await setAccessToken(data.accessToken);
        window.location.reload();
      } else {
        await login(email, password);
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Google */}
      <LoginWithGoogle onError={setError} onSuccess={onSuccess} />

      {/* Divider */}
      <div className="auth-divider">
        <span className="auth-divider-text">or</span>
      </div>

      {/* Email / password form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {mode === 'register' && (
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="settings-input"
            style={{ fontFamily: 'inherit', fontSize: '14px' }}
          />
        )}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="settings-input"
          style={{ fontFamily: 'inherit', fontSize: '14px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className="settings-input"
          style={{ fontFamily: 'inherit', fontSize: '14px' }}
        />

        {error && <p className="auth-error">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="settings-save-btn"
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      {/* Toggle mode */}
      <p className="auth-toggle-row">
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button
          type="button"
          onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
          className="auth-toggle-link"
        >
          {mode === 'login' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}
