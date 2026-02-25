import "./globals.css";
import Link from "next/link";
import { redirect } from "next/navigation";
import HeaderAuthControl from "@/components/HeaderAuthControl";
import MobileHeaderMenu from "@/components/MobileHeaderMenu";
import WhatsAppAgentsDrawer from "@/components/WhatsAppAgentsDrawer";
import { getPublicAgents, getSaasHomeUrl, getTenantHost, getTenantWebsiteData } from "@/lib/serverApi";

const LOGO_URL = "https://www.figma.com/api/mcp/asset/9593ce6b-d754-497b-b5eb-ae19e0f6de91";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Properties" },
  { href: "/about", label: "About us" },
  { href: "/agents", label: "Blog" },
];

export async function generateMetadata() {
  const data = await getTenantWebsiteData();
  const tenant = data?.tenant;
  const seo = tenant?.seo || {};
  const title = seo.title || tenant?.name || "Real Estate Agency";
  const description = seo.description || "Browse properties and connect with our advisory team.";

  return {
    title,
    description,
    keywords: seo.keywords || [],
  };
}

export default async function RootLayout({ children }) {
  const data = await getTenantWebsiteData();
  const tenantHost = getTenantHost();
  const saasHomeUrl = getSaasHomeUrl();
  const saasHomeHost = (() => {
    try {
      return new URL(saasHomeUrl).host.toLowerCase();
    } catch {
      return "";
    }
  })();

  if (data?._notRegisteredTenant && tenantHost && tenantHost !== saasHomeHost) {
    redirect(saasHomeUrl);
  }

  const agents = await getPublicAgents();

  const tenant = data?.tenant;
  const tenantName = tenant?.name || "Vanguard Properties";
  const tenantPhone = tenant?.website?.contactPhone || tenant?.phone || "+971 54 223 0777";
  const contactEmailPrimary = tenant?.website?.contactEmailPrimary || "osama@vanguardproperty.ae";
  const contactAddress = tenant?.website?.addressLine1 || "Emirates Islamic Bank Building Office 51B Al Nakheel, Ras al Khaimah";

  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <div className="container header-inner">
              <Link href="/" className="brand" aria-label={tenantName}>
                <img src={LOGO_URL} alt={tenantName} className="brand-logo-img" />
              </Link>

              <MobileHeaderMenu navItems={navItems} tenantPhone={tenantPhone} tenantName={tenantName} />

              <nav className="nav" aria-label="Main navigation">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="nav-link">
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="header-cta">
                <a href={`tel:${tenantPhone.replace(/\s+/g, "")}`} className="phone-link">{tenantPhone}</a>
                <Link href="/contact" className="pill-button">Contact Us</Link>
                <HeaderAuthControl />
              </div>
            </div>
          </header>
          <main className="page">
            <div className="container">{children}</div>
          </main>
          <footer className="site-footer">
            <div className="container footer-inner">
              <div className="footer-top">
                <div className="brand footer-brand">
                  <img src={LOGO_URL} alt={tenantName} className="brand-logo-img footer-logo-img" />
                </div>
                <div className="follow">Follow Us <span>f</span> <span>t</span> <span>ig</span> <span>in</span></div>
              </div>
              <div className="footer-grid">
                <div>
                  <h4>Subscribe</h4>
                  <div className="subscribe-row">
                    <input className="input footer-input" placeholder="Your e-mail" aria-label="Your e-mail" />
                    <button className="send-btn" type="button">Send</button>
                  </div>
                </div>
                <div>
                  <h4>Discover</h4>
                  <ul className="footer-list">
                    <li>Al Marjan Island</li>
                    <li>Al Hamra</li>
                    <li>Mina Al Arab</li>
                    <li>RAK Center</li>
                    <li>Abu Dhabi</li>
                  </ul>
                </div>
                <div>
                  <h4>Quick Links</h4>
                  <ul className="footer-list">
                    <li><Link href="/">Home</Link></li>
                    <li><Link href="/properties">Property</Link></li>
                    <li><Link href="/about">About us</Link></li>
                    <li><Link href="/contact">Contact us</Link></li>
                    <li><Link href="/agents">Blog</Link></li>
                  </ul>
                </div>
                <div>
                  <h4>Our Address</h4>
                  <p className="footer-text">{contactAddress}</p>
                </div>
                <div>
                  <h4>Contact Us</h4>
                  <p className="footer-text">{contactEmailPrimary}</p>
                  <p className="footer-text">{tenantPhone}</p>
                </div>
              </div>
              <div className="copyright">Copyright © {new Date().getFullYear()} Joveart Services</div>
            </div>
          </footer>
        </div>

        <WhatsAppAgentsDrawer agents={agents} />
      </body>
    </html>
  );
}
