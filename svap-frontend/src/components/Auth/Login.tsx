import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { AiFillApple } from "react-icons/ai";
import { api } from "../../services/api";
import { supabase } from "../../services/supabase";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpMode, setOtpMode] = useState<'none' | 'email_otp' | 'verify_otp'>('none');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });
      
      if (error) {
        throw new Error(error.message || "Google sign-in failed. Please try again.");
      }
      
      // The auth state change will be handled by the useEffect in App.tsx
      // Keep loading state until redirect happens
    } catch (err: any) {
      setError(err.message || "Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (otpMode === 'email_otp') {
        // Send Email OTP via Custom Backend (Nodemailer)
        const response = await api.sendOtp(email.trim());
        if (response.error) throw new Error(response.error);
        
        setOtpMode('verify_otp');
        setLoading(false);
        return;
      }

      if (otpMode === 'verify_otp') {
        // Verify Email OTP via Custom Backend
        const response = await api.verifyOtp(email.trim(), otp);
        if (response.error) throw new Error(response.error);
        
        const { user } = response;
        if (user) {
          localStorage.setItem("sz_user", JSON.stringify({
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || "User",
            username: `@user_${user.id.substring(0,5)}`,
            city: "Pakistan",
            email: user.email,
            phone: user.phone || null,
            avatar: user.user_metadata?.avatar_url || null
          }));
          window.dispatchEvent(new Event("sz_auth_change"));
          navigate("/");
        }
        setLoading(false);
        return;
      }

      // Existing email/password login
      const response = await api.login({
        email,
        password,
      });

      if (response.error) throw new Error(response.error);

      const { data, profile } = response;

      if (data?.user) {
        localStorage.setItem("sz_user", JSON.stringify({
          id: data.user.id,
          name: profile?.full_name || profile?.username || data.user.email?.split('@')[0] || "User",
          username: profile?.username ? `@${profile.username.replace(/\s+/g, "").toLowerCase()}` : `@${(data.user.email?.split('@')[0] || 'user').replace(/\s+/g, "").toLowerCase()}`,
          city: profile?.city || "Pakistan",
          email: data.user.email,
          avatar: profile?.avatar_url || null,
          phone: profile?.phone || null,
          bio: profile?.bio || "",
        }));
        window.dispatchEvent(new Event("sz_auth_change"));
        navigate("/");
      } else {
        throw new Error("Login succeeded but no user returned. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        <div className="auth-card-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Log In To Your SVAP Account</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">PHONE / EMAIL</label>
            <div className="auth-input-wrap">
              <FiMail className="auth-input-icon" />
              <input
                id="login-email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter phone or email"
                className="auth-input"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {otpMode === 'none' && (
            <div className="auth-field">
              <label className="auth-label">PASSWORD</label>
              <div className="auth-input-wrap">
                <FiLock className="auth-input-icon" />
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="auth-input"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="auth-eye-btn"
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
          )}
          
          {otpMode === 'verify_otp' && (
            <div className="auth-field">
              <label className="auth-label">OTP CODE</label>
              <div className="auth-input-wrap">
                <FiLock className="auth-input-icon" />
                <input
                  id="login-otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="auth-input"
                  required
                />
              </div>
            </div>
          )}

          {otpMode === 'none' && (
            <div className="auth-forgot-row">
              <Link to="/forgot-password" className="auth-forgot-link">Forgot Password?</Link>
              <button type="button" onClick={() => setOtpMode('email_otp')} className="auth-forgot-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                Login with OTP instead
              </button>
            </div>
          )}
          
          {otpMode === 'email_otp' && (
            <div className="auth-forgot-row">
              <button type="button" onClick={() => setOtpMode('none')} className="auth-forgot-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                Login with Password instead
              </button>
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button
            id="login-submit"
            type="submit"
            className="auth-primary-btn"
            disabled={loading}
          >
            {loading ? <span className="auth-spinner" /> : (
              <>
                <span>
                  {otpMode === 'email_otp' ? "SEND OTP" : otpMode === 'verify_otp' ? "VERIFY OTP" : "LOG IN"}
                </span>
                <FiArrowRight />
              </>
            )}
          </button>

          <div className="auth-divider">
            <span className="auth-divider-line" />
            <span className="auth-divider-text">Or Continue With</span>
            <span className="auth-divider-line" />
          </div>

          <div className="auth-social-row">
            <button 
              type="button" 
              className={`auth-social-btn ${googleLoading ? 'loading' : ''}`}
              id="login-google" 
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <>
                  <span className="auth-spinner-small" />
                  <span>REDIRECTING...</span>
                </>
              ) : (
                <>
                  <FcGoogle size={20} />
                  <span>GOOGLE</span>
                </>
              )}
            </button>
        <button type="button" className="auth-social-btn" id="login-apple" disabled>
  <AiFillApple size={20} />
  <span>APPLE</span>
</button>
          </div>
        </form>

        <p className="auth-switch">
          New To SVAP?{" "}
          <Link to="/signup" className="auth-switch-link">Create Account</Link>
        </p>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px 40px;
          position: relative;
          background: var(--bg);
          box-sizing: border-box;
        }

        .auth-bg {
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, #ffffff 0%, #f7f8fa 100%);
          z-index: 0;
        }

        html[data-theme='dark'] .auth-bg {
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
        }

        .auth-bg::before {
          content: '';
          position: absolute;
          top: -180px;
          left: -180px;
          width: 560px;
          height: 560px;
          background: radial-gradient(circle, rgba(228,88,33,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        html[data-theme='dark'] .auth-bg::before {
          background: radial-gradient(circle, rgba(228,88,33,0.08) 0%, transparent 70%);
        }

        .auth-bg::after {
          content: '';
          position: absolute;
          bottom: -160px;
          right: -160px;
          width: 520px;
          height: 520px;
          background: radial-gradient(circle, rgba(96,121,255,0.14) 0%, transparent 70%);
          pointer-events: none;
        }

        html[data-theme='dark'] .auth-bg::after {
          background: radial-gradient(circle, rgba(96,121,255,0.08) 0%, transparent 70%);
        }

        .auth-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 460px;
          background: rgba(255,255,255,0.95);
          border: 1px solid rgba(141,198,63,0.18);
          border-radius: 24px;
          padding: 44px 38px;
          box-shadow: 0 28px 80px rgba(26,46,10,0.08);
        }

        html[data-theme='dark'] .auth-card {
          background: rgba(26, 26, 26, 0.95);
          border: 1px solid rgba(228, 88, 33, 0.15);
          box-shadow: 0 28px 80px rgba(0,0,0,0.4);
        }

        .auth-card-header {
          margin-bottom: 28px;
        }

        .auth-title {
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          font-weight: 800;
          color: var(--text-dark);
          margin: 0 0 10px;
          line-height: 1.05;
        }

        .auth-subtitle {
          font-size: 0.95rem;
          color: var(--text-mid);
          margin: 0;
          letter-spacing: 0.02em;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .auth-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .auth-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .auth-input-icon {
          position: absolute;
          left: 14px;
          color: rgba(26,46,10,0.35);
          font-size: 16px;
          pointer-events: none;
        }

        .auth-input {
          width: 100%;
          background: #f8f9fb;
          border: 1px solid rgba(141,198,63,0.32);
          border-radius: 14px;
          color: var(--text-dark);
          font-size: 0.95rem;
          padding: 14px 44px 14px 42px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        html[data-theme='dark'] .auth-input {
          background: #1a1a1a;
          border: 1px solid rgba(228, 88, 33, 0.25);
          color: #f5f5f5;
        }

        .auth-input::placeholder {
          color: rgba(26,46,10,0.45);
        }

        html[data-theme='dark'] .auth-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .auth-input:focus {
          border-color: var(--svap-lime);
          box-shadow: 0 0 0 4px rgba(141,198,63,0.12);
          background: #fff;
        }

        html[data-theme='dark'] .auth-input:focus {
          background: #0f0f0f;
          border-color: #E45821;
          box-shadow: 0 0 0 4px rgba(228, 88, 33, 0.1);
        }

        .auth-eye-btn {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: rgba(26,46,10,0.45);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.2s;
        }

        .auth-eye-btn:hover {
          color: rgba(26,46,10,0.8);
        }

        .auth-forgot-row {
          display: flex;
          justify-content: flex-end;
          margin-top: -6px;
        }

        .auth-forgot-link {
          font-size: 0.85rem;
          color: var(--text-mid);
          text-decoration: none;
          transition: color 0.2s;
        }

        .auth-forgot-link:hover {
          color: var(--svap-darkblue);
        }

        .auth-error {
          font-size: 0.85rem;
          color: #c04444;
          margin: 0;
          padding: 10px 14px;
          background: rgba(255,107,107,0.12);
          border: 1px solid rgba(255,107,107,0.24);
          border-radius: 10px;
        }

        .auth-primary-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 15px 20px;
          background: var(--btn-cart);
          border: none;
          border-radius: 14px;
          color: #fff;
          background: #E45821;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          margin-top: 4px;
        }

        .auth-primary-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(96,121,255,0.18);
        }

        .auth-primary-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .auth-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: rgba(255,255,255,0.9);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .auth-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(26,46,10,0.3);
          border-top-color: rgba(26,46,10,0.8);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        html[data-theme='dark'] .auth-spinner-small {
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: rgba(255,255,255,0.8);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .auth-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(26,46,10,0.15);
        }

        html[data-theme='dark'] .auth-divider-line {
          background: rgba(255, 255, 255, 0.1);
        }

        .auth-divider-text {
          font-size: 0.78rem;
          color: var(--text-mid);
          white-space: nowrap;
        }

        .auth-social-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .auth-social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 16px;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.18);
          border-radius: 14px;
          color: var(--text-dark);
          font-size: 0.88rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        html[data-theme='dark'] .auth-social-btn {
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #f5f5f5;
        }

        .auth-social-btn:hover {
          background: #f2f8dc;
          transform: translateY(-1px);
        }

        .auth-social-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none !important;
        }

        .auth-social-btn.loading {
          pointer-events: none;
        }

        html[data-theme='dark'] .auth-social-btn:hover {
          background: #2a2a2a;
          transform: translateY(-1px);
        }

        .auth-switch {
          margin: 20px 0 0;
          text-align: center;
          font-size: 0.88rem;
          color: var(--text-mid);
        }

        .auth-switch-link {
          color: var(--text-dark);
          font-weight: 700;
          text-decoration: none;
          transition: color 0.2s;
        }

        .auth-switch-link:hover {
          color: #E45821;
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 32px 24px;
          }
        }

        @media (min-width: 2400px) {
          .auth-card {
            max-width: 520px;
            padding: 52px 48px;
          }
          .auth-title { font-size: 2.4rem; }
          .auth-input { font-size: 1rem; padding: 16px 50px 16px 46px; }
          .auth-primary-btn { padding: 16px; font-size: 1rem; }
          .auth-social-btn { padding: 14px 20px; font-size: 0.88rem; }
        }
      `}</style>
    </div>
  );
};

export default Login;
