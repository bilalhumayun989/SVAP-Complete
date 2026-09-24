import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiEye, FiEyeOff, FiMail, FiArrowRight, FiArrowLeft, FiCheck, FiX } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { api } from "../../services/api";
import { supabase } from "../../services/supabase";
import disposableDomains from "disposable-email-domains";

type Step = "form" | "otp";

// Additional common disposable domains not in the main package
const additionalDisposableDomains = [
  'tempmail.com', 'temp-mail.com', 'throwaway.email', 'throwawaymail.com',
  'trashmail.com', 'fakeinbox.com', 'yopmail.com', 'sharklasers.com',
  'grr.la', 'guerrillamailblock.com', 'spam4.me', 'emailondeck.com',
  'tempinbox.com', 'discard.email', 'discardmail.com', 'spambox.us',
  'tempr.email', 'getairmail.com', 'moakt.com', 'mohmal.com',
  'mytemp.email', 'tempsky.com', 'mintemail.com', 'momentics.ru'
];

// Helper to check if email is disposable
const isDisposableEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return disposableDomains.includes(domain) || additionalDisposableDomains.includes(domain);
};

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
  
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [showLoginRedirect, setShowLoginRedirect] = useState(false);

  // Validation states
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameError, setUsernameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasSpecialChar: false,
  });
  const usernameCheckTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Username uniqueness check with debounce
  useEffect(() => {
    if (step !== "form" || !form.username.trim()) {
      setUsernameStatus("idle");
      setUsernameError("");
      return;
    }

    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    setUsernameStatus("checking");
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", form.username.trim())
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setUsernameStatus("taken");
          setUsernameError("Username already taken");
        } else {
          setUsernameStatus("available");
          setUsernameError("");
        }
      } catch (err) {
        console.error("[Signup] Username check error:", err);
        setUsernameStatus("idle");
      }
    }, 500);

    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, [form.username, step]);

  // Password validation
  useEffect(() => {
    setPasswordValidation({
      minLength: form.password.length >= 6,
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(form.password),
    });
  }, [form.password]);

  const handleChange = (k: string, v: string) => {
    setError("");
    setShowLoginRedirect(false);

    // Email validation - check for disposable domains
    if (k === "email") {
      setForm((f) => ({ ...f, [k]: v }));
      
      if (v.includes('@') && isDisposableEmail(v)) {
        setEmailError("Temporary/disposable email addresses allowed nahi hain. Please apna asal email use karein.");
      } else {
        setEmailError("");
      }
      return;
    }

    // Phone number validation - only allow digits
    if (k === "phone") {
      const digitsOnly = v.replace(/\D/g, "");
      setForm((f) => ({ ...f, [k]: digitsOnly }));

      // Real-time phone validation
      if (digitsOnly.length > 0 && digitsOnly.length !== 11) {
        setPhoneError("Phone number must be exactly 11 digits");
      } else if (digitsOnly.length === 11 && !/^03\d{9}$/.test(digitsOnly)) {
        setPhoneError("Please Enter a Valid Number (Like 03001234567)");
      } else {
        setPhoneError("");
      }
      return;
    }

    setForm((f) => ({ ...f, [k]: v }));
  };

  const isDuplicateEmailError = (message = "") => /already registered|Google se registered/i.test(message);
  const goToLogin = () => navigate('/login');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate all fields
    if (!form.email.trim()) return setError("Email is required");
    if (emailError) return setError(emailError);
    
    if (isDisposableEmail(form.email)) {
      return setError("Temporary/disposable email addresses allowed nahi hain. Please apna asal email use karein.");
    }
    
    if (!form.username.trim()) return setError("Username is required");
    if (usernameStatus === "taken") return setError(usernameError);
    if (usernameStatus === "checking") return setError("Please wait while we check username availability");
    if (usernameStatus !== "available") return setError("Please enter a valid username");
    
    if (!form.phone.trim()) return setError("Phone number is required");
    if (form.phone.length !== 11) return setError("Phone number must be exactly 11 digits");
    if (!/^03\d{9}$/.test(form.phone)) return setError("Sahi Pakistani phone number likhein (jaisay 03001234567)");
    
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
      return setError("Password kam az kam 6 characters ka ho aur ek special character (!@#$% wagera) shamil karein");
    }
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
      // Step 1: Verify OTP
      const otpRes = await api.verifyOtp(form.email, otp);
      if (otpRes.error) throw new Error(otpRes.error);

      const userId = otpRes.user?.id;
      const userEmail = form.email;

      if (!userId) throw new Error("Verification failed. Please try again.");

      // Step 2: Set session temporarily (needed for updateUser)
      if (otpRes.session?.access_token) {
        const { supabase: sb } = await import("../../services/supabase");
        await sb.auth.setSession({
          access_token: otpRes.session.access_token,
          refresh_token: otpRes.session.refresh_token,
        });

        // Step 3: IMPORTANT - Set user password in Supabase
        const { error: passwordError } = await sb.auth.updateUser({
          password: form.password,
        });

        if (passwordError) {
          throw new Error(`Failed to set password: ${passwordError.message}`);
        }

        // Step 3.5: Fetch user avatar URL from Supabase auth metadata
        const { data: { user } } = await sb.auth.getUser();
        const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

        // Step 4: Sign out (no auto-login)
        await sb.auth.signOut();

        // Step 5: Create profile via API (optional - may already exist)
        await api.signup({
          email: userEmail,
          password: form.password,
          username: form.username,
          phone: form.phone,
        }).catch(() => {
          // Ignore errors - profile might already exist
        });

        // Step 6: Update profile details with avatar
        try {
          await api.updateProfile(userId, {
            username: form.username,
            phone: form.phone,
            full_name: form.username,
            avatar_url: avatarUrl, // Save avatar URL
          });
        } catch (err) {
          console.error('[Signup] Profile update error:', err);
          // Ignore profile update errors
        }
      }

      // Step 7: Clear any stored user data
      localStorage.removeItem("sz_user");
      
      // Step 8: Redirect to login page with success message
      navigate("/login", { 
        state: { 
          message: "Account created successfully! Please login with your credentials.",
          email: userEmail 
        },
        replace: true
      });
    } catch (err: any) {
      console.error('[Signup] Verification error:', err);
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
    <div className="dark-auth-page">
      <div className="dark-auth-card">
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
                <div className="dark-input-wrap">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="EMAIL"
                    className={`dark-input ${emailError ? "error-border" : ""}`}
                  />
                  {form.email.includes('@') && !emailError && (
                    <span className="validation-icon success">
                      <FiCheck size={16} />
                    </span>
                  )}
                  {emailError && (
                    <span className="validation-icon error-icon">
                      <FiX size={16} />
                    </span>
                  )}
                </div>
                {emailError && <span className="field-error">{emailError}</span>}
              </div>

              <div className="dark-field">
                <div className="dark-input-wrap">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="PHONE NUMBER"
                    className={`dark-input ${phoneError ? "error-border" : ""}`}
                    maxLength={11}
                  />
                  {form.phone.length === 11 && !phoneError && (
                    <span className="validation-icon success">
                      <FiCheck size={16} />
                    </span>
                  )}
                  {phoneError && (
                    <span className="validation-icon error-icon">
                      <FiX size={16} />
                    </span>
                  )}
                </div>
                {phoneError && <span className="field-error">{phoneError}</span>}
                <span className="dark-field-hint">
                  Pakistani number · 11 digits · Starts From '03' (e.g., 03000000000)
                </span>
              </div>

              <div className="dark-field">
                <div className="dark-input-wrap">
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    placeholder="USERNAME"
                    className={`dark-input ${usernameStatus === "taken" ? "error-border" : ""}`}
                  />
                  {usernameStatus === "checking" && (
                    <span className="validation-icon">
                      <span className="dark-spinner-small" />
                    </span>
                  )}
                  {usernameStatus === "available" && (
                    <span className="validation-icon success">
                      <FiCheck size={16} />
                    </span>
                  )}
                  {usernameStatus === "taken" && (
                    <span className="validation-icon error-icon">
                      <FiX size={16} />
                    </span>
                  )}
                </div>
                {usernameError && <span className="field-error">{usernameError}</span>}
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
                {form.password && (
                  <div className="password-checks">
                    <div className={`password-check ${passwordValidation.minLength ? "valid" : ""}`}>
                      <FiCheck size={12} />
                      <span>6+ characters</span>
                    </div>
                    <div className={`password-check ${passwordValidation.hasSpecialChar ? "valid" : ""}`}>
                      <FiCheck size={12} />
                      <span>Special character (!@#$% etc.)</span>
                    </div>
                  </div>
                )}
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
                <button 
                  type="submit" 
                  className="dark-primary-btn" 
                  disabled={
                    loading || 
                    !!emailError ||
                    usernameStatus !== "available" || 
                    !!phoneError || 
                    !passwordValidation.minLength || 
                    !passwordValidation.hasSpecialChar
                  }
                >
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
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          background-color: var(--bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
          color: var(--text-dark);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        /* Light mode specific styles */
        html:not([data-theme='dark']) .dark-auth-page {
          background-color: #ffffff;
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
          color: var(--text-dark);
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
          color: var(--text-dark);
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
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 16px;
          color: var(--text-dark);
          font-size: 0.88rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          padding: 16px 48px 16px 18px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }

        /* Light mode input styles */
        html:not([data-theme='dark']) .dark-input {
          background: #f5f5f5;
          border: 1px solid #e0e0e0;
          color: #1a1a1a;
        }

        html:not([data-theme='dark']) .dark-input:focus {
          background: #ffffff;
          border-color: #E45821;
        }

        .dark-input::placeholder {
          color: var(--text-muted);
          font-weight: 700;
          opacity: 0.6;
        }

        html:not([data-theme='dark']) .dark-input::placeholder {
          color: #999999;
          opacity: 0.8;
        }
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

        html:not([data-theme='dark']) .dark-eye-btn {
          color: #666666;
        }

        .dark-field-hint {
          color: #636366;
          font-size: 0.72rem;
          line-height: 1.3;
          padding: 0 4px;
        }

        html:not([data-theme='dark']) .dark-field-hint {
          color: #888888;
        }

        .field-error {
          color: #ff453a;
          font-size: 0.75rem;
          padding: 0 4px;
          display: block;
        }

        html:not([data-theme='dark']) .field-error {
          color: #d32f2f;
        }

        .error-border {
          border-color: #ff453a !important;
        }

        html:not([data-theme='dark']) .error-border {
          border-color: #d32f2f !important;
        }

        .validation-icon {
          position: absolute;
          right: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .validation-icon.success {
          color: #30d158;
        }

        .validation-icon.error-icon {
          color: #ff453a;
        }

        .password-checks {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 8px 4px 0;
        }

        .password-check {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: #636366;
          transition: color 0.2s;
        }

        html:not([data-theme='dark']) .password-check {
          color: #888888;
        }

        .password-check svg {
          flex-shrink: 0;
          opacity: 0.4;
        }

        .password-check.valid {
          color: #30d158;
        }

        html:not([data-theme='dark']) .password-check.valid {
          color: #2e7d32;
        }

        .password-check.valid svg {
          opacity: 1;
        }

        .dark-switch {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-top: auto;
          padding-top: 20px;
        }

        html:not([data-theme='dark']) .dark-switch {
          color: #666666;
        }

        .dark-switch-link {
          color: #E45821;
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

        html:not([data-theme='dark']) .dark-divider-line {
          background: #e0e0e0;
        }

        .dark-divider-text {
          color: #636366;
          font-size: 0.85rem;
        }

        html:not([data-theme='dark']) .dark-divider-text {
          color: #888888;
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

        html:not([data-theme='dark']) .dark-social-btn {
          background: #ffffff;
          border: 2px solid #e0e0e0;
          color: #1a1a1a;
        }

        .dark-social-btn:hover:not(:disabled) {
          background: #2c2c2e;
        }

        html:not([data-theme='dark']) .dark-social-btn:hover:not(:disabled) {
          background: #f5f5f5;
          border-color: #E45821;
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

        html:not([data-theme='dark']) .dark-error {
          color: #d32f2f;
          background: rgba(211, 47, 47, 0.1);
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

        html:not([data-theme='dark']) .dark-back-btn {
          color: #666666;
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

        html:not([data-theme='dark']) .dark-otp-box {
          color: #1a1a1a;
          background: #f5f5f5;
          border: 1px solid #e0e0e0;
        }

        .dark-otp-box:focus {
          border-color: #f26539;
        }

        .dark-otp-box.filled {
          border-color: #f26539;
          background: rgba(242, 101, 57, 0.1);
        }

        html:not([data-theme='dark']) .dark-otp-box.filled {
          background: rgba(242, 101, 57, 0.15);
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

        html:not([data-theme='dark']) .dark-resend-timer {
          color: #888888;
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