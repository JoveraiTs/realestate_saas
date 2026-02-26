"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import HeaderAuthControl from "@/components/HeaderAuthControl";

export default function MobileHeaderMenu({ navItems = [], tenantPhone, tenantName }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const overlayId = useId();

  const safePhoneHref = useMemo(() => {
    const raw = typeof tenantPhone === "string" ? tenantPhone : "";
    const normalized = raw.replace(/\s+/g, "");
    return normalized ? `tel:${normalized}` : undefined;
  }, [tenantPhone]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="mobile-header-actions">
      <button
        type="button"
        className="mobile-menu-button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={overlayId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="mobile-menu-icon" aria-hidden="true" />
      </button>

      {open ? (
        <div id={overlayId} className="mobile-nav-overlay" role="dialog" aria-label="Site menu">
          <button
            type="button"
            className="mobile-nav-backdrop"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="mobile-nav-drawer">
            <div className="mobile-nav-top">
              <div className="mobile-nav-title">{tenantName || "Menu"}</div>
              <button type="button" className="mobile-nav-close" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            <nav className="mobile-nav-links" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="mobile-nav-link">
                  {item.label}
                </Link>
              ))}
              <Link href="/contact" className="mobile-nav-link mobile-nav-link-cta">
                Contact Us
              </Link>
              {safePhoneHref ? (
                <a href={safePhoneHref} className="mobile-nav-link mobile-nav-link-muted">
                  {tenantPhone}
                </a>
              ) : null}
            </nav>

            <div className="mobile-nav-auth">
              <HeaderAuthControl />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
