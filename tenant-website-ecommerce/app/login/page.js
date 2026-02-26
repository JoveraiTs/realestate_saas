"use client";

import { useState } from "react";
import { loginTenantUser } from "@/lib/clientApi";

const initialForm = {
  email: "",
  password: "",
  role: "admin",
};

const normalizeRoleForLogin = (value = "") => {
  const role = String(value).toLowerCase();
  if (role === "admin" || role === "super_admin") return "admin";
  if (role === "agent" || role === "staff") return "agent";
  return role;
};

export default function LoginPage() {
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const onChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    setIsSubmitting(true);

    try {
      const response = await loginTenantUser({
        email: formData.email,
        password: formData.password,
      });

      const userRole = normalizeRoleForLogin(response?.user?.role || "");
      if (userRole !== formData.role) {
        setStatus({
          type: "error",
          message: `This account is '${response?.user?.role || "unknown"}'. Please choose the correct login type.`,
        });
        return;
      }

      if (response?.token) {
        localStorage.setItem("tenantAuthToken", response.token);
      }

      if (response?.user) {
        localStorage.setItem("tenantAuthUser", JSON.stringify(response.user));
      }

      const redirectTo = response?.redirectTo || (formData.role === "admin" ? "/admin" : "/agent");
      window.location.href = redirectTo;
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Login failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-card">
        <h1>Admin &amp; Agent Login</h1>
        <p className="login-subtitle">Sign in with your tenant account credentials.</p>

        <form onSubmit={onSubmit} className="login-form">
          <div className="login-role-toggle" role="tablist" aria-label="Login type">
            <button
              type="button"
              className={`role-btn${formData.role === "admin" ? " active" : ""}`}
              onClick={() => setFormData((current) => ({ ...current, role: "admin" }))}
            >
              Admin
            </button>
            <button
              type="button"
              className={`role-btn${formData.role === "agent" ? " active" : ""}`}
              onClick={() => setFormData((current) => ({ ...current, role: "agent" }))}
            >
              Agent
            </button>
          </div>

          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              name="password"
              value={formData.password}
              onChange={onChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : `Login as ${formData.role === "admin" ? "Admin" : "Agent"}`}
          </button>

          {status.message ? <p className={`status ${status.type}`}>{status.message}</p> : null}
        </form>
      </section>
    </div>
  );
}
