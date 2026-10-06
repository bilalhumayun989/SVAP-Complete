import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { api } from "../../services/api";

const PENDING_SIGNUP_KEY = "svap_pending_signup";
type State = "checking" | "success" | "error";

export default function EmailConfirmationPage() {
  const [state, setState] = useState<State>("checking");
  const [message, setMessage] = useState("Please wait while we verify your email and set up your account...");

  useEffect(() => {
    let active = true;
    const finishSignup = async () => {
      try {
        const query = new URLSearchParams(window.location.search);
        const description = query.get("error_description");
        if (description) throw new Error(description.replace(/\+/g, " "));
        let { data: { session } } = await supabase.auth.getSession();
        const code = query.get("code");
        if (!session && code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          session = data.session;
        }
        if (!session?.user) throw new Error("Verification link is invalid or expired. Request a new signup link and try again.");
        const raw = localStorage.getItem(PENDING_SIGNUP_KEY);
        const stored = raw ? JSON.parse(raw) as { email: string; username: string; phone: string } : null;
        const metadata = session.user.user_metadata || {};
        const pending: { email: string; username: string; phone: string } = stored && stored.email.toLowerCase() === session.user.email?.toLowerCase() ? stored : {
          email: session.user.email || "",
          username: String(metadata.username || ""),
          phone: String(metadata.phone || ""),
        };
        if (!pending.username) throw new Error("Email verified, but signup details were unavailable. Please contact support.");
        const saved = await api.signup(pending);
        if (saved.error) throw new Error(saved.error);
        localStorage.removeItem(PENDING_SIGNUP_KEY);
        await supabase.auth.signOut();
        if (!active) return;
        setMessage("Your email has been verified and your account is ready. You can now sign in.");
        setState("success");
      } catch (error) {
        if (!active) return;
        console.error("[Email confirmation]", error);
        setMessage(error instanceof Error ? error.message : "Could not complete email verification.");
        setState("error");
      }
    };
    void finishSignup();
    return () => { active = false; };
  }, []);

  return <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, background: "var(--bg, #090909)", color: "var(--text-dark, #fff)" }}>
    <section style={{ width: "100%", maxWidth: 440, textAlign: "center", padding: 32, border: "1px solid var(--border-light, #292929)", borderRadius: 20, background: "var(--card-bg, #151515)" }}>
      <div aria-hidden="true" style={{ width: 56, height: 56, display: "grid", placeItems: "center", margin: "0 auto 20px", borderRadius: "50%", background: state === "error" ? "#421e17" : "#17351f", color: state === "error" ? "#ff6845" : "#38c979", fontSize: 28 }}>{state === "checking" ? "..." : state === "success" ? "OK" : "!"}</div>
      <h1 style={{ margin: "0 0 12px", fontSize: 28 }}>{state === "checking" ? "Verifying Email" : state === "success" ? "Email Verified" : "Verification Issue"}</h1>
      <p style={{ margin: "0 0 24px", lineHeight: 1.6, color: "var(--text-muted, #aaa)" }}>{message}</p>
      {state !== "checking" && <Link to={state === "success" ? "/login" : "/signup"} style={{ display: "inline-flex", justifyContent: "center", width: "100%", padding: "14px 20px", borderRadius: 999, background: "#e85821", color: "white", textDecoration: "none", fontWeight: 700 }}>{state === "success" ? "Go to Login" : "Back to Signup"}</Link>}
    </section>
  </main>;
}
