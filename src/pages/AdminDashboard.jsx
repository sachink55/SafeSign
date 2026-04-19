import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck, LogOut, Upload, Mail, CheckCircle2, X,
  FileImage, AlertCircle, ScanLine, Users, Edit3, Save, Search
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Get user data
  const stored = localStorage.getItem('safesign_user');
  const user = stored ? JSON.parse(stored) : { name: 'Admin' };
  const token = localStorage.getItem('safesign_token');

  const [activeTab, setActiveTab] = useState('verification'); // 'verification' | 'users'

  // Verification State
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Users State
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({ balance: '', accountType: '' });

  const handleLogout = () => {
    localStorage.removeItem('safesign_token');
    localStorage.removeItem('safesign_user');
    navigate('/');
  };

  // --- Verification Logic ---
  const handleFileSelect = useCallback((selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVerificationSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (!file) return;

    setIsVerifying(true);
    // Simulate verification
    setTimeout(() => {
      setIsVerifying(false);
      setSubmitted(true);
    }, 2000);
  };

  const resetVerificationForm = () => {
    setEmail('');
    setEmailError('');
    setFile(null);
    setPreview(null);
    setSubmitted(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Users Logic ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const startEdit = (u) => {
    setEditingUserId(u._id);
    setEditForm({
      balance: u.bankDetails?.balance || 0,
      accountType: u.bankDetails?.accountType || 'Savings'
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
  };

  const saveEdit = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/bank`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          balance: Number(editForm.balance),
          accountType: editForm.accountType
        })
      });
      if (res.ok) {
        setEditingUserId(null);
        fetchUsers();
      } else {
        alert('Failed to update details');
      }
    } catch (err) {
      alert('Error saving details');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-bg">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <Link to="/admin-dashboard" className="navbar-brand">
          <div className="navbar-brand-icon" style={{ background: 'var(--color-accent-secondary)' }}>
            <ShieldCheck size={20} />
          </div>
          SafeSign <span style={{ fontSize: '12px', background: 'rgba(167, 139, 250, 0.2)', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px', color: 'var(--color-accent-secondary)' }}>Admin</span>
        </Link>
        <div className="navbar-actions">
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {user.name}
          </span>
          <button id="logout-btn" className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 16px', fontSize: 'var(--font-size-sm)' }}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="home-content" style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto', paddingTop: '20px' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
          <button 
            onClick={() => setActiveTab('verification')}
            className={`btn ${activeTab === 'verification' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: 'var(--radius-full)' }}
          >
            <ScanLine size={18} /> Cheque Verification
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: 'var(--radius-full)' }}
          >
            <Users size={18} /> Manage Bank Accounts
          </button>
        </div>

        {/* Tab 1: Verification */}
        {activeTab === 'verification' && (
          <div className="verify-section" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="glass-card">
              <h2 className="verify-section-title">
                <ScanLine size={24} style={{ color: 'var(--color-accent-primary)' }} />
                Verify Cheque
              </h2>
              <p className="verify-section-desc">
                Upload a photo of a cheque and provide the recipient email. We'll verify the signature.
              </p>

              <form className="verify-form" onSubmit={handleVerificationSubmit}>
                {/* Email Input */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="verify-email">Recipient Email</label>
                  <div className="form-input-wrapper">
                    <input
                      id="verify-email"
                      className="form-input"
                      type="email"
                      placeholder="recipient@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                    />
                    <Mail size={18} className="form-input-icon" />
                  </div>
                  {emailError && <p className="form-error"><AlertCircle size={12} />{emailError}</p>}
                </div>

                {/* Upload Zone */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Cheque Image</label>
                  {!preview ? (
                    <div
                      className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <div className="upload-zone-icon"><Upload size={40} /></div>
                      <p className="upload-zone-text"><span className="upload-zone-highlight">Click to upload</span> or drag and drop</p>
                      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileSelect(e.target.files[0])} />
                    </div>
                  ) : (
                    <div className="upload-preview animate-fade-in">
                      <img src={preview} alt="Cheque preview" />
                      <div className="upload-preview-overlay">
                        <button type="button" className="btn btn-secondary btn-icon" onClick={removeFile}><X size={16} /></button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={!file || !email.trim() || isVerifying}>
                  {isVerifying ? 'Verifying...' : 'Verify Cheque'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Users Management */}
        {activeTab === 'users' && (
          <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
            <h2 className="verify-section-title" style={{ justifyContent: 'flex-start', marginBottom: 'var(--space-6)' }}>
              <Users size={24} style={{ color: 'var(--color-accent-secondary)' }} />
              Manage User Bank Details
            </h2>

            {loadingUsers ? (
              <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-6)' }}>Loading users...</p>
            ) : usersList.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-6)' }}>No users found.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Name</th>
                      <th style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Email</th>
                      <th style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Account No.</th>
                      <th style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Account Type</th>
                      <th style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Balance</th>
                      <th style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-3)' }}>{u.name}</td>
                        <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>{u.email}</td>
                        <td style={{ padding: 'var(--space-3)', fontFamily: 'monospace' }}>{u.bankDetails?.accountNumber || 'N/A'}</td>
                        
                        {/* Account Type Column */}
                        <td style={{ padding: 'var(--space-3)' }}>
                          {editingUserId === u._id ? (
                            <select 
                              className="form-input" 
                              style={{ padding: '4px 8px', minHeight: 'auto' }}
                              value={editForm.accountType}
                              onChange={(e) => setEditForm({...editForm, accountType: e.target.value})}
                            >
                              <option value="Savings">Savings</option>
                              <option value="Checking">Checking</option>
                              <option value="Business">Business</option>
                            </select>
                          ) : (
                            <span style={{ padding: '2px 8px', background: 'var(--color-surface-hover)', borderRadius: '12px', fontSize: '12px' }}>
                              {u.bankDetails?.accountType || 'N/A'}
                            </span>
                          )}
                        </td>

                        {/* Balance Column */}
                        <td style={{ padding: 'var(--space-3)' }}>
                          {editingUserId === u._id ? (
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }}>$</span>
                              <input 
                                type="number" 
                                className="form-input"
                                style={{ padding: '4px 8px 4px 20px', minHeight: 'auto', width: '100px' }}
                                value={editForm.balance}
                                onChange={(e) => setEditForm({...editForm, balance: e.target.value})}
                              />
                            </div>
                          ) : (
                            <span style={{ fontWeight: 600 }}>${u.bankDetails?.balance?.toFixed(2) || '0.00'}</span>
                          )}
                        </td>

                        {/* Actions Column */}
                        <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>
                          {editingUserId === u._id ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={() => saveEdit(u._id)}><Save size={16}/></button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={cancelEdit}><X size={16}/></button>
                            </div>
                          ) : (
                            <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => startEdit(u)} title="Edit details">
                              <Edit3 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Success Modal for Verification */}
      {submitted && (
        <div className="success-overlay" onClick={resetVerificationForm}>
          <div className="success-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div className="success-icon"><CheckCircle2 size={40} /></div>
            <h2 className="success-title">Verification Submitted!</h2>
            <p className="success-message">Results will be sent to <strong style={{ color: 'var(--color-accent-secondary)' }}>{email}</strong>.</p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', margin: 'var(--space-4) 0', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px', background: 'var(--color-surface-hover)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ textAlign: 'center', marginBottom: '8px', fontSize: '14px' }}>Registered Signature</p>
                <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: '8px' }}>
                   {(() => {
                     const targetUser = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());
                     if (targetUser && targetUser.signature) {
                       return <img src={targetUser.signature} alt="Sig" style={{ maxWidth: '100%', maxHeight: '100%' }} />;
                     }
                     return <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>Signature Not Found</span>;
                   })()}
                </div>
              </div>
              <div style={{ flex: '1 1 200px', background: 'var(--color-surface-hover)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ textAlign: 'center', marginBottom: '8px', fontSize: '14px' }}>Uploaded Cheque</p>
                <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: '8px' }}>
                  <img src={preview} alt="Cheque" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                </div>
              </div>
            </div>
            <button className="btn btn-primary btn-full" onClick={resetVerificationForm}>Verify Another</button>
          </div>
        </div>
      )}
    </div>
  );
}
