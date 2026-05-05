import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:5005/api' : '/api');

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
    if (loginError) setLoginError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setLoginError('');

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.message || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }

      // Save token and user info
      localStorage.setItem('safesign_token', data.token);
      localStorage.setItem('safesign_user', JSON.stringify(data.user));
      if (data.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/user-dashboard');
      }
    } catch (err) {
      setLoginError('Cannot connect to server. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-bg">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
      </div>

      <div className="content-wrapper">
        <div className="auth-container animate-fade-in-up">
          <div className="glass-card">
            {/* Header */}
            <div className="auth-header">
              <Link to="/" className="auth-logo">
                <div className="auth-logo-icon">
                  <img src="/logo.png" alt="Logo" className="navbar-brand-logo" />
                </div>
                SafeSign
              </Link>
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">Sign in to your account to continue</p>
            </div>

            {/* Login Error */}
            {loginError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-3) var(--space-4)',
                  marginBottom: 'var(--space-5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  color: 'var(--color-error)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <AlertCircle size={16} />
                {loginError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email Address</label>
                <div className="form-input-wrapper">
                  <input
                    id="login-email"
                    className="form-input"
                    type="email"
                    name="email"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                  <Mail size={18} className="form-input-icon" />
                </div>
                {errors.email && <p className="form-error"><AlertCircle size={12} />{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password</label>
                <div className="form-input-wrapper">
                  <input
                    id="login-password"
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                  />
                  <Lock size={18} className="form-input-icon" />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="form-error"><AlertCircle size={12} />{errors.password}</p>}
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                style={{ marginTop: '8px' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'rotate-gradient 0.8s linear infinite',
                      }}
                    />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              Don&apos;t have an account? <Link to="/register">Create Account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
