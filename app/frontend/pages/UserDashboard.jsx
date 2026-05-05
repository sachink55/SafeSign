import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, LogOut, Wallet, Building2, Clock, CreditCard, 
  ArrowRightLeft, Send, ArrowDownLeft, Scan, History, Eye, X, Info,
  TrendingUp, ArrowUpRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import ProfileModal from '../features/ProfileModal.jsx';

export default function UserDashboard() {
  const navigate = useNavigate();

  // Get user data
  const stored = localStorage.getItem('safesign_user');
  const user = stored ? JSON.parse(stored) : { name: 'User', bankDetails: {} };
  const [currentUser, setCurrentUser] = useState(user);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'send' | 'receive' | 'scan' | 'balance' | 'history'

  const handleLogout = () => {
    localStorage.removeItem('safesign_token');
    localStorage.removeItem('safesign_user');
    navigate('/');
  };

  const handleProfileUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('safesign_user', JSON.stringify(updatedUser));
  };

  const { accountNumber, balance, accountType } = currentUser.bankDetails || {
    accountNumber: 'N/A',
    balance: 0,
    accountType: 'Unknown'
  };

  // Dummy recent transactions
  const transactions = [
    { id: 1, type: 'Credit', amount: 1500.00, date: 'Today, 10:24 AM', desc: 'Salary Deposit' },
    { id: 2, type: 'Debit', amount: 45.50, date: 'Yesterday', desc: 'Grocery Store' },
    { id: 3, type: 'Debit', amount: 120.00, date: 'Oct 15', desc: 'Electric Bill' },
    { id: 4, type: 'Credit', amount: 300.00, date: 'Oct 12', desc: 'Transfer from Savings' },
  ];

  return (
    <div className="page-wrapper">
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        user={currentUser} 
        onUpdate={handleProfileUpdate} 
      />

      {/* Dummy Action Modals */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
             <div className="modal-header">
                <h3 className="modal-title">
                  {activeModal === 'send' && <><Send className="text-gradient" /> Send Money</>}
                  {activeModal === 'receive' && <><ArrowDownLeft className="text-gradient" /> Receive Money</>}
                  {activeModal === 'scan' && <><Scan className="text-gradient" /> Scan to Pay</>}
                  {activeModal === 'balance' && <><Wallet className="text-gradient" /> Balance Details</>}
                  {activeModal === 'history' && <><History className="text-gradient" /> Transaction History</>}
                </h3>
                <button className="btn-close" onClick={() => setActiveModal(null)}><X size={20}/></button>
             </div>
             <div className="modal-body" style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-6)' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(167, 139, 250, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)', color: 'var(--color-accent-secondary)' }}>
                   <Info size={32} />
                </div>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                   This is a demonstration of the <strong>{activeModal.toUpperCase()}</strong> feature. In a production environment, this would initiate a secure banking transaction.
                </p>
                <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border-glass)' }}>
                   <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Security Check: <span style={{ color: '#4ade80' }}>Active</span></p>
                </div>
             </div>
             <div className="modal-footer">
                <button className="btn btn-primary btn-full" onClick={() => setActiveModal(null)}>Close Preview</button>
             </div>
          </div>
        </div>
      )}

      <div className="page-bg">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <Link to="/user-dashboard" className="navbar-brand">
          <div className="navbar-brand-icon">
            <img src="/logo.png" alt="SafeSign Logo" className="navbar-brand-logo" />
          </div>
          SafeSign Banking
        </Link>
        <div className="navbar-actions">
          <div className="nav-profile" onClick={() => setIsProfileModalOpen(true)}>
            <div className="nav-avatar">{currentUser.name.charAt(0).toUpperCase()}</div>
            <span className="nav-username">{currentUser.name}</span>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)' }}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>

      <div className="home-content" style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto' }}>
        <div className="home-greeting">
          <h1 className="home-greeting-text">
            Welcome back, <span className="text-gradient">{currentUser.name.split(' ')[0]}</span>
          </h1>
          <p className="home-greeting-sub">Manage your finances with AI-powered security.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          {/* Balance Card */}
          <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                <Wallet size={20} />
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Balance</span>
              </div>
              <div style={{ padding: '4px 8px', background: 'rgba(167, 139, 250, 0.1)', color: 'var(--color-accent-secondary)', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                {accountType}
              </div>
            </div>
            
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 var(--space-4) 0', color: 'var(--color-text-primary)' }}>
              ${typeof balance === 'number' ? balance.toFixed(2) : balance}
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-surface-hover)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <Building2 size={18} style={{ color: 'var(--color-text-secondary)' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Account Number</span>
                <span style={{ fontSize: '14px', fontFamily: 'monospace', letterSpacing: '1px' }}>{accountNumber}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
              <TrendingUp size={20} className="text-gradient" /> Quick Operations
            </h3>
            <div className="action-grid">
              <div className="action-card" onClick={() => setActiveModal('send')}>
                <div className="action-card-icon"><Send size={20} /></div>
                <span className="action-card-text">Send</span>
              </div>
              <div className="action-card" onClick={() => setActiveModal('receive')}>
                <div className="action-card-icon"><ArrowDownLeft size={20} /></div>
                <span className="action-card-text">Receive</span>
              </div>
              <div className="action-card" onClick={() => setActiveModal('scan')}>
                <div className="action-card-icon"><Scan size={20} /></div>
                <span className="action-card-text">Scan</span>
              </div>
              <div className="action-card" onClick={() => setActiveModal('balance')}>
                <div className="action-card-icon"><Wallet size={20} /></div>
                <span className="action-card-text">Balance</span>
              </div>
              <div className="action-card" onClick={() => setActiveModal('history')}>
                <div className="action-card-icon"><History size={20} /></div>
                <span className="action-card-text">History</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-4)' }}>Recent Transactions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {transactions.map((tx) => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', background: 'var(--color-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', 
                    background: tx.type === 'Credit' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: tx.type === 'Credit' ? '#10b981' : '#ef4444'
                  }}>
                    <ArrowRightLeft size={18} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 500 }}>{tx.desc}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>{tx.date}</p>
                  </div>
                </div>
                <div style={{ fontWeight: 600, color: tx.type === 'Credit' ? '#10b981' : 'var(--color-text-primary)' }}>
                  {tx.type === 'Credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
