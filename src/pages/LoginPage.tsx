import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../lib/firebase';
import { API_BASE_URL, getErrorMessage } from '../lib/api';
import { Spinner } from '../components/Feedback';

type LoginMode = 'firebase' | 'token';

export function LoginPage() {
  const { user, loginWithFirebase, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<LoginMode>(
    isFirebaseConfigured ? 'firebase' : 'token',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? '/';

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (mode === 'firebase') {
        await loginWithFirebase(email, password);
      } else {
        await loginWithToken(token);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand">
          <span className="brand-mark brand-mark-lg">
            <Sparkles size={24} />
          </span>
          <span>ServiceHub</span>
        </div>
        <div className="login-copy">
          <h1>Run your service business from one place.</h1>
          <p>
            Track every booking, schedule new jobs, and keep your service
            catalogue fresh — all from the admin console.
          </p>
          <ul>
            <li>
              <span className="login-feature-icon">
                <CalendarDays size={18} />
              </span>
              Live bookings and status updates
            </li>
            <li>
              <span className="login-feature-icon">
                <Wrench size={18} />
              </span>
              Manage services and categories
            </li>
            <li>
              <span className="login-feature-icon">
                <ShieldCheck size={18} />
              </span>
              Admin-only secure access
            </li>
          </ul>
        </div>
        <footer>Connected to {API_BASE_URL}</footer>
      </section>

      <section className="login-form-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <header>
            <h2>Welcome back</h2>
            <p>Sign in with your admin account to continue.</p>
          </header>

          <div className="segmented-control" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'firebase'}
              className={mode === 'firebase' ? 'is-active' : ''}
              onClick={() => {
                setMode('firebase');
                setError('');
              }}
            >
              Firebase sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'token'}
              className={mode === 'token' ? 'is-active' : ''}
              onClick={() => {
                setMode('token');
                setError('');
              }}
            >
              Access token
            </button>
          </div>

          {mode === 'firebase' ? (
            <>
              {!isFirebaseConfigured && (
                <div className="inline-alert">
                  <strong>Firebase web API key missing.</strong>
                  <span>
                    Add <code>VITE_FIREBASE_API_KEY</code> to <code>.env</code> to
                    enable email/password sign in, or use the access token tab.
                  </span>
                </div>
              )}
              <label className="field">
                <span>Email</span>
                <div className="input-with-icon">
                  <Mail size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </label>
              <label className="field">
                <span>Password</span>
                <div className="input-with-icon">
                  <Lock size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="input-action"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
            </>
          ) : (
            <>
              <div className="inline-alert inline-alert-info">
                <strong>Paste a backend JWT</strong>
                <span>
                  Sign in to the app as an admin, then paste the JWT returned by{' '}
                  <code>/auth/verify</code>.
                </span>
              </div>
              <label className="field">
                <span>Access token</span>
                <div className="input-with-icon input-textarea">
                  <KeyRound size={16} />
                  <textarea
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
                    rows={5}
                    required
                  />
                </div>
              </label>
            </>
          )}

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="button button-primary button-block"
            disabled={isSubmitting || (mode === 'firebase' && !isFirebaseConfigured)}
          >
            {isSubmitting ? (
              <>
                <Spinner size={17} />
                Signing in…
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={17} />
              </>
            )}
          </button>

          <p className="login-hint">
            Only accounts with the <strong>admin</strong> role can access this
            dashboard.
          </p>
        </form>
      </section>
    </div>
  );
}
