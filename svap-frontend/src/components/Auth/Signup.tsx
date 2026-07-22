import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff, FiMail, FiPhone } from "react-icons/fi";
import { api } from "../../services/api";

type Step = "form" | "otp";

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (k: string, v: string) => {
    setError("");
    setForm((f) => ({ ...f, [k]: v }));
  };

  // ── STEP 1: Send OTP ───────────────────────────────────────────────────────
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
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handlers ─────────────────────────────────────────────────────
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

  // ── STEP 2: Verify OTP + Create Account ───────────────────────────────────
  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const otp = otpDigits.join("");
    if (otp.length < 6) return setError("Please enter the complete 6-digit OTP");

    setLoading(true);
    try {
      // 1. Verify OTP
      const otpRes = await api.verifyOtp(form.email, otp);
      if (otpRes.error) throw new Error(otpRes.error);

      // 2. Create account
      const signupRes = await api.signup({
        email: form.email,
        password: form.password,
        username: form.username,
        phone: form.phone,
      });
      if (signupRes.error) throw new Error(signupRes.error);

      const { data } = signupRes;
      if (data?.user?.identities && data.user.identities.length === 0) {
        throw new Error("This email is already registered. Please log in instead.");
      }

      if (data?.user) {
        localStorage.setItem(
          "sz_user",
          JSON.stringify({
            id: data.user.id,
            username: "@" + form.username,
            email: form.email,
          })
        );
        window.dispatchEvent(new Event("sz_auth_change"));
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
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
      setError(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-right">
        <div className="auth-card signup-card">

          {/* ── STEP 1: Registration Form ── */}
          {step === "form" && (
            <>
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">Join 50,000+ Swappers Across Pakistan</p>

              <form onSubmit={handleSendOtp} className="auth-form" noValidate>
                <div className="auth-field">
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><FiUser /></span>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => handleChange("username", e.target.value)}
                      placeholder="Username"
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><FiMail /></span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="Email Address"
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><FiPhone /></span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="Phone Number e.g. 03001234567"
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><FiLock /></span>
                    <input
                      type={showPass ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      placeholder="Password"
                      className="auth-input"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="auth-eye-btn">
                      {showPass ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="auth-field">
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><FiLock /></span>
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      placeholder="Confirm Password"
                      className="auth-input"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="auth-eye-btn">
                      {showConfirmPass ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {error && <p className="auth-error">{error}</p>}

                <button type="submit" className="auth-primary-btn" disabled={loading}>
                  {loading ? <span className="auth-spinner" /> : <span>Send Verification Code</span>}
                </button>
              </form>

              <p className="auth-switch">
                Already Have An Account?{" "}
                <Link to="/login" className="auth-switch-link">Log In</Link>
              </p>
            </>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === "otp" && (
            <>
              <button className="auth-back-btn" onClick={() => { setStep("form"); setError(""); }}>
                ← Back
              </button>

              <div className="auth-otp-icon">
                <FiMail size={28} />
              </div>
              <h1 className="auth-title">Verify Email</h1>
              <p className="auth-subtitle">
                We sent a 6-digit code to<br />
                <strong style={{ color: "#fff" }}>{form.email}</strong>
              </p>

              <form onSubmit={handleVerifyAndSignup} className="auth-form" noValidate>
                <div className="auth-otp-row" onPaste={handleOtpPaste}>
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
                      className={`auth-otp-box ${digit ? "auth-otp-box--filled" : ""}`}
                    />
                  ))}
                </div>

                {error && <p className="auth-error">{error}</p>}

                <button type="submit" className="auth-primary-btn" disabled={loading}>
                  {loading ? <span className="auth-spinner" /> : <span>Verify &amp; Create Account</span>}
                </button>
              </form>

              <div className="auth-resend">
                {resendTimer > 0 ? (
                  <span className="auth-resend-timer">Resend code in {resendTimer}s</span>
                ) : (
                  <button className="auth-resend-btn" onClick={handleResend} disabled={loading}>
                    Resend Code
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          box-sizing: border-box;
          padding: 40px 20px;
          position: relative;
        }

        .auth-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 24px;
          box-sizing: border-box;
          position: relative;
          z-index: 1;
        }

        /* Same gradient background as Login */
        .auth-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, rgba(252,255,245,1) 0%, rgba(239,248,220,1) 100%);
          z-index: 0;
          pointer-events: none;
        }
        html[data-theme='dark'] .auth-page::before {
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.95);
          border: 1px solid rgba(141,198,63,0.18);
          border-radius: 20px;
          padding: 36px 28px;
          box-sizing: border-box;
          box-shadow: 0 28px 80px rgba(26,46,10,0.08);
        }

        html[data-theme='dark'] .auth-card {
          background: rgba(26, 26, 26, 0.95);
          border: 1px solid rgba(228, 88, 33, 0.15);
          box-shadow: 0 28px 80px rgba(0,0,0,0.4);
        }

        .auth-back-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin-bottom: 20px;
          display: block;
          transition: color 0.2s;
        }
        .auth-back-btn:hover { color: var(--text-dark); }

        .auth-otp-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(228,88,33,0.12);
          border: 1px solid rgba(228,88,33,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #E45821;
          margin-bottom: 16px;
        }

        .auth-title {
          color: var(--text-dark);
          font-size: 1.7rem;
          font-weight: 800;
          margin: 0 0 6px;
        }

        .auth-subtitle {
          color: var(--text-muted);
          font-size: 0.85rem;
          margin: 0 0 26px;
          line-height: 1.6;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
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
          display: flex;
          align-items: center;
        }
        html[data-theme='dark'] .auth-input-icon {
          color: rgba(255,255,255,0.35);
        }

        .auth-input {
          width: 100%;
          background: #f2f8dc;
          border: 1px solid rgba(141,198,63,0.32);
          border-radius: 12px;
          color: var(--text-dark);
          font-size: 0.9rem;
          padding: 14px 44px 14px 42px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        html[data-theme='dark'] .auth-input {
          background: #1a1a1a;
          border: 1px solid rgba(228,88,33,0.25);
          color: #f5f5f5;
        }
        .auth-input::placeholder { color: rgba(26,46,10,0.45); }
        html[data-theme='dark'] .auth-input::placeholder { color: rgba(255,255,255,0.35); }
        .auth-input:focus {
          border-color: #8DC63F;
          box-shadow: 0 0 0 4px rgba(141,198,63,0.12);
          background: #fff;
        }
        html[data-theme='dark'] .auth-input:focus {
          background: #0f0f0f;
          border-color: #E45821;
          box-shadow: 0 0 0 4px rgba(228,88,33,0.1);
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
        html[data-theme='dark'] .auth-eye-btn { color: rgba(255,255,255,0.4); }
        .auth-eye-btn:hover { color: rgba(26,46,10,0.8); }
        html[data-theme='dark'] .auth-eye-btn:hover { color: rgba(255,255,255,0.8); }

        /* OTP boxes */
        .auth-otp-row {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin: 8px 0 4px;
        }

        .auth-otp-box {
          width: 48px;
          height: 56px;
          text-align: center;
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-dark);
          background: #f2f8dc;
          border: 1.5px solid rgba(141,198,63,0.32);
          border-radius: 12px;
          outline: none;
          caret-color: #E45821;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        html[data-theme='dark'] .auth-otp-box {
          background: #1a1a1a;
          border-color: rgba(255,255,255,0.12);
          color: #fff;
        }
        .auth-otp-box:focus {
          border-color: #E45821;
          box-shadow: 0 0 0 3px rgba(228,88,33,0.15);
        }
        .auth-otp-box--filled {
          border-color: #E45821;
          background: rgba(228,88,33,0.06);
        }
        html[data-theme='dark'] .auth-otp-box--filled {
          background: rgba(228,88,33,0.1);
        }

        .auth-error {
          color: #c04444;
          font-size: 0.8rem;
          margin: 0;
          text-align: center;
          padding: 8px 12px;
          background: rgba(255,107,107,0.1);
          border-radius: 8px;
          border: 1px solid rgba(255,107,107,0.22);
        }

        .auth-primary-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 15px 20px;
          background: #E45821;
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          margin-top: 6px;
        }
        .auth-primary-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(228,88,33,0.25);
        }
        .auth-primary-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .auth-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: rgba(255,255,255,0.9);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .auth-resend {
          text-align: center;
          margin-top: 18px;
        }
        .auth-resend-timer {
          font-size: 0.82rem;
          color: var(--text-muted);
        }
        .auth-resend-btn {
          background: none;
          border: none;
          color: #E45821;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          transition: opacity 0.2s;
        }
        .auth-resend-btn:hover { opacity: 0.8; }

        .auth-switch {
          margin: 22px 0 0;
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .auth-switch-link {
          color: var(--text-dark);
          font-weight: 700;
          text-decoration: none;
          transition: color 0.2s;
        }
        .auth-switch-link:hover { color: #E45821; }

        @media (max-width: 900px) {
          .auth-right { padding: 40px 16px; }
          .auth-card { padding: 30px 20px; }
          .auth-otp-box { width: 42px; height: 50px; font-size: 1.2rem; }
        }
      `}</style>
    </div>
  );
};

export default Signup;
