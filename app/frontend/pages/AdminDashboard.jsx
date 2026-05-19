import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck, LogOut, Upload, Mail, CheckCircle2, X,
  FileImage, AlertCircle, ScanLine, Users, Edit3, Save, Search, LayoutDashboard, History, Activity, TrendingUp, DollarSign
} from 'lucide-react';
import { readFileAsPreview } from '../utils/imageUtils.js';
import ProfileModal from '../features/ProfileModal.jsx';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:5005/api' : '/api');

export default function AdminDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Get user data
  const stored = localStorage.getItem('safesign_user');
  const user = stored ? JSON.parse(stored) : { name: 'Admin' };
  const token = localStorage.getItem('safesign_token');

  const [activeTab, setActiveTab] = useState('verification'); // 'verification' | 'users' | 'monitor'

  // Profile Modal State
  const [currentUser, setCurrentUser] = useState(user);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Verification State
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

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
  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) return;
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.tif', '.tiff', '.webp'];
    const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    if (!selectedFile.type.startsWith('image/') && !allowedExtensions.includes(ext)) {
      alert('Please upload an image file (PNG, JPG, BMP, TIF, etc.).');
      return;
    }
    setFile(selectedFile);
    try {
      const dataUrl = await readFileAsPreview(selectedFile);
      setPreview(dataUrl);
    } catch (err) {
      console.error('Error reading file:', err);
      // Fallback to standard reader
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    }
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

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (!file) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const res = await fetch(`${API_URL}/admin/verify-cheque`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email,
          chequeImageBase64: preview
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.message || 'Failed to verify cheque'}`);
        setIsVerifying(false);
        return;
      }

      console.log('Verification response data:', data);
      setVerificationResult(data);
      setSubmitted(true);

      // Update local history
      const newHistoryItem = {
        verifiedEmail: email,
        verifiedName: data.verifiedName,
        prediction: data.prediction,
        distance: data.distance,
        threshold: data.threshold,
        registeredSignature: data.registeredSignature,
        timestamp: new Date()
      };
      
      const updatedUser = {
        ...currentUser,
        verificationHistory: [...(currentUser.verificationHistory || []), newHistoryItem].slice(-10)
      };
      handleProfileUpdate(updatedUser);
    } catch (err) {
      console.error('Verification error:', err);
      alert('Network error while verifying cheque');
    } finally {
      setIsVerifying(false);
    }
  };

  const resetVerificationForm = () => {
    setEmail('');
    setEmailError('');
    setFile(null);
    setPreview(null);
    setSubmitted(false);
    setVerificationResult(null);
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

  const handleProfileUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('safesign_user', JSON.stringify(updatedUser));
  };

  const verificationHistory = currentUser.verificationHistory || [];

  return (
    <div className="page-wrapper">
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        user={currentUser} 
        onUpdate={handleProfileUpdate} 
      />

      <div className="page-bg">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <Link to="/admin-dashboard" className="navbar-brand">
          <div className="navbar-brand-icon">
            <img src="/logo.png" alt="SafeSign Logo" className="navbar-brand-logo" />
          </div>
          SafeSign <span style={{ fontSize: '12px', background: 'rgba(167, 139, 250, 0.2)', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px', color: 'var(--color-accent-secondary)' }}>Admin</span>
        </Link>
        <div className="navbar-actions">
          <div className="nav-profile" onClick={() => setIsProfileModalOpen(true)}>
            <div className="nav-avatar">{currentUser.name.charAt(0).toUpperCase()}</div>
            <span className="nav-username">{currentUser.name}</span>
          </div>
          <button id="logout-btn" className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)' }}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="home-content" style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border-glass)', paddingBottom: 'var(--space-4)' }}>
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
          <button 
            onClick={() => setActiveTab('monitor')}
            className={`btn ${activeTab === 'monitor' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: 'var(--radius-full)' }}
          >
            <Activity size={18} /> Monitor Transactions
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
                      <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>PNG, JPG, BMP, TIF, TIFF, WEBP</p>
                      <input ref={fileInputRef} type="file" accept="image/*,.tif,.tiff,.bmp" style={{ display: 'none' }} onChange={(e) => handleFileSelect(e.target.files[0])} />
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

            {/* Quick History */}
            <div className="glass-card" style={{ marginTop: 'var(--space-6)', padding: 'var(--space-6)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)', fontSize: '1.1rem' }}>
                <History size={20} className="text-gradient" />
                Recent Verifications
              </h3>
              
              {verificationHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {verificationHistory.slice(0, 5).reverse().map((item, idx) => (
                    <div 
                      key={idx} 
                      className="history-item" 
                      style={{ borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'transform 0.2s' }}
                      onClick={() => {
                        setVerificationResult(item);
                        setSubmitted(true);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{item.verifiedName}</span>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{item.verifiedEmail}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                        <div style={{ textAlign: 'right', marginRight: 'var(--space-2)' }}>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Distance</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent-secondary)' }}>{item.distance?.toFixed(3)}</div>
                        </div>
                        <span className={`status-badge ${item.prediction === 'Genuine' ? 'status-genuine' : 'status-forged'}`}>
                          {item.prediction}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 'var(--space-6)', border: '1px dashed var(--color-border-glass)', borderRadius: 'var(--radius-lg)' }}>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>No recent verifications yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Monitor Transactions */}
        {activeTab === 'monitor' && (
          <div className="animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>TOTAL VOLUME</div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>$1,284,500.00</div>
                <div style={{ color: '#4ade80', fontSize: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={14} /> +12.5% this month
                </div>
              </div>
              <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>ACTIVE TRANSACTIONS</div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>3,421</div>
                <div style={{ color: 'var(--color-accent-secondary)', fontSize: '12px', marginTop: '8px' }}>Real-time monitoring active</div>
              </div>
              <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>SECURITY ALERTS</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#f87171' }}>12</div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginTop: '8px' }}>Requires immediate review</div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <LayoutDashboard size={20} className="text-gradient" />
                Global Transaction Log
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--color-border-glass)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {[
                  { id: 'TX-9012', user: 'John Doe', amount: 450.00, type: 'Transfer', status: 'Completed', time: '2 mins ago' },
                  { id: 'TX-9013', user: 'Alice Smith', amount: 1200.00, type: 'Deposit', status: 'Pending', time: '15 mins ago' },
                  { id: 'TX-9014', user: 'Bob Johnson', amount: 75.20, type: 'Payment', status: 'Completed', time: '45 mins ago' },
                  { id: 'TX-9015', user: 'Sarah Connor', amount: 5000.00, type: 'Transfer', status: 'Flagged', time: '1 hour ago' },
                ].map(tx => (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <DollarSign size={18} style={{ color: tx.status === 'Flagged' ? '#f87171' : 'var(--color-accent-secondary)' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{tx.user}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>ID: {tx.id} • {tx.type}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>${tx.amount.toFixed(2)}</div>
                      <div style={{ fontSize: '11px', color: tx.status === 'Flagged' ? '#f87171' : 'var(--color-text-secondary)' }}>{tx.status} • {tx.time}</div>
                    </div>
                  </div>
                ))}
              </div>
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
            {verificationResult?.prediction === 'Genuine' ? (
              <div className="success-icon" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}><CheckCircle2 size={40} /></div>
            ) : (
              <div className="success-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}><X size={40} /></div>
            )}
            <h2 className="success-title">
              {verificationResult?.prediction === 'Genuine' ? 'Signature Verified (Genuine)' : 'Signature Mismatch (Forged)'}
            </h2>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Verified User: </span>
              <strong style={{ fontSize: '16px', color: 'var(--color-text-primary)' }}>{verificationResult?.verifiedName}</strong>
            </div>
            <p className="success-message">
              Model Distance Score: <strong style={{ color: 'var(--color-accent-secondary)' }}>
                {verificationResult?.distance?.toFixed(4)}
              </strong> (Threshold: {verificationResult?.threshold})
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', margin: 'var(--space-4) 0', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px', background: 'var(--color-surface-hover)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ textAlign: 'center', marginBottom: '8px', fontSize: '14px' }}>Registered Signature</p>
                <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: '8px' }}>
                   {(() => {
                     const sigUrlRaw = verificationResult?.registeredSignature;
                     if (sigUrlRaw) {
                       const sigUrl = sigUrlRaw.replace(/\.(tif|tiff|bmp)$/i, '.png');
                       return <img src={sigUrl} alt="Registered Signature" style={{ maxWidth: '100%', maxHeight: '100%' }} />;
                     }
                     return <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>Signature Not Found</span>;
                   })()}
                </div>
              </div>
              {preview && (
                <div style={{ flex: '1 1 200px', background: 'var(--color-surface-hover)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ textAlign: 'center', marginBottom: '8px', fontSize: '14px' }}>Uploaded Cheque</p>
                  <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: '8px' }}>
                    <img src={preview} alt="Cheque" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                  </div>
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-full" onClick={resetVerificationForm}>
              {preview ? 'Verify Another' : 'Close Result'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
