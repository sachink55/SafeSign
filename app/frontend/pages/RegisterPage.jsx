import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ShieldCheck, Upload, AlertCircle, Eye, EyeOff, X, FileImage } from 'lucide-react';
import { readFileAsPreview } from '../utils/imageUtils.js';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:5005/api' : '/api');

export default function RegisterPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
    if (serverError) setServerError('');
  };

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.tif', '.tiff', '.webp', '.gif'];
    const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    if (!selectedFile.type.startsWith('image/') && !allowedExtensions.includes(ext)) {
      alert('Please upload an image file (PNG, JPG, BMP, TIF, etc.).');
      return;
    }
    setSignatureFile(selectedFile);
    try {
      const dataUrl = await readFileAsPreview(selectedFile);
      setSignaturePreview(dataUrl);
    } catch (err) {
      console.error('Error reading file:', err);
      const reader = new FileReader();
      reader.onload = (e) => setSignaturePreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    }
    if (errors.signature) setErrors({ ...errors, signature: '' });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const removeFile = () => {
    setSignatureFile(null);
    setSignaturePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Must be at least 6 characters';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    
    if (form.role !== 'admin' && !signaturePreview) {
      errs.signature = 'Please provide your signature image';
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError('');

    try {
      let cloudinaryUrl = '';
      
      // Only upload signature if user is not an admin
      if (form.role !== 'admin' && signatureFile) {
        // 1. Get signature from our backend
        const sigRes = await fetch(`${API_URL}/auth/cloudinary-signature`);
        if (!sigRes.ok) throw new Error('Failed to get upload signature');
        const sigData = await sigRes.json();

        // 2. Upload directly to Cloudinary
        const formData = new FormData();
        formData.append('file', signatureFile);
        formData.append('api_key', sigData.apiKey);
        formData.append('timestamp', sigData.timestamp);
        formData.append('signature', sigData.signature);

        const cloudinaryRes = await fetch(
          `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!cloudinaryRes.ok) throw new Error('Failed to upload image to Cloudinary');
        const cloudinaryData = await cloudinaryRes.json();
        cloudinaryUrl = cloudinaryData.secure_url;
      }

      // 3. Register user with our backend using the Cloudinary URL (if any)
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          signature: cloudinaryUrl, // Pass the URL instead of base64
          role: form.role || 'user',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message || 'Registration failed. Please try again.');
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
      console.error(err);
      setServerError(err.message || 'Cannot connect to server. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-bg">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
      </div>

      <div className="content-wrapper" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
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
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">Register to start verifying your cheques</p>
            </div>

            {/* Server Error */}
            {serverError && (
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
                {serverError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              {/* Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="register-name">Full Name</label>
                <div className="form-input-wrapper">
                  <input
                    id="register-name"
                    className="form-input"
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                  />
                  <User size={18} className="form-input-icon" />
                </div>
                {errors.name && <p className="form-error"><AlertCircle size={12} />{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="register-email">Email Address</label>
                <div className="form-input-wrapper">
                  <input
                    id="register-email"
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
                <label className="form-label" htmlFor="register-password">Password</label>
                <div className="form-input-wrapper">
                  <input
                    id="register-password"
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

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="register-confirm">Confirm Password</label>
                <div className="form-input-wrapper">
                  <input
                    id="register-confirm"
                    className="form-input"
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                  <Lock size={18} className="form-input-icon" />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="form-error"><AlertCircle size={12} />{errors.confirmPassword}</p>}
              </div>

              {/* Role Selection */}
              <div className="form-group">
                <label className="form-label" htmlFor="register-role">Account Role</label>
                <div className="form-input-wrapper">
                  <select
                    id="register-role"
                    className="form-input"
                    name="role"
                    value={form.role || 'user'}
                    onChange={handleChange}
                    style={{ appearance: 'none', background: 'transparent' }}
                  >
                    <option value="user" style={{ color: '#000' }}>User (Banking Dashboard)</option>
                    <option value="admin" style={{ color: '#000' }}>Admin (Cheque Verification)</option>
                  </select>
                  <ShieldCheck size={18} className="form-input-icon" />
                </div>
              </div>

              {/* Signature Upload */}
              {form.role !== 'admin' && (
                <div className="form-group">
                  <label className="form-label">Signature Image</label>
                  {!signaturePreview ? (
                    <div
                      className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      style={{ padding: 'var(--space-6)' }}
                    >
                      <div className="upload-zone-icon" style={{ marginBottom: 'var(--space-2)' }}>
                        <Upload size={32} />
                      </div>
                      <p className="upload-zone-text" style={{ fontSize: 'var(--font-size-sm)' }}>
                        <span className="upload-zone-highlight">Click to upload</span> or drag and drop
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>PNG, JPG, BMP, TIF, TIFF, WEBP</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.tif,.tiff,.bmp"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect(e.target.files[0])}
                      />
                    </div>
                  ) : (
                    <div className="upload-preview animate-fade-in" style={{ maxHeight: '150px' }}>
                      <img src={signaturePreview} alt="Signature preview" style={{ maxHeight: '150px' }} />
                      <div className="upload-preview-overlay">
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon"
                          onClick={removeFile}
                          title="Remove image"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div style={{
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                      }}>
                        <FileImage size={14} />
                        {signatureFile?.name}
                      </div>
                    </div>
                  )}
                  {errors.signature && <p className="form-error"><AlertCircle size={12} />{errors.signature}</p>}
                </div>
              )}

              <button
                id="register-submit-btn"
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    Create Account
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              Already have an account? <Link to="/login">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
