import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import { useToast } from "../components/useToast";

function ResetPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const initialToken = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [formData, setFormData] = useState({
    token: initialToken,
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/api/users/reset-password", {
        token: formData.token,
        password: formData.password,
      });

      showToast(res.data.message || "Password reset successful", "success");
      navigate("/login");
    } catch (error) {
      showToast(error.response?.data?.message || "Password reset failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ justifyContent: "center", alignItems: "center" }}>
      <div className="auth-form-panel" style={{ border: "none", width: "min(520px, 100%)" }}>
        <div className="auth-card">
          <h1 className="auth-title">New <span>password</span></h1>
          <p className="auth-subtitle">
            Set a strong password to keep your account and conversations secure.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="field-label">Reset token</label>
              <input
                type="text"
                name="token"
                placeholder="Paste your reset token"
                value={formData.token}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div className="field-group">
              <label className="field-label">New password</label>
              <input
                type="password"
                name="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                className="input"
                autoComplete="new-password"
              />
            </div>
            <div className="field-group">
              <label className="field-label">Confirm password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Repeat your new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input"
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="primary-btn" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Updating password..." : "Reset password →"}
            </button>
          </form>

          <div className="auth-meta-row">
            <p className="auth-helper-text">
              Need a new token?{" "}
              <Link className="auth-link" to="/forgot-password">Start again</Link>
            </p>
            <Link className="auth-link" to="/login">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
