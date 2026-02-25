"use client";

import { useEffect, useMemo, useState } from "react";

const normalizeNumber = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  // Keep digits only (wa.me expects country code digits)
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";

  // If already has country code (e.g. 971...), keep.
  if (digits.startsWith("971") && digits.length >= 11) return digits;

  // Common UAE local formats:
  // - 05XXXXXXXX (10 digits) -> 9715XXXXXXXX
  // - 5XXXXXXXX (9 digits) -> 9715XXXXXXXX
  if (digits.startsWith("0") && digits.length >= 9 && digits.length <= 10) {
    return `971${digits.slice(1)}`;
  }
  if (digits.length === 9 && digits.startsWith("5")) {
    return `971${digits}`;
  }

  return digits;
};

const WhatsAppIcon = ({ size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M20.4 3.6A11.8 11.8 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.6 4.2 1.6 6.1L0 24l6.2-1.6c1.8 1 3.8 1.5 5.8 1.5h.1c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.6-8.4ZM12 21.9h-.1c-1.8 0-3.6-.5-5.2-1.5l-.4-.2-3.7 1 1-3.6-.2-.4a9.86 9.86 0 0 1-1.5-5.3C1.9 6.4 6.4 1.9 12 1.9c2.6 0 5.1 1 6.9 2.9 1.8 1.8 2.9 4.3 2.9 7 0 5.6-4.5 10.1-9.9 10.1Zm5.8-7.6c-.3-.1-1.8-.9-2.1-1-.3-.1-.5-.1-.7.2-.2.3-.8 1-.9 1.2-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.9-1.7-2.2-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7 0 1.6 1.2 3.2 1.4 3.4.2.2 2.3 3.5 5.6 4.9.8.3 1.4.5 1.9.6.8.3 1.6.2 2.2.1.7-.1 1.8-.7 2-1.4.2-.7.2-1.3.1-1.4-.1-.2-.3-.2-.6-.3Z"
      fill="currentColor"
    />
  </svg>
);

export default function WhatsAppAgentsDrawer({ agents = [] }) {
  const [open, setOpen] = useState(false);

  const agentsWithNumbers = useMemo(() => {
    const list = Array.isArray(agents) ? agents : [];
    return list
      .map((agent) => ({
        ...agent,
        _wa: normalizeNumber(agent?.whatsappBusinessNumber || agent?.whatsapp || agent?.phone),
      }))
      .filter((agent) => Boolean(agent._wa));
  }, [agents]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (agentsWithNumbers.length === 0) return null;

  return (
    <>
      <button
        type="button"
        className="wa-fab"
        aria-label="WhatsApp"
        onClick={() => setOpen(true)}
      >
        <WhatsAppIcon />
      </button>

      {open ? (
        <div className="wa-overlay" role="presentation" onClick={() => setOpen(false)}>
          <aside
            className="wa-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="WhatsApp agents"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wa-drawer-head">
              <div>
                <div className="wa-drawer-title">WhatsApp</div>
                <div className="wa-drawer-subtitle">Choose an agent to chat</div>
              </div>
              <button type="button" className="wa-close" aria-label="Close" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>

            <div className="wa-list">
              {agentsWithNumbers.map((agent) => {
                const waLink = `https://wa.me/${agent._wa}`;
                return (
                  <a
                    key={agent._id || agent.id || `${agent.name}-${agent._wa}`}
                    className="wa-item"
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="wa-avatar">
                      {agent?.photoUrl ? <img src={agent.photoUrl} alt={agent?.name || "Agent"} /> : null}
                    </div>
                    <div className="wa-meta">
                      <div className="wa-name">{agent?.name || "Agent"}</div>
                      <div className="wa-number">+{agent._wa}</div>
                    </div>
                    <div className="wa-cta">Chat</div>
                  </a>
                );
              })}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
