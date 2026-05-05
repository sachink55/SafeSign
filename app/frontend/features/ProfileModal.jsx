import { useState } from 'react';
import { X, User, Mail, Save, Loader2, Shield } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:5005/api' : '/api');

export default function ProfileModal({ isOpen, onClose, user, onUpdate }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('safesign_token');
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');

      setSuccess('Profile updated successfully!');
      onUpdate(data.user);
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <User className="text-gradient" />
            Profile Settings
          </h2>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <div className="nav-avatar" style={{ width: '80px', height: '80px', fontSize: '32px', marginBottom: 'var(--space-3)' }}>
                {formData.name.charAt(0).toUpperCase()}
              </div>
              <span className="status-badge status-genuine">
                <Shield size={12} style={{ marginRight: '4px' }} />
                {user.role === 'admin' ? 'Administrator' : 'Verified User'}
              </span>
            </div>

            {error && <p className="form-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</p>}
            {success && <p style={{ color: '#4ade80', fontSize: '14px', textAlign: 'center', marginBottom: 'var(--space-4)' }}>{success}</p>}

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="form-input-wrapper">
                <input
                  className="form-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <User size={18} className="form-input-icon" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="form-input-wrapper">
                <input
                  className="form-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Mail size={18} className="form-input-icon" />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
