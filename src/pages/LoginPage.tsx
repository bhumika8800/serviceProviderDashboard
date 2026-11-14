import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, getErrorMessage } from '../lib/api';
import { Spinner } from '../components/Feedback';

export function LoginPage() {
  const { user, loginWithCredentials } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      await loginWithCredentials(email, password);
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
            <p>Sign in with your admin email and password.</p>
          </header>

          <label className="field">
            <span>Email</span>
            <div className="input-with-icon">
              <Mail size={16} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@serviceprovider.com"
                autoComplete="username"
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

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="button button-primary button-block"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner size={17} />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight size={17} />
              </>
            )}
          </button>

          <p className="login-hint">
            Use the admin credentials configured in the backend environment
            (<code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code>).
          </p>
        </form>
      </section>
    </div>
  );
}
