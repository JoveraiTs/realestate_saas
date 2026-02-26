"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getTenantProfile,
  resetTenantPassword,
  updateTenantProfile,
} from "@/lib/clientApi";

const roleAliases = {
  admin: "admin",
  super_admin: "admin",
  agent: "agent",
  staff: "agent",
};

const initialsFromName = (name = "User") =>
  String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: "", avatarUrl: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    document.body.classList.add("dashboard-mode");

    const init = async () => {
      try {
        const token = localStorage.getItem("tenantAuthToken");
        const rawUser = localStorage.getItem("tenantAuthUser");

        if (!token || !rawUser) {
          router.replace("/login");
          return;
        }

        const parsedUser = JSON.parse(rawUser);
        setUser(parsedUser);
        setProfileForm({
          name: parsedUser?.name || "",
          avatarUrl: parsedUser?.avatarUrl || "",
        });

        const response = await getTenantProfile(token);
        const profileUser = response?.user;

        if (profileUser) {
          const roleName =
            typeof profileUser?.role === "object"
              ? profileUser?.role?.name
              : profileUser?.role;

          const nextUser = {
            id: profileUser?._id || parsedUser?.id,
            name: profileUser?.name || parsedUser?.name || "",
            email: profileUser?.email || parsedUser?.email || "",
            avatarUrl: profileUser?.avatarUrl || "",
            role: roleName || parsedUser?.role || "agent",
            permissions: parsedUser?.permissions || [],
          };

          setUser(nextUser);
          setProfileForm({ name: nextUser.name, avatarUrl: nextUser.avatarUrl || "" });
          localStorage.setItem("tenantAuthUser", JSON.stringify(nextUser));
        }
      } catch (_error) {
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      document.body.classList.remove("dashboard-mode");
    };
  }, [router]);

  const avatarPreview = profileForm.avatarUrl || user?.avatarUrl || "";

  const roleText = useMemo(() => {
    const role = roleAliases[String(user?.role || "").toLowerCase()] || "agent";
    return role === "admin" ? "Admin" : "Agent";
  }, [user?.role]);

  const dashboardPath = useMemo(() => {
    const role = roleAliases[String(user?.role || "").toLowerCase()] || "agent";
    return role === "admin" ? "/admin" : "/agent";
  }, [user?.role]);

  const onSaveProfile = async () => {
    const token = localStorage.getItem("tenantAuthToken");
    if (!token) return;

    setStatus({ type: "", message: "" });

    try {
      const response = await updateTenantProfile(token, {
        name: profileForm.name,
        avatarUrl: profileForm.avatarUrl,
      });

      const updated = response?.user || {};
      const roleName = typeof updated?.role === "object" ? updated?.role?.name : updated?.role;

      const mergedUser = {
        ...user,
        name: updated?.name || user?.name,
        email: updated?.email || user?.email,
        avatarUrl: updated?.avatarUrl || "",
        role: roleName || user?.role,
      };

      setUser(mergedUser);
      localStorage.setItem("tenantAuthUser", JSON.stringify(mergedUser));
      setStatus({ type: "success", message: "Profile updated successfully" });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Failed to update profile" });
    }
  };

  const onResetPassword = async () => {
    const token = localStorage.getItem("tenantAuthToken");
    if (!token) return;

    setStatus({ type: "", message: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatus({ type: "error", message: "New password and confirm password do not match" });
      return;
    }

    try {
      await resetTenantPassword(token, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setStatus({ type: "success", message: "Password reset successfully" });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Failed to reset password" });
    }
  };

  if (isLoading) {
    return <div className="ops-loading">Loading profile...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="profile-shell">
      <div className="profile-card">
        <div className="profile-header">
          <button type="button" className="profile-back-btn" onClick={() => router.push(dashboardPath)}>
            ← Back to Dashboard
          </button>
          <h1>User Profile</h1>
          <p className="profile-muted">Manage your account details, photo, and password</p>
        </div>

        <div className="ops-profile-head">
          <div className="ops-profile-photo-wrap">
            {avatarPreview ? (
              <img src={avatarPreview} alt={user?.name || "User"} className="ops-profile-photo" />
            ) : (
              <span className="ops-profile-photo-fallback">{initialsFromName(user?.name || "User")}</span>
            )}
          </div>
          <div>
            <p className="ops-profile-name">{user?.name}</p>
            <p className="ops-profile-email">{user?.email}</p>
            <span className="ops-role-pill">{roleText}</span>
          </div>
        </div>

        <div className="profile-grid">
          <section>
            <h2 className="profile-section-title">Edit Profile</h2>
            <div className="ops-profile-form">
              <input
                type="text"
                className="ops-input"
                placeholder="Name"
                value={profileForm.name}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <input
                type="text"
                className="ops-input"
                placeholder="Photo URL"
                value={profileForm.avatarUrl}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, avatarUrl: event.target.value }))}
              />
              <div className="profile-actions-row">
                <button type="button" className="ops-mini-btn primary" onClick={onSaveProfile}>
                  Save Profile
                </button>
              </div>
            </div>
          </section>

          <section>
            <h2 className="profile-section-title">Reset Password</h2>
            <div className="ops-profile-form">
              <input
                type="password"
                className="ops-input"
                placeholder="Current Password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
              />
              <input
                type="password"
                className="ops-input"
                placeholder="New Password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
              />
              <input
                type="password"
                className="ops-input"
                placeholder="Confirm New Password"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              />
              <div className="profile-actions-row">
                <button type="button" className="ops-mini-btn primary" onClick={onResetPassword}>
                  Update Password
                </button>
              </div>
            </div>
          </section>
        </div>

        {status.message ? (
          <p className={`ops-form-status ${status.type === "error" ? "error" : "success"}`}>
            {status.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
