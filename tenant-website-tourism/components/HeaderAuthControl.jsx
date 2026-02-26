"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const buildAvatarUrl = (name = "User") => {
  const encoded = encodeURIComponent(name || "User");
  return `https://ui-avatars.com/api/?name=${encoded}&background=C08436&color=ffffff&size=64`;
};

export default function HeaderAuthControl() {
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tenantAuthUser");
      if (raw) {
        setAuthUser(JSON.parse(raw));
      }
    } catch (_err) {
      setAuthUser(null);
    }
  }, []);

  const avatarUrl = useMemo(() => buildAvatarUrl(authUser?.name || "User"), [authUser?.name]);

  const onLogout = () => {
    try {
      localStorage.removeItem("tenantAuthToken");
      localStorage.removeItem("tenantAuthUser");
    } catch (_err) {
      // noop
    }
    setAuthUser(null);
    window.location.href = "/login";
  };

  if (!authUser) {
    return (
      <Link href="/login" className="auth-login-btn">
        Login
      </Link>
    );
  }

  return (
    <>
      <div className="auth-user-chip" title={authUser?.name || "User"}>
        <img src={avatarUrl} alt={authUser?.name || "User"} className="auth-user-photo" />
        <span className="auth-user-name">{authUser?.name || "User"}</span>
      </div>
      <button type="button" className="auth-logout-btn" onClick={onLogout}>
        Logout
      </button>
    </>
  );
}
