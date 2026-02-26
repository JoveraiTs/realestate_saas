"use client";

export default function PlaceholderPanel({ title = "Dashboard", section = "" }) {
  const label = String(section || "").replace(/-/g, " ");
  const heading = label ? label.replace(/^./, (c) => c.toUpperCase()) : title;

  return (
    <div className="ops-table-card" style={{ padding: 16 }}>
      <div className="ops-table-head" style={{ borderBottom: "none", padding: 0 }}>
        <div>
          <h3>{heading}</h3>
          <p>This section is ready as a page. Next step is to connect full functionality.</p>
        </div>
      </div>
    </div>
  );
}
