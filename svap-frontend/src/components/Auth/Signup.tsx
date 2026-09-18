import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiEye, FiEyeOff, FiMail, FiArrowRight, FiArrowLeft, FiSun, FiMoon } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { api } from "../../services/api";
import { supabase } from "../../services/supabase";

type Step = "form" | "otp";

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [showLoginRedirect, setShowLoginRedirect] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (k: string, v: string) => {
    setError("");
    setShowLoginRedirect(false);
    setForm((f) => ({ ...f, [k]: v }));
  };

  const isDuplicateEmailError = (message = "") => /already registered|Google se registered/i.test(message);
  const goToLogin = () => navigate('/login');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.username.trim()) return setError("Username is required");
    if (!form.email.trim()) return setError("Email is required");
    if (!form.phone.trim()) return setError("Phone number is required");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");

    setLoading(true);
    try {
      const res = await api.sendOtp(form.email);
      if (res.error) throw new Error(res.error);
      setStep("otp");
      setResendTimer(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      const message = err.message || "Failed to send OTP";
      setError(message);
      setShowLoginRedirect(isDuplicateEmailError(message));
      if (!isDuplicateEmailError(message)) {
        setStep("form");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value.slice(-1);
    setOtpDigits(next);
    setError("");
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const otp = otpDigits.join("");
    if (otp.length < 6) return setError("Please enter the complete 6-digit OTP");

    setLoading(true);
    try {
      const otpRes = await api.verifyOtp(form.email, otp);
      if (otpRes.error) throw new Error(otpRes.error);

      const userId = otpRes.user?.id;
      const userEmail = form.email;

      if (!userId) throw new Error("Verification failed. Please try again.");

      await api.signup({
        email: userEmail,
        password: form.password,
        username: form.username,
        phone: form.phone,
      }).catch(() => {});

      try {
        await api.updateProfile(userId, {
          username: form.username,
          phone: form.phone,
          full_name: form.username,
        });
      } catch {}

      if (otpRes.session?.access_token) {
        const { supabase: sb } = await import("../../services/supabase");
        await sb.auth.setSession({
          access_token: otpRes.session.access_token,
          refresh_token: otpRes.session.refresh_token,
        });
      }

      localStorage.setItem(
        "sz_user",
        JSON.stringify({
          id: userId,
          name: form.username,
          username: "@" + form.username.replace(/\s+/g, "").toLowerCase(),
          email: userEmail,
          phone: form.phone,
        })
      );
      window.dispatchEvent(new Event("sz_auth_change"));
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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

      if (error) throw new Error(error.message || "Google sign-up failed. Please try again.");
    } catch (err: any) {
      setError(err.message || "Google sign-up failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.sendOtp(form.email);
      if (res.error) throw new Error(res.error);
      setOtpDigits(["", "", "", "", "", ""]);
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      const message = err.message || "Failed to resend OTP";
      setError(message);
      setShowLoginRedirect(isDuplicateEmailError(message));
      if (!isDuplicateEmailError(message)) {
        setStep("form");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={isDarkMode ? "dark-auth-page" : "dark-auth-page light-mode"}>
      <div className="dark-auth-card">
        {/* Theme toggle button */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={() => setIsDarkMode(!isDarkMode)}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>
        
        {step === "form" && (
          <>
            <div>
              <button 
                type="button" 
                className="dark-home-back-btn" 
                onClick={() => navigate('/')} 
                aria-label="Go to Home"
              >
                <FiArrowLeft size={24} />
              </button>

              <h1 className="dark-auth-title">Create Account</h1>
              <p className="dark-auth-subtitle">Join the Svap Community</p>
            </div>

            <form onSubmit={handleSendOtp} className="dark-auth-form" noValidate>
              <div className="dark-field">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="EMAIL"
                  className="dark-input"
                />
              </div>

              <div className="dark-field">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="PHONE NUMBER"
                  className="dark-input"
                />
              </div>

              <div className="dark-field">
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  placeholder="USERNAME"
                  className="dark-input"
                />
                <span className="dark-field-hint">
                  3–20 characters · letters, numbers and underscores only · no spaces
                </span>
              </div>

              <div className="dark-field">
                <div className="dark-input-wrap">
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="PASSWORD"
                    className="dark-input"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="dark-eye-btn">
                    {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="dark-field">
                <div className="dark-input-wrap">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    placeholder="CONFIRM PASSWORD"
                    className="dark-input"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="dark-eye-btn">
                    {showConfirmPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              {error && <p className="dark-error">{error}</p>}

              {showLoginRedirect ? (
                <button type="button" className="dark-primary-btn" onClick={goToLogin}>
                  <span className="btn-icon-wrap"><FiArrowRight /></span>
                  <span>Login karein</span>
                </button>
              ) : (
                <button type="submit" className="dark-primary-btn" disabled={loading}>
                  {loading ? (
                    <span className="dark-spinner" />
                  ) : (
                    <>
                      <span className="btn-icon-wrap"><FiArrowRight /></span>
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              )}

              <div className="dark-divider">
                <span className="dark-divider-line" />
                <span className="dark-divider-text">Or</span>
                <span className="dark-divider-line" />
              </div>

              <button
                type="button"
                className={`dark-social-btn ${googleLoading ? "loading" : ""}`}
                onClick={handleGoogleSignup}
                disabled={googleLoading || loading}
              >
                {googleLoading ? (
                  <>
                    <span className="dark-spinner-small" />
                    <span>REDIRECTING...</span>
                  </>
                ) : (
                  <>
                    <FcGoogle size={20} />
                    <span>GOOGLE</span>
                  </>
                )}
              </button>
            </form>

            <p className="dark-switch">
              Already Have An Account?{" "}
              <Link to="/login" className="dark-switch-link">Log In</Link>
            </p>
          </>
        )}

        {step === "otp" && (
          <div className="dark-otp-container">
            <div>
              <button className="dark-back-btn" onClick={() => { setStep("form"); setError(""); }}>
                <FiArrowLeft size={18} style={{ marginRight: "6px" }} /> Back
              </button>

              <div className="dark-otp-icon">
                <FiMail size={24} />
              </div>
              <h1 className="dark-auth-title">Verify Email</h1>
              <p className="dark-auth-subtitle">
                We sent a 6-digit code to<br />
                <strong style={{ color: "#fff" }}>{form.email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyAndSignup} className="dark-auth-form" noValidate>
              <div className="dark-otp-row" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`dark-otp-box ${digit ? "filled" : ""}`}
                  />
                ))}
              </div>

              {error && <p className="dark-error">{error}</p>}

              <button type="submit" className="dark-primary-btn" disabled={loading}>
                {loading ? (
                  <span className="dark-spinner" />
                ) : (
                  <>
                    <span className="btn-icon-wrap"><FiArrowRight /></span>
                    <span>Verify &amp; Create Account</span>
                  </>
                )}
              </button>
            </form>

            <div className="dark-resend">
              {resendTimer > 0 ? (
                <span className="dark-resend-timer">Resend code in {resendTimer}s</span>
              ) : (
                <button className="dark-resend-btn" onClick={handleResend} disabled={loading}>
                  Resend Code
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .dark-auth-page {
          --bg-main: #000000;
          --text-main: #ffffff;
          --text-muted: #8e8e93;
          --text-label: rgba(255, 255, 255, 0.65);
          --input-bg: #1c1c1e;
          --input-bg-focus: #2c2c2e;
          --input-border: transparent;
          --input-placeholder: #636366;
          --btn-bg: #E45821;
          --btn-text: #ffffff;
          --social-bg: #1c1c1e;
          --social-bg-hover: #2c2c2e;
          --link-color: #E45821;
        }

        .dark-auth-page.light-mode {
          --bg-main: #f8f9fa;
          --text-main: #121212;
          --text-muted: #6c757d;
          --text-label: #495057;
          --input-bg: #ffffff;
          --input-bg-focus: #ffffff;
          --input-border: #e2e8f0;
          --input-placeholder: #a0aec0;
          --btn-bg: #E45821;
          --btn-text: #ffffff;
          --social-bg: #ffffff;
          --social-bg-hover: #f1f5f9;
          --link-color: #E45821;
        }

        .dark-auth-page {
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
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .dark-auth-card {
          width: 100%;
          max-width: 440px;
          min-height: calc(100dvh - 48px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .dark-home-back-btn {
          background: none;
          border: none;
          color: var(--text-main);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          margin-bottom: 16px;
          transition: opacity 0.2s;
        }

        .dark-home-back-btn:hover {
          opacity: 0.8;
        }

        .dark-auth-title {
          color: var(--text-main);
          font-size: 2rem;
          font-weight: 800;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }

        .dark-auth-subtitle {
          color: var(--text-muted);
          font-size: 0.92rem;
          margin: 0 0 20px 0;
          font-weight: 400;
        }

        .dark-auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
          justify-content: center;
        }

        .dark-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .dark-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .dark-input {
          width: 100%;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: 16px;
          color: var(--text-main);
          font-size: 0.88rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          padding: 16px 48px 16px 18px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }

        .dark-input::placeholder {
          color: var(--input-placeholder);
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .dark-input:focus {
          background: #242426;
          border-color: #3a3a3c;
        }

        .dark-eye-btn {
          position: absolute;
          right: 18px;
          background: none;
          border: none;
          color: #8e8e93;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .dark-field-hint {
          color: #636366;
          font-size: 0.72rem;
          line-height: 1.3;
          padding: 0 4px;
        }

        .dark-switch {
          text-align: center;
          color: #8e8e93;
          font-size: 0.9rem;
          margin-top: auto;
          padding-top: 20px;
        }

        .dark-switch-link {
          color: #ffffff;
          font-weight: 700;
          text-decoration: none;
          margin-left: 4px;
        }

        .dark-switch-link:hover {
          color: #f26539;
        }

        .dark-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 4px 0;
        }

        .dark-divider-line {
          flex: 1;
          height: 1px;
          background: #2c2c2e;
        }

        .dark-divider-text {
          color: #636366;
          font-size: 0.85rem;
        }

        .dark-social-btn {
          width: 100%;
          background: #1c1c1e;
          border: none;
          border-radius: 16px;
          color: #ffffff;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .dark-social-btn:hover:not(:disabled) {
          background: #2c2c2e;
        }

        .dark-social-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .dark-primary-btn {
          width: 100%;
          background: #f26539;
          border: none;
          border-radius: 30px;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 700;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          margin-top: 6px;
          transition: transform 0.2s, background 0.2s;
        }

        .dark-primary-btn:hover:not(:disabled) {
          background: #e05528;
          transform: translateY(-1px);
        }

        .dark-primary-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-icon-wrap {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 1.1rem;
        }

        .dark-error {
          color: #ff453a;
          font-size: 0.8rem;
          text-align: center;
          margin: 0;
          padding: 10px 14px;
          background: rgba(255, 69, 58, 0.1);
          border-radius: 10px;
        }

        /* OTP View Styling */
        .dark-otp-container {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: calc(100dvh - 48px);
          width: 100%;
        }

        .dark-back-btn {
          background: none;
          border: none;
          color: #8e8e93;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin-bottom: 20px;
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
        }

        .dark-otp-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(242, 101, 57, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f26539;
          margin-bottom: 16px;
        }

        .dark-otp-row {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin: 16px 0;
        }

        .dark-otp-box {
          width: 48px;
          height: 56px;
          text-align: center;
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
          background: #1c1c1e;
          border: 1px solid transparent;
          border-radius: 14px;
          outline: none;
        }

        .dark-otp-box:focus {
          border-color: #f26539;
        }

        .dark-otp-box.filled {
          border-color: #f26539;
          background: rgba(242, 101, 57, 0.1);
        }

        .dark-resend {
          text-align: center;
          margin-top: auto;
          padding-top: 20px;
        }

        .dark-resend-timer {
          font-size: 0.85rem;
          color: #8e8e93;
        }

        .dark-resend-btn {
          background: none;
          border: none;
          color: #f26539;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
        }

        .dark-spinner, .dark-spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .dark-auth-title { font-size: 1.75rem; }
          .dark-otp-box { width: 42px; height: 50px; }
        }
      `}</style>
    </div>
  );
};

export default Signup;