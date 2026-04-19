import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, LogOut, Wallet, Building2, Clock, CreditCard, ArrowRightLeft } from 'lucide-react';

export default function UserDashboard() {
  const navigate = useNavigate();

  // Get user data
  const stored = localStorage.getItem('safesign_user');
  const user = stored ? JSON.parse(stored) : { name: 'User', bankDetails: {} };

  const handleLogout = () => {
    localStorage.removeItem('safesign_token');
    localStorage.removeItem('safesign_user');
    navigate('/');
  };

  const { accountNumber, balance, accountType } = user.bankDetails || {
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
      <div className="page-bg">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <Link to="/user-dashboard" className="navbar-brand">
          <div className="navbar-brand-icon">
            <ShieldCheck size={20} />
          </div>
          SafeSign Banking
        </Link>
        <div className="navbar-actions">
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {user.name}
          </span>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 16px', fontSize: 'var(--font-size-sm)' }}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>

      <div className="home-content" style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', paddingTop: '40px' }}>
        <div className="home-greeting">
          <h1 className="home-greeting-text">
            Welcome, <span style={{ color: 'var(--color-accent-secondary)' }}>{user.name.split(' ')[0]}</span>
          </h1>
          <p className="home-greeting-sub">Your personal banking dashboard</p>
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
            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={20} /> Quick Actions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <button className="btn btn-secondary" style={{ display: 'flex', flexDirection: 'column', padding: 'var(--space-4)', gap: 'var(--space-2)' }}>
                <ArrowRightLeft size={20} />
                Transfer
              </button>
              <button className="btn btn-secondary" style={{ display: 'flex', flexDirection: 'column', padding: 'var(--space-4)', gap: 'var(--space-2)' }}>
                <Clock size={20} />
                History
              </button>
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
