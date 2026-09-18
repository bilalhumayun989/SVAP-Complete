import { useState } from "react";
import { Link } from "react-router-dom";
import { FiCheckCircle, FiAlertCircle, FiArrowRight } from "react-icons/fi";
import { supabase } from "../../services/supabase";

export default function ForgotPassword() {
  // const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      console.error("Forgot Password Error:", err);
      setErrorMsg(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark-auth-page">
      <div className="dark-auth-card">
        {/* HEADER SECTION */}
        <div className="dark-auth-header">
          {/* <button 
            type="button" 
            className="dark-home-back-btn" 
            onClick={() => navigate(-1)} 
            aria-label="Go back"
          >
            <FiArrowLeft size={22} />
          </button> */}

          <h1 className="dark-auth-title">Forgot Password? 🔒</h1>
          <p className="dark-auth-subtitle">
            Enter your registered email address below and we'll send you instructions to reset your password.
          </p>
        </div>

        {/* MAIN FORM OR SUCCESS BOX */}
        {submitted ? (
          <div className="dark-success-box">
            <div className="dark-success-icon">
              <FiCheckCircle size={26} />
            </div>
            <h2 className="dark-success-title">Reset Link Sent!</h2>
            <p className="dark-success-text">
              We have sent a password reset link to <strong style={{ color: "#fff" }}>{email}</strong>. Please check your inbox and spam folder.
            </p>

            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="dark-retry-btn"
            >
              Didn't get the email? Try again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="dark-auth-form" noValidate>
            <div className="dark-field">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL ADDRESS"
                className="dark-input"
              />
            </div>

            {errorMsg && (
              <div className="dark-error">
                <FiAlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button type="submit" className="dark-primary-btn" disabled={loading}>
              {loading ? (
                <span className="dark-spinner" />
              ) : (
                <>
                  <span className="btn-icon-wrap"><FiArrowRight /></span>
                  <span>Send Reset Link</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* FOOTER LINK */}
        <p className="dark-switch">
          Remembered your password?{" "}
          <Link to="/login" className="dark-switch-link">
            Back to Login
          </Link>
        </p>
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
          background-color: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
          color: #ffffff;
        }

        .dark-auth-card {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          margin: auto 0;
        }

        .dark-auth-header {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .dark-home-back-btn {
          background: #1c1c1e;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          transition: background 0.2s, transform 0.1s;
        }

        .dark-home-back-btn:hover {
          background: #2c2c2e;
        }

        .dark-home-back-btn:active {
          transform: scale(0.95);
        }

        .dark-auth-title {
          color: #ffffff;
          font-size: 1.85rem;
          font-weight: 800;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }

        .dark-auth-subtitle {
          color: #8e8e93;
          font-size: 0.9rem;
          margin: 0;
          font-weight: 400;
          line-height: 1.45;
        }

        .dark-auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .dark-field {
          display: flex;
          flex-direction: column;
        }

        .dark-input {
          width: 100%;
          background: #1c1c1e;
          border: 1px solid transparent;
          border-radius: 16px;
          color: #ffffff;
          font-size: 0.88rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          padding: 16px 18px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }

        .dark-input::placeholder {
          color: #636366;
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .dark-input:focus {
          background: #242426;
          border-color: #3a3a3c;
        }

        .dark-primary-btn {
          width: 100%;
          background: #f26539;
          border: none;
          border-radius: 30px;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 700;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          margin-top: 4px;
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
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(255, 69, 58, 0.1);
          border-radius: 12px;
        }

        .dark-success-box {
          background: #1c1c1e;
          border: 1px solid rgba(242, 101, 57, 0.3);
          border-radius: 20px;
          padding: 24px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .dark-success-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(242, 101, 57, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f26539;
          margin-bottom: 12px;
        }

        .dark-success-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 6px;
        }

        .dark-success-text {
          font-size: 0.85rem;
          color: #8e8e93;
          line-height: 1.45;
        }

        .dark-retry-btn {
          background: none;
          border: none;
          color: #f26539;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 16px;
        }

        .dark-retry-btn:hover {
          text-decoration: underline;
        }

        .dark-switch {
          text-align: center;
          color: #8e8e93;
          font-size: 0.88rem;
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

        .dark-spinner {
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
          .dark-auth-title { font-size: 1.65rem; }
        }
      `}</style>
    </div>
  );
}