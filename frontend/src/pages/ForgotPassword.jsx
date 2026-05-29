import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useToast } from "../components/useToast";

function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      const res = await API.post("/api/users/forgot-password", { email });
      const token = res.data.resetToken;

      showToast(res.data.message || "Password reset request created", "success");
      navigate(`/reset-password?token=${encodeURIComponent(token)}`);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to start reset flow", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ justifyContent: "center", alignItems: "center" }}>
      <div className="auth-form-panel" style={{ border: "none", width: "min(480px, 100%)" }}>
        <div className="auth-card">
          <h1 className="auth-title">Reset <span>password</span></h1>
          <p className="auth-subtitle">
            Enter your account email and we will send you a secure reset link.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="field-label">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <button type="submit" className="primary-btn" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Preparing reset..." : "Continue →"}
            </button>
          </form>

          <p className="auth-note">
            Demo flow: after submitting, you will be taken directly to the reset page.
          </p>

          <div className="auth-meta-row">
            <p className="auth-helper-text">
              Remembered it?{" "}
              <Link className="auth-link" to="/login">Back to login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
