import { getTenantWebsiteData, createPageTitle, getPublicAgents } from "@/lib/serverApi";

export async function generateMetadata() {
  const data = await getTenantWebsiteData();
  const tenantName = data?.tenant?.name;
  return {
    title: createPageTitle(tenantName, "Agents"),
    description: "Meet the property advisors supporting your next transaction.",
  };
}

export default async function AgentsPage() {
  const data = await getTenantWebsiteData();
  const tenantName = data?.tenant?.name || "Our Agency";
  const agents = await getPublicAgents();

  return (
    <div className="section">
      <div className="section-head">
        <h2>Our Blog &amp; Experts</h2>
      </div>

      <p style={{ marginTop: -8, marginBottom: 22, color: "#5f6671" }}>
        Insights and expert profiles from {tenantName}.
      </p>

      <section className="expert-grid">
        {agents.length === 0 ? (
          <article className="empty-state">
            <h3>No profiles published yet</h3>
            <p>{tenantName} has not published agent profiles yet.</p>
          </article>
        ) : (
          agents.map((agent, index) => (
            <article key={agent._id || agent.id || index} className="agent-card">
              {agent?.photoUrl ? (
                <div
                  className="agent-avatar"
                  style={{
                    backgroundImage: `url(${agent.photoUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              ) : (
                <div className="agent-avatar">👤</div>
              )}
              <h3>{agent.name}</h3>
              <p className="agent-role">
                {(agent.specialization || "Specialization not specified")}
                {agent.experience ? ` · ${agent.experience}` : ""}
              </p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
