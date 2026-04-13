import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginWithGoogle } from './LoginWithGoogle';
import { apiPost } from '../../lib/api';

interface Props {
  onSuccess?: () => void;
}

/**
 * Inline login/register form — rendered inside the Account settings tab.
 * Not a full-page blocker; the dashboard is always accessible.
 */
interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

function validateFields(mode: 'login' | 'register', name: string, email: string, password: string): FieldErrors {
  const errs: FieldErrors = {};
  if (mode === 'register') {
    if (name.trim().length < 1) errs.name = 'Name is required';
    else if (name.trim().length > 100) errs.name = 'Name must be 100 characters or less';
  }
  if (!email.trim()) errs.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email address';
  if (!password) errs.password = 'Password is required';
  else if (mode === 'register' && password.length < 8) errs.password = 'Password must be at least 8 characters';
  return errs;
}

export function LoginScreen({ onSuccess }: Props) {
  const { login, loginWithTokens } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  function switchMode(next: 'login' | 'register' | 'forgot') {
    setMode(next);
    setError('');
    setFieldErrors({});
    setForgotSent(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (mode === 'forgot') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setFieldErrors({ email: 'Enter a valid email address' });
        return;
      }
      setFieldErrors({});
      setLoading(true);
      try {
        await apiPost('/auth/forgot-password', { email: email.trim() });
        setForgotSent(true);
      } catch {
        // Always show success to prevent user enumeration
        setForgotSent(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    const errs = validateFields(mode, name, email, password);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      if (mode === 'register') {
        const data = await apiPost<{ accessToken: string; refreshToken: string }>('/auth/register', { email: email.trim(), password, name: name.trim() });
        await loginWithTokens(data.accessToken, data.refreshToken);
        onSuccess?.();
      } else {
        await login(email.trim(), password);
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'forgot') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {forgotSent ? (
          <p className="auth-field-success">
            If that email is registered, a reset link is on its way. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors({}); }}
              autoComplete="email"
              className="settings-input"
              style={{ fontFamily: 'inherit', fontSize: '14px' }}
            />
            {fieldErrors.email && <p className="auth-field-error">{fieldErrors.email}</p>}
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" disabled={loading} className="settings-save-btn">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
        <p className="auth-toggle-row">
          <button type="button" onClick={() => switchMode('login')} className="auth-toggle-link">
            Back to sign in
          </button>
        </p>
      </div>
    );
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
          <>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => { setName(e.target.value); setFieldErrors((f) => ({ ...f, name: undefined })); }}
              className="settings-input"
              style={{ fontFamily: 'inherit', fontSize: '14px' }}
            />
            {fieldErrors.name && <p className="auth-field-error">{fieldErrors.name}</p>}
          </>
        )}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, email: undefined })); }}
          autoComplete="email"
          className="settings-input"
          style={{ fontFamily: 'inherit', fontSize: '14px' }}
        />
        {fieldErrors.email && <p className="auth-field-error">{fieldErrors.email}</p>}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: undefined })); }}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className="settings-input"
          style={{ fontFamily: 'inherit', fontSize: '14px' }}
        />
        {fieldErrors.password && <p className="auth-field-error">{fieldErrors.password}</p>}

        {mode === 'login' && (
          <button type="button" onClick={() => switchMode('forgot')} className="auth-forgot-link">
            Forgot password?
          </button>
        )}

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
