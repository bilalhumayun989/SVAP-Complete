import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FiEye, FiEyeOff, FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { AiFillApple } from "react-icons/ai";
import { api } from "../../services/api";
import { supabase } from "../../services/supabase";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpMode, setOtpMode] = useState<'none' | 'email_otp' | 'verify_otp'>('none');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Check for signup success message
  useEffect(() => {
    const state = location.state as { message?: string; email?: string } | null;
    if (state?.message) {
      setSuccessMessage(state.message);
      if (state.email) {
        setEmail(state.email);
      }
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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
      
      if (error) throw new Error(error.message || "Google sign-in failed.");
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
        const response = await api.sendOtp(email.trim());
        if (response.error) throw new Error(response.error);
        setOtpMode('verify_otp');
        setLoading(false);
        return;
      }

      if (otpMode === 'verify_otp') {
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

      // Use Supabase directly so a real persistent session is created
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw new Error(authError.message);

      if (!authData?.user) {
        throw new Error("Login succeeded but no user returned.");
      }
      // onAuthStateChange (SIGNED_IN) in App.tsx handles:
      // 1. Profile fetch/create
      // 2. localStorage sz_user set
      // 3. navigate("/")
      // So we do nothing here — it will fire automatically.
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="svap-auth-page">
      <div className="svap-card">
        {/* Top Nav (Back Button) */}
        <div className="svap-top-nav">
          <button onClick={() => navigate(-1)} className="svap-back-btn" aria-label="Go Back">
            <FiArrowLeft size={22} />
          </button>
        </div>

        {/* Brand Header */}
        <div className="svap-brand">
          <img src="/Logo.png" alt="SVAP" className="svap-logo" />
          <p className="svap-tagline">Skip the Spend. Svap Instead</p>
        </div>

        {/* Title */}
        <div className="svap-header">
          <h1 className="svap-title">Welcome Back</h1>
          <p className="svap-subtitle">Log In To Your Svap Account</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="svap-success-banner">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
              <path d="M6 10l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>{successMessage}</p>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleLogin} className="svap-form">
          <div className="svap-field">
            <label className="svap-label">PHONE / EMAIL</label>
            <input
              id="login-email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. you@example.com"
              className="svap-input"
              autoComplete="email"
              required
            />
          </div>

          {otpMode === 'none' && (
            <div className="svap-field">
              <label className="svap-label">PASSWORD</label>
              <div className="svap-input-relative">
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="svap-input"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="svap-toggle-pass"
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>

              {/* OTP and Forgot Links Row */}
              <div className="svap-options-row">
                <button
                  type="button"
                  onClick={() => setOtpMode('email_otp')}
                  className="svap-otp-toggle"
                >
                  Use OTP instead
                </button>
                <Link to="/forgot-password" className="svap-forgot-link">
                  Forgot Password?
                </Link>
              </div>
            </div>
          )}

          {otpMode === 'email_otp' && (
            <div className="svap-options-row">
              <button
                type="button"
                onClick={() => setOtpMode('none')}
                className="svap-otp-toggle"
              >
                Use Password instead
              </button>
            </div>
          )}

          {otpMode === 'verify_otp' && (
            <div className="svap-field">
              <label className="svap-label">OTP CODE</label>
              <input
                id="login-otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                className="svap-input"
                required
              />
              <div className="svap-options-row">
                <button
                  type="button"
                  onClick={() => setOtpMode('none')}
                  className="svap-otp-toggle"
                >
                  Back to Password Login
                </button>
              </div>
            </div>
          )}

          {error && <p className="svap-error">{error}</p>}

          <button
            id="login-submit"
            type="submit"
            className="svap-btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span className="svap-spinner" />
            ) : (
              <>
                <span>
                  {otpMode === 'email_otp' ? "SEND CODE" : otpMode === 'verify_otp' ? "VERIFY CODE" : "LOG IN"}
                </span>
                <FiArrowRight size={18} />
              </>
            )}
          </button>

          {/* Or Divider */}
          <div className="svap-divider">
            <span className="svap-line" />
            <span className="svap-divider-text">Or Continue With</span>
            <span className="svap-line" />
          </div>

          {/* Social Logins */}
          <div className="svap-social-grid">
            <button 
              type="button" 
              className="svap-btn-social"
              id="login-google" 
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <span className="svap-spinner-sm" />
              ) : (
                <>
                  <FcGoogle size={18} />
                  <span>GOOGLE</span>
                </>
              )}
            </button>
            <button type="button" className="svap-btn-social svap-btn-apple" id="login-apple" disabled>
              <AiFillApple size={18} className="svap-apple-icon" />
              <span>APPLE</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="svap-footer-text">
          New To Svap?{" "}
          <Link to="/signup" className="svap-footer-link">Create Account</Link>
        </p>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Color Scheme Variables */
        .svap-auth-page {
          --bg-main: #f8f9fa;
          --text-main: #121212;
          --text-muted: #6c757d;
          --text-label: #495057;
          --input-bg: #ffffff;
          --input-bg-focus: #ffffff;
          --input-border: #e2e8f0;
          --input-placeholder: #a0aec0;
          --divider-line: #e2e8f0;
          --social-bg: #ffffff;
          --social-bg-hover: #f1f5f9;
          --apple-icon-color: #000000;
        }

        html[data-theme='dark'] .svap-auth-page {
          --bg-main: #000000;
          --text-main: #ffffff;
          --text-muted: rgba(255, 255, 255, 0.5);
          --text-label: rgba(255, 255, 255, 0.65);
          --input-bg: #18191c;
          --input-bg-focus: #1d1e22;
          --input-border: rgba(255, 255, 255, 0.08);
          --input-placeholder: rgba(255, 255, 255, 0.25);
          --divider-line: rgba(255, 87, 34, 0.25);
          --social-bg: #18191c;
          --social-bg-hover: #202226;
          --apple-icon-color: #ffffff;
        }

        .svap-auth-page {
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          background-color: var(--bg-main);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
          color: var(--text-main);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .svap-card {
          width: 100%;
          max-width: 440px;
          min-height: calc(100dvh - 48px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .svap-top-nav {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .svap-back-btn, .svap-theme-btn {
          background: transparent;
          border: none;
          color: var(--text-main);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 50%;
          transition: opacity 0.2s, background-color 0.2s;
        }

        .svap-back-btn:hover, .svap-theme-btn:hover {
          opacity: 0.8;
          background-color: rgba(128, 128, 128, 0.1);
        }

        .svap-brand {
          text-align: center;
          margin-bottom: 24px;
        }

        .svap-logo {
          max-width: 160px;
          height: auto;
          margin-bottom: 6px;
          display: inline-block;
        }

        .svap-tagline {
          color: var(--text-muted);
          font-size: 0.88rem;
        }

        .svap-header {
          text-align: left;
          margin-bottom: 20px;
        }

        .svap-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 4px;
          letter-spacing: -0.3px;
        }

        .svap-subtitle {
          font-size: 0.92rem;
          color: var(--text-muted);
        }

        .svap-success-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 12px;
          margin-bottom: 20px;
          color: #22c55e;
        }
        
        html[data-theme='dark'] .svap-success-banner {
          background: rgba(34, 197, 94, 0.15);
          border-color: rgba(34, 197, 94, 0.4);
        }

        .svap-success-banner svg {
          flex-shrink: 0;
        }

        .svap-success-banner p {
          margin: 0;
          font-size: 0.88rem;
          font-weight: 600;
          line-height: 1.4;
          color: inherit;
        }

        .svap-form {
          display: flex;
          flex-direction: column;
          gap: 30px;
          flex: 1;
          justify-content: center;
        }

        .svap-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .svap-label {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.8px;
          color: var(--text-label);
          text-transform: uppercase;
        }

        .svap-input-relative {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }

        .svap-input {
          width: 100%;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: 14px;
          color: var(--text-main);
          font-size: 0.98rem;
          padding: 16px 48px 16px 18px;
          outline: none;
          transition: border-color 0.2s, background 0.2s, color 0.2s;
        }

        .svap-input::placeholder {
          color: var(--input-placeholder);
        }

        .svap-input:focus {
          border-color: #E85D35;
          background: var(--input-bg-focus);
        }

        .svap-toggle-pass {
          position: absolute;
          right: 16px;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .svap-toggle-pass:hover {
          color: var(--text-main);
        }

        .svap-options-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 6px;
          font-size: 0.85rem;
        }

        .svap-otp-toggle {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0;
          font-size: 0.85rem;
          transition: color 0.2s;
        }

        .svap-otp-toggle:hover {
          color: var(--text-main);
          text-decoration: underline;
        }

        .svap-forgot-link {
          color: #4a80db;
          text-decoration: none;
          transition: color 0.2s;
        }

        .svap-forgot-link:hover {
          text-decoration: underline;
        }

        .svap-error {
          font-size: 0.82rem;
          color: #ff5555;
          background: rgba(255, 85, 85, 0.1);
          border: 1px solid rgba(255, 85, 85, 0.2);
          border-radius: 8px;
          padding: 10px 14px;
        }

        .svap-btn-primary {
          width: 100%;
          padding: 16px;
          background: #E85D35;
          border: none;
          border-radius: 30px;
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
          transition: background 0.2s, opacity 0.2s;
        }

        .svap-btn-primary:hover:not(:disabled) {
          background: #f2663d;
        }

        .svap-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .svap-divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 10px 0;
        }

        .svap-line {
          flex: 1;
          height: 1px;
          background: var(--divider-line);
        }

        .svap-divider-text {
          font-size: 0.8rem;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .svap-social-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .svap-btn-social {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          background: var(--social-bg);
          border: 1px solid var(--input-border);
          border-radius: 14px;
          color: var(--text-main);
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.6px;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        .svap-btn-social:hover:not(:disabled) {
          background: var(--social-bg-hover);
        }

        .svap-btn-social:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .svap-apple-icon {
          color: var(--apple-icon-color);
        }

        .svap-footer-text {
          text-align: center;
          margin-top: auto;
          padding-top: 24px;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .svap-footer-link {
          color: var(--text-main);
          font-weight: 700;
          text-decoration: none;
          margin-left: 4px;
        }

        .svap-footer-link:hover {
          color: #E85D35;
        }

        .svap-spinner, .svap-spinner-sm {
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: svapSpin 0.6s linear infinite;
        }

        .svap-spinner {
          width: 18px;
          height: 18px;
        }

        .svap-spinner-sm {
          width: 14px;
          height: 14px;
        }

        @keyframes svapSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;