import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../auth.css";

/**
 * ForgotPassword — public two-step flow. (Redesign: styling only.)
 *  Step 1: enter register number -> POST /auth/student/forgot-password
 *  Step 2: enter OTP + new password -> POST /auth/student/reset-password
 */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [registerNumber, setRegisterNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestOtp() {
    setBusy(true); setError(""); setMessage("");
    try {
      const res = await api.post("/auth/student/forgot-password", {
        register_number: registerNumber,
      });
      setMessage(res.data.message || "OTP sent.");
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not send OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    setBusy(true); setError(""); setMessage("");
    try {
      const res = await api.post("/auth/student/reset-password", {
        register_number: registerNumber,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setMessage(res.data.message || "Password reset successful.");
      setStep(3);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join(" "));
      } else {
        setError(detail || "Could not reset password.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">CP</div>
          <span className="auth-brand-name">Campus Placement Portal</span>
        </div>

        <h1 className="auth-title">Forgot password</h1>
        <p className="auth-sub">
          {step === 1 && "We'll send a 6-digit code to your college email."}
          {step === 2 && "Enter the code and choose a new password."}
          {step === 3 && "All set."}
        </p>

        <div className="auth-form">
          {error && <p className="auth-error">{error}</p>}
          {message && step !== 3 && <p className="auth-success">{message}</p>}

          {step === 1 && (
            <>
              <label className="auth-field">
                <span>Register number</span>
                <input
                  placeholder="e.g. 24B01A1286"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                />
              </label>
              <button className="auth-btn" disabled={busy || !registerNumber} onClick={requestOtp}>
                {busy ? "Sending…" : "Send OTP"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <label className="auth-field">
                <span>Verification code</span>
                <input
                  inputMode="numeric" maxLength={6} placeholder="000000"
                  value={otp} onChange={(e) => setOtp(e.target.value)}
                />
              </label>
              <label className="auth-field">
                <span>New password</span>
                <input
                  type="password" placeholder="New password"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>
              <label className="auth-field">
                <span>Confirm new password</span>
                <input
                  type="password" placeholder="Confirm new password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
              <button className="auth-btn" disabled={busy} onClick={resetPassword}>
                {busy ? "Resetting…" : "Reset password"}
              </button>
              <button className="auth-text-btn" onClick={() => setStep(1)}
                      style={{ background: "none", border: "none", color: "var(--text-muted)",
                               fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" }}>
                ← Use a different register number
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <p className="auth-success">{message}</p>
              <button className="auth-btn" onClick={() => navigate("/login/student")}>
                Go to login
              </button>
            </>
          )}
        </div>

        <div className="auth-footer">
          <Link to="/login/student">Back to login</Link>
        </div>
      </div>
    </div>
  );
}