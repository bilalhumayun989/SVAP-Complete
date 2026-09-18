import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../../services/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    // Check if user came from valid reset link
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setValidToken(true);
      } else {
        setErrorMsg("Invalid or expired reset link. Please request a new one.");
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      console.error("Reset Password Error:", err);
      setErrorMsg(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!validToken && !errorMsg) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-5">
        <Loader2 size={32} className="animate-spin text-[#D9501E]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between px-5 pt-6 pb-8 max-w-md mx-auto">
      {/* TOP BAR */}
      <div>
        <button
          onClick={() => navigate("/login")}
          className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-white/90 active:scale-95 transition-all"
          aria-label="Back to login"
        >
          <ArrowLeft size={18} />
        </button>

        {/* HEADER CONTENT */}
        <div className="mt-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Reset Password 🔐
          </h1>
          <p className="text-sm text-white/60 mt-2 leading-relaxed">
            Enter your new password below to secure your account.
          </p>
        </div>

        {/* SUCCESS MESSAGE */}
        {success ? (
          <div className="mt-8 bg-[#181818] border border-green-500/40 rounded-2xl p-5 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500 mb-3">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="text-base font-semibold text-white">Password Reset Successful!</h2>
            <p className="text-xs text-white/60 mt-1 leading-relaxed">
              Your password has been updated. Redirecting to login...
            </p>
          </div>
        ) : (
          /* FORM SECTION */
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-red-400">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {!validToken ? (
              <div className="text-center py-8">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-[#D9501E] hover:underline font-semibold"
                >
                  Request new reset link
                </button>
              </div>
            ) : (
              <>
                {/* New Password */}
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-2">
                    New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={18} className="absolute left-3.5 text-white/40" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#D9501E] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-white/40 hover:text-white/70"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-white/40 mt-1.5">Minimum 8 characters</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={18} className="absolute left-3.5 text-white/40" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#D9501E] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 text-white/40 hover:text-white/70"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#D9501E] hover:bg-[#c24419] text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#D9501E]/20 mt-6"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </>
            )}
          </form>
        )}
      </div>

      {/* FOOTER LINK */}
      <div className="text-center text-xs text-white/50 pt-6">
        Remember your password?{" "}
        <button
          onClick={() => navigate("/login")}
          className="text-[#D9501E] font-semibold hover:underline"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
