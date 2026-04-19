import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ScanLine, FileCheck, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper">
      {/* Background Orbs */}
      <div className="page-bg">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <div className="content-wrapper" style={{ flexDirection: 'column', paddingTop: '120px' }}>
        <div className="landing-hero">
          {/* Badge */}
          <div className="landing-badge">
            <Sparkles size={14} />
            <span>AI-Powered Cheque Verification</span>
          </div>

          {/* Title */}
          <h1 className="landing-title">
            Verify Cheques with{' '}
            <span className="landing-title-gradient">SafeSign</span>
          </h1>

          {/* Subtitle */}
          <p className="landing-subtitle">
            Protect your finances with our advanced signature matching technology. 
            Upload, verify, and secure your cheques in seconds with military-grade accuracy.
          </p>

          {/* Buttons */}
          <div className="landing-buttons">
            <button
              id="landing-register-btn"
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/register')}
            >
              <ShieldCheck size={20} />
              Create Account
            </button>
            <button
              id="landing-login-btn"
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>

          {/* Features */}
          <div className="landing-features">
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <ScanLine size={24} />
              </div>
              <h3 className="landing-feature-title">Smart Scanning</h3>
              <p className="landing-feature-desc">
                Upload cheque images and let our AI extract and analyze signature patterns instantly.
              </p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <ShieldCheck size={24} />
              </div>
              <h3 className="landing-feature-title">Signature Match</h3>
              <p className="landing-feature-desc">
                Compare cheque signatures against your registered signature with high precision.
              </p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <FileCheck size={24} />
              </div>
              <h3 className="landing-feature-title">Instant Results</h3>
              <p className="landing-feature-desc">
                Get real-time verification results delivered to your email for your records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
