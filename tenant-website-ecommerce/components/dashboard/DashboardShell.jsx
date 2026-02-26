"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getDashboardSummary,
  getPlanUsage,
  getTenantProfile,
  upgradeTenantPlan,
} from "@/lib/clientApi";
import WebManagementPanel from "@/components/dashboard/WebManagementPanel";
import SeoPanel from "@/components/dashboard/SeoPanel";
import PlaceholderPanel from "@/components/dashboard/PlaceholderPanel";
import PropertyManagementPanel from "@/components/dashboard/PropertyManagementPanel";
import ErrorBoundary from "@/components/ErrorBoundary";

const HERO_IMAGE = "https://www.figma.com/api/mcp/asset/40ca8091-af4a-4be1-adb0-f940c59c9f92";

const dashboardContent = {
  admin: {
    roleLabel: "Admin",
    title: "Dashboard",
    heroLabel: "Performance Overview",
    heroTitle: "Search for your dream Home in UAE",
    heroSubtitle: "From beachfront villas to modern city apartments, tailored to fit your lifestyle and budget.",
    sidebar: {
      pages: ["Home", "About Us", "Properties", "Blogs"],
      management: ["Property Management", "Lead Management", "Invite Agent", "Newsletter", "Web Management", "SEO"],
    },
    stats: [
      { label: "Total Properties", value: "13", icon: "🏢" },
      { label: "Cities Covered", value: "7", icon: "📍" },
      { label: "Active Leads", value: "1", icon: "👥" },
      { label: "Agents", value: "0", icon: "🧑‍💼" },
    ],
    leads: [{ name: "Muhammad Atif", email: "batif7003@gmail.com", status: "New" }],
    properties: [
      { name: "Manta Bay", type: "Sale", location: "Al Marjan Island, Ras Al Khaimah", price: "AED 1,800,000" },
      { name: "JW Marriott Residences", type: "Sale", location: "Al Marjan Island, Ras Al Khaimah", price: "AED 3,500,000" },
      { name: "Ellington Views 1 - Al Hamra", type: "Sale", location: "Al Hamra, Ras Al Khaimah", price: "AED 2,800,000" },
      { name: "Falcon Island - 2 Bed Townhouse", type: "Sale", location: "Ras Al Khaimah, Ras Al Khaimah", price: "AED 0" },
      { name: "Cape Hayat", type: "Sale", location: "Ras Al Khaimah, Ras Al Khaimah", price: "AED 3,600,000" },
    ],
    metrics: ["13 properties live", "1 leads in pipeline", "0 agents onboarded"],
    tenantNameFallback: "vanguard",
    emailFallback: "info@vanguardproperty.ae",
  },
  agent: {
    roleLabel: "Agent",
    title: "Dashboard",
    heroLabel: "Agent Workspace",
    heroTitle: "Manage your active leads and scheduled visits",
    heroSubtitle: "Stay focused on priority buyers, follow-ups, and property tours from one place.",
    sidebar: {
      pages: ["Home", "My Listings", "Calendar", "Messages"],
      management: ["Lead Management", "Follow-ups", "Newsletter", "Web Management", "SEO"],
    },
    stats: [
      { label: "Assigned Leads", value: "8", icon: "👥" },
      { label: "Visits Today", value: "2", icon: "📅" },
      { label: "Follow-ups", value: "6", icon: "📞" },
      { label: "Listings", value: "5", icon: "🏠" },
    ],
    leads: [
      { name: "Sana Ahmed", email: "sana.ahmed@gmail.com", status: "Hot" },
      { name: "Omar Khalid", email: "omar.kh@gmail.com", status: "Follow-up" },
    ],
    properties: [
      { name: "Marina Crest Residence", type: "Sale", location: "Dubai Marina", price: "AED 2,250,000" },
      { name: "Harbour Gate Apartment", type: "Sale", location: "Dubai Creek Harbour", price: "AED 1,950,000" },
      { name: "Palm Vista Villa", type: "Sale", location: "Palm Jumeirah", price: "AED 9,800,000" },
    ],
    metrics: ["8 assigned leads", "2 visits today", "6 follow-ups pending"],
    tenantNameFallback: "agent desk",
    emailFallback: "agent@vanguardproperty.ae",
  },
};

const roleAliases = {
  admin: "admin",
  super_admin: "admin",
  agent: "agent",
  staff: "agent",
};

const planOrder = {
  free: 0,
  trial: 0,
  pro: 1,
  enterprise: 2,
};

const planDisplay = {
  free: { name: "Free", monthly: "AED 0/mo", yearly: "AED 0/yr" },
  trial: { name: "Trial", monthly: "AED 0/mo", yearly: "AED 0/yr" },
  pro: { name: "Pro", monthly: "AED 299/mo", yearly: "AED 2,999/yr" },
  enterprise: { name: "Enterprise", monthly: "AED 1,499/mo", yearly: "AED 14,999/yr" },
};

const initialsFromName = (name = "User") =>
  String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";

export default function DashboardShell({ role = "agent" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [summary, setSummary] = useState(null);
  const [planUsage, setPlanUsage] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState("");
  const [upgradePlan, setUpgradePlan] = useState("pro");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const [upgradeSuccess, setUpgradeSuccess] = useState("");
  const normalizedRole = role.toLowerCase();
  const currentPlanKey = String(planUsage?.plan || "trial").toLowerCase();
  const availableUpgradePlans = ["pro", "enterprise"].filter(
    (key) => (planOrder[key] ?? -1) > (planOrder[currentPlanKey] ?? 0),
  );

  const content = useMemo(() => dashboardContent[normalizedRole] || dashboardContent.agent, [normalizedRole]);

  const section = (() => {
    if (!pathname) return "dashboard";
    if (pathname.includes("/admin/property-management")) return "property-management";
    if (pathname.includes("/admin/web-management")) return "web";
    if (pathname.includes("/admin/seo")) return "seo";
    if (pathname.includes("/admin/leads")) return "leads";
    if (pathname.includes("/admin/invite-agent")) return "invite-agent";
    if (pathname.includes("/admin/newsletter")) return "newsletter";
    return "dashboard";
  })();

  useEffect(() => {
    document.body.classList.add("dashboard-mode");

    try {
      const token = localStorage.getItem("tenantAuthToken");
      const rawUser = localStorage.getItem("tenantAuthUser");

      if (!token || !rawUser) {
        router.replace("/login");
        return;
      }

      const parsedUser = JSON.parse(rawUser);
      const actualRole = roleAliases[String(parsedUser?.role || "").toLowerCase()] || "agent";

      if (actualRole !== normalizedRole) {
        router.replace("/login");
        return;
      }

      setUser(parsedUser);

      getTenantProfile(token)
        .then((response) => {
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
            localStorage.setItem("tenantAuthUser", JSON.stringify(nextUser));
          }
        })
        .catch(() => {
          // noop
        });

      getDashboardSummary(token)
        .then((response) => {
          setSummary(response || null);
        })
        .catch(() => {
          setSummary(null);
        });

      if (actualRole === "admin") {
        setPlanLoading(true);
        setPlanError("");
        getPlanUsage(token)
          .then((response) => {
            setPlanUsage(response || null);
          })
          .catch((error) => {
            setPlanUsage(null);
            setPlanError(error?.message || "Failed to load plan usage");
          })
          .finally(() => {
            setPlanLoading(false);
          });
      } else {
        setPlanUsage(null);
        setPlanLoading(false);
      }
    } catch (_error) {
      router.replace("/login");
    } finally {
      setIsChecking(false);
    }

    return () => {
      document.body.classList.remove("dashboard-mode");
    };
  }, [normalizedRole, router]);

  useEffect(() => {
    if (normalizedRole !== "admin") return;
    if (availableUpgradePlans.length === 0) {
      setUpgradePlan("");
      return;
    }
    if (!availableUpgradePlans.includes(upgradePlan)) {
      setUpgradePlan(availableUpgradePlans[0]);
    }
  }, [availableUpgradePlans, normalizedRole, upgradePlan]);

  const logout = () => {
    try {
      localStorage.removeItem("tenantAuthToken");
      localStorage.removeItem("tenantAuthUser");
    } catch (_error) {
      // noop
    }
    router.replace("/login");
  };

  if (isChecking) {
    return <div className="ops-loading">Loading dashboard...</div>;
  }

  if (!user) {
    return null;
  }

  const today = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const profileName = String(user?.name || content.tenantNameFallback || "User");
  const profileEmail = String(user?.email || content.emailFallback || "");
  const tenantHandle = (profileEmail.split("@")[0] || profileName).toLowerCase();
  const photoPreview = user?.avatarUrl || "";

  const liveStats = normalizedRole === "admin"
    ? [
        { label: "Total Properties", value: String(summary?.stats?.totalProperties ?? content.stats[0].value), icon: content.stats[0].icon },
        { label: "Cities Covered", value: String(summary?.stats?.citiesCovered ?? content.stats[1].value), icon: content.stats[1].icon },
        { label: "Active Leads", value: String(summary?.stats?.activeLeads ?? content.stats[2].value), icon: content.stats[2].icon },
        { label: "Agents", value: String(summary?.stats?.activeAgents ?? content.stats[3].value), icon: content.stats[3].icon },
      ]
    : [
        { label: "Assigned Leads", value: String(summary?.stats?.assignedLeads ?? content.stats[0].value), icon: content.stats[0].icon },
        { label: "Visits Today", value: String(summary?.stats?.visitsToday ?? content.stats[1].value), icon: content.stats[1].icon },
        { label: "Follow-ups", value: String(summary?.stats?.followUps ?? content.stats[2].value), icon: content.stats[2].icon },
        { label: "Listings", value: String(summary?.stats?.listings ?? content.stats[3].value), icon: content.stats[3].icon },
      ];

  const liveLeads = Array.isArray(summary?.leads) && summary.leads.length > 0
    ? summary.leads.map((lead) => ({
        name: lead?.name || "Unknown",
        email: lead?.email || "-",
        status: String(lead?.status || "new").replace(/^./, (char) => char.toUpperCase()),
      }))
    : content.leads;

  const liveProperties = Array.isArray(summary?.properties) && summary.properties.length > 0
    ? summary.properties.map((property) => ({
        name: property?.name || "Untitled Property",
        type: String(property?.type || "published").replace(/^./, (char) => char.toUpperCase()),
        location: property?.location || "-",
        price: property?.price || "-",
      }))
    : content.properties;

  const liveMetrics = normalizedRole === "admin"
    ? [
        `${liveStats[0].value} properties live`,
        `${liveStats[2].value} leads in pipeline`,
        `${liveStats[3].value} agents onboarded`,
      ]
    : [
        `${liveStats[0].value} assigned leads`,
        `${liveStats[1].value} visits today`,
        `${liveStats[2].value} follow-ups pending`,
      ];

  const selectedPlanPricing = planDisplay[upgradePlan] || null;

  const refreshPlanUsage = async () => {
    const token = localStorage.getItem("tenantAuthToken");
    if (!token) return;

    setPlanLoading(true);
    setPlanError("");
    try {
      const response = await getPlanUsage(token);
      setPlanUsage(response || null);
    } catch (error) {
      setPlanUsage(null);
      setPlanError(error?.message || "Failed to load plan usage");
    } finally {
      setPlanLoading(false);
    }
  };

  const confirmUpgrade = async () => {
    const token = localStorage.getItem("tenantAuthToken");
    if (!token || !upgradePlan) return;

    setUpgradeLoading(true);
    setUpgradeError("");
    setUpgradeSuccess("");
    try {
      const response = await upgradeTenantPlan(token, { plan: upgradePlan, billingCycle });
      setUpgradeSuccess(response?.message || "Plan upgraded successfully.");
      setShowUpgradeConfirm(false);
      await refreshPlanUsage();
    } catch (error) {
      setUpgradeError(error?.message || "Failed to upgrade plan");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const onNavigateManagement = (label) => {
    const text = String(label || "").toLowerCase();
    if (text.includes("property management") || text === "properties") return router.push("/admin/property-management");
    if (text.includes("web management")) return router.push("/admin/web-management");
    if (text === "seo") return router.push("/admin/seo");
    if (text.includes("lead")) return router.push("/admin/leads");
    if (text.includes("invite")) return router.push("/admin/invite-agent");
    if (text.includes("newsletter")) return router.push("/admin/newsletter");
  };

  const onNavigatePage = (label) => {
    const text = String(label || "").toLowerCase();
    if (text.includes("home")) return router.push("/");
    if (text.includes("about")) return router.push("/about");
    if (text.includes("properties")) return router.push("/properties");
    if (text.includes("blog")) return router.push("/blogs");
  };

  return (
    <div className="ops-shell">
      <aside className="ops-sidebar">
        <div className="ops-sidebar-top">
          <div className="ops-brand">
            <span className="ops-brand-icon">🏠</span>
            <div>
              <p className="ops-brand-title">RealEstateCRM</p>
              <p className="ops-brand-sub">Operations Console</p>
            </div>
          </div>

          <div className="ops-profile-card">
            <div className="ops-profile-head">
              <div className="ops-profile-photo-wrap">
                {photoPreview ? (
                  <img src={photoPreview} alt={profileName} className="ops-profile-photo" />
                ) : (
                  <span className="ops-profile-photo-fallback">{initialsFromName(profileName)}</span>
                )}
              </div>
              <div>
                <p className="ops-profile-name">{tenantHandle}</p>
                <p className="ops-profile-email">{profileEmail}</p>
              </div>
            </div>

            <span className="ops-role-pill">{content.roleLabel}</span>

            <div className="ops-profile-actions">
              <button type="button" className="ops-mini-btn" onClick={() => router.push("/profile")}>
                Manage Profile
              </button>
            </div>
          </div>

          <div className="ops-nav-group">
            <p className="ops-nav-heading">Pages</p>
            {content.sidebar.pages.map((item, index) => (
              <button
                type="button"
                key={item}
                className={`ops-nav-item${index === 0 ? " active" : ""}`}
                onClick={() => onNavigatePage(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="ops-nav-group">
            <p className="ops-nav-heading">Management</p>
            {content.sidebar.management.map((item) => (
              <button type="button" key={item} className="ops-nav-item" onClick={() => onNavigateManagement(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <button type="button" onClick={logout} className="ops-logout-btn">
          Logout
        </button>
      </aside>

      <section className="ops-main">
        <header className="ops-topbar">
          <div>
            <p className="ops-workspace-label">Workspace</p>
            <h1 className="ops-page-title">{content.title}</h1>
            <div style={{ marginTop: 8 }}>
              <button type="button" className="ops-mini-btn primary" onClick={() => router.push("/profile")}>
                Profile Settings
              </button>
            </div>
          </div>
          <div className="ops-topbar-right">
            <span className="ops-chip">{content.roleLabel}</span>
            <span className="ops-chip">{today}</span>
            <span className="ops-chip">Theme</span>
            <span className="ops-user-pill">
              <span className="ops-user-avatar">{initialsFromName(profileName)}</span>
              <span>{tenantHandle}</span>
            </span>
          </div>
        </header>

        {section === "web" ? (
          <ErrorBoundary>
            <WebManagementPanel />
          </ErrorBoundary>
        ) : section === "property-management" ? (
          <ErrorBoundary>
            <PropertyManagementPanel />
          </ErrorBoundary>
        ) : section === "seo" ? (
          <ErrorBoundary>
            <SeoPanel />
          </ErrorBoundary>
        ) : section !== "dashboard" ? (
          <PlaceholderPanel title={content.title} section={section} />
        ) : (
          <>
            <section className="ops-hero" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
              <div className="ops-hero-overlay" />
              <div className="ops-hero-content">
                <p className="ops-hero-label">{content.heroLabel}</p>
                <h2 className="ops-hero-title">{content.heroTitle}</h2>
                <p className="ops-hero-subtitle">{content.heroSubtitle}</p>
                <div className="ops-metrics-row">
                  {liveMetrics.map((item) => (
                    <span key={item} className="ops-metric-pill">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <div className="ops-kpi-grid">
              {liveStats.map((stat) => (
                <article key={stat.label} className="ops-kpi-card">
                  <div>
                    <p className="ops-kpi-label">{stat.label}</p>
                    <p className="ops-kpi-value">{stat.value}</p>
                  </div>
                  <span className="ops-kpi-icon">{stat.icon}</span>
                </article>
              ))}
            </div>

            {normalizedRole === "admin" && (
              <article className="ops-table-card ops-plan-card">
                <div className="ops-table-head">
                  <div>
                    <h3>Plan Usage & Upgrade</h3>
                    <p>Manage your current plan and limits</p>
                  </div>
                  {planUsage?.plan ? <span>{String(planUsage.plan).toUpperCase()} plan</span> : null}
                </div>
                <div className="ops-plan-body">
                  {planLoading ? <p className="ops-plan-note">Loading plan usage...</p> : null}
                  {!planLoading && planError ? <p className="ops-inline-status error">{planError}</p> : null}
                  {!planLoading && !planError && planUsage ? (
                    <>
                      <div className="ops-plan-grid">
                        <div className="ops-plan-metric">
                          <p className="ops-plan-metric-label">Users</p>
                          <p className="ops-plan-metric-value">
                            {planUsage?.usage?.users ?? 0} / {planUsage?.limits?.users ?? 0}
                          </p>
                        </div>
                        <div className="ops-plan-metric">
                          <p className="ops-plan-metric-label">Properties</p>
                          <p className="ops-plan-metric-value">
                            {planUsage?.usage?.properties ?? 0} / {planUsage?.limits?.properties ?? 0}
                          </p>
                        </div>
                        <div className="ops-plan-metric">
                          <p className="ops-plan-metric-label">Custom Domains</p>
                          <p className="ops-plan-metric-value">
                            {planUsage?.usage?.customDomains ?? 0} / {planUsage?.limits?.customDomains ?? 0}
                          </p>
                        </div>
                        <div className="ops-plan-metric">
                          <p className="ops-plan-metric-label">Remaining Users</p>
                          <p className="ops-plan-metric-value">{planUsage?.remaining?.users ?? 0}</p>
                        </div>
                      </div>

                      {availableUpgradePlans.length > 0 ? (
                        <div className="ops-plan-actions">
                          <select
                            className="ops-plan-select"
                            value={upgradePlan}
                            onChange={(event) => {
                              setUpgradePlan(event.target.value);
                              setShowUpgradeConfirm(false);
                              setUpgradeError("");
                              setUpgradeSuccess("");
                            }}
                          >
                            {availableUpgradePlans.map((planKey) => (
                              <option key={planKey} value={planKey}>
                                {planDisplay[planKey]?.name || planKey}
                              </option>
                            ))}
                          </select>
                          <select
                            className="ops-plan-select"
                            value={billingCycle}
                            onChange={(event) => {
                              setBillingCycle(event.target.value);
                              setShowUpgradeConfirm(false);
                              setUpgradeError("");
                              setUpgradeSuccess("");
                            }}
                          >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                          <button
                            type="button"
                            className="ops-mini-btn primary"
                            onClick={() => setShowUpgradeConfirm(true)}
                            disabled={upgradeLoading || !upgradePlan}
                          >
                            {upgradeLoading ? "Upgrading..." : "Upgrade Plan"}
                          </button>
                          <span className="ops-plan-note">
                            Price: {billingCycle === "yearly" ? selectedPlanPricing?.yearly : selectedPlanPricing?.monthly}
                          </span>
                        </div>
                      ) : (
                        <p className="ops-plan-note">You are already on the highest available plan.</p>
                      )}

                      {showUpgradeConfirm && upgradePlan ? (
                        <div className="ops-confirm-box">
                          <p>
                            Confirm upgrade to <strong>{planDisplay[upgradePlan]?.name || upgradePlan}</strong> (
                            {billingCycle === "yearly" ? selectedPlanPricing?.yearly : selectedPlanPricing?.monthly})?
                          </p>
                          <div className="ops-confirm-actions">
                            <button
                              type="button"
                              className="ops-mini-btn"
                              onClick={() => setShowUpgradeConfirm(false)}
                              disabled={upgradeLoading}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="ops-mini-btn primary"
                              onClick={confirmUpgrade}
                              disabled={upgradeLoading}
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {upgradeError ? <p className="ops-inline-status error">{upgradeError}</p> : null}
                      {upgradeSuccess ? <p className="ops-inline-status success">{upgradeSuccess}</p> : null}
                    </>
                  ) : null}
                </div>
              </article>
            )}

            <div className="ops-table-grid">
              <article className="ops-table-card">
                <div className="ops-table-head">
                  <div>
                    <h3>Recent Leads</h3>
                    <p>Latest customer activity</p>
                  </div>
                  <span>{liveLeads.length} total</span>
                </div>
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveLeads.map((lead) => (
                      <tr key={`${lead.email}-${lead.name}`}>
                        <td>{lead.name}</td>
                        <td>{lead.email}</td>
                        <td>
                          <span className="ops-status-pill">{lead.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>

              <article className="ops-table-card">
                <div className="ops-table-head">
                  <div>
                    <h3>Recent Properties</h3>
                    <p>Newly added inventory</p>
                  </div>
                  <span>{liveProperties.length} total</span>
                </div>
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Location</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveProperties.map((property) => (
                      <tr key={`${property.name}-${property.location}`}>
                        <td>
                          <p className="ops-property-name">{property.name}</p>
                          <p className="ops-property-type">{property.type}</p>
                        </td>
                        <td>{property.location}</td>
                        <td className="ops-price-cell">{property.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
