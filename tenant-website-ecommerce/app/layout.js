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
  { href: "/properties", label: "Flash Sale" },
  { href: "/categories", label: "Blogs" },
  { href: "/categories", label: "All Brands" },
  { href: "/categories", label: "All categories" },
  { href: "/categories", label: "Sellers" },
  { href: "/categories", label: "Contact Us" },
];

export async function generateMetadata() {
  const data = await getTenantWebsiteData();
  const tenant = data?.tenant;
  const seo = tenant?.seo || {};
  const title = seo.title || tenant?.name || "Ecommerce Store";
  const description = seo.description || "Browse products and connect with our support team.";

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
  const tenantName = tenant?.name || "Vanguard Store";
  const tenantPhone = tenant?.website?.contactPhone || tenant?.phone || "+971 54 223 0777";
  const contactEmailPrimary = tenant?.website?.contactEmailPrimary || "osama@vanguardproperty.ae";
  const contactAddress = tenant?.website?.addressLine1 || "Emirates Islamic Bank Building Office 51B Al Nakheel, Ras al Khaimah";

  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="site-header eco-header">
            <div className="container eco-header-top">
              <Link href="/" className="brand eco-brand" aria-label={tenantName}>
                <img src={LOGO_URL} alt={tenantName} className="brand-logo-img eco-logo" />
                <div className="eco-brand-copy">
                  <strong>{tenantName}</strong>
                  <span>Active eCommerce</span>
                </div>
              </Link>

              <form action="/properties" method="get" className="eco-search" role="search" aria-label="Search products">
                <input name="q" placeholder="I am shopping for..." aria-label="Search products" />
                <button type="submit" aria-label="Search">
                  🔍
                </button>
              </form>

              <div className="eco-top-actions">
                <div className="eco-auth-wrap">
                  <HeaderAuthControl />
                </div>
                <Link href="/register" className="eco-register-link">Registration</Link>
                <Link href="/properties" className="eco-cart-link">Cart (0)</Link>
              </div>

              <MobileHeaderMenu navItems={navItems} tenantPhone={tenantPhone} tenantName={tenantName} />
            </div>

            <div className="container eco-header-bottom">
              <button type="button" className="eco-menu-button" aria-label="Open categories">☰</button>
              <nav className="eco-nav" aria-label="Main navigation">
                {navItems.map((item) => (
                  <Link key={`${item.href}-${item.label}`} href={item.href} className="eco-nav-link">
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="eco-header-right">
                <a href={`tel:${tenantPhone.replace(/\s+/g, "")}`} className="eco-phone-link">{tenantPhone}</a>
              </div>
            </div>
          </header>
          <main className="page">
            <div className="container">{children}</div>
          </main>
          <footer className="site-footer">
            <div className="footer-policy-strip">
              <div className="container footer-policy-grid">
                <Link href="/about" className="footer-policy-card">
                  <span aria-hidden="true">📄</span>
                  <strong>Terms & conditions</strong>
                </Link>
                <Link href="/contact" className="footer-policy-card">
                  <span aria-hidden="true">↩</span>
                  <strong>return policy</strong>
                </Link>
                <Link href="/contact" className="footer-policy-card">
                  <span aria-hidden="true">🎧</span>
                  <strong>Support Policy</strong>
                </Link>
                <Link href="/about" className="footer-policy-card">
                  <span aria-hidden="true">❕</span>
                  <strong>privacy policy</strong>
                </Link>
              </div>
            </div>

            <div className="footer-dark">
              <div className="container footer-dark-inner">
                <div className="footer-dark-top">
                  <div className="brand footer-brand-dark">
                    <img src={LOGO_URL} alt={tenantName} className="brand-logo-img footer-logo-img" />
                    <div className="footer-brand-copy">
                      <strong>{tenantName}</strong>
                      <span>Active eCommerce</span>
                    </div>
                  </div>

                  <div className="footer-social-area">
                    <h4>FOLLOW US</h4>
                    <div className="footer-social-row">
                      <a href="#" aria-label="Facebook">f</a>
                      <a href="#" aria-label="X">x</a>
                      <a href="#" aria-label="Instagram">ig</a>
                      <a href="#" aria-label="YouTube">▶</a>
                      <a href="#" aria-label="LinkedIn">in</a>
                    </div>
                    <h4>MOBILE APPS</h4>
                    <div className="footer-app-row">
                      <a href="#">Google Play</a>
                      <a href="#">App Store</a>
                    </div>
                  </div>
                </div>

                <div className="footer-dark-grid">
                  <div>
                    <ul className="footer-list-dark">
                      <li><Link href="/contact">Support Policy Page</Link></li>
                      <li><Link href="/contact">Return Policy Page</Link></li>
                      <li><Link href="/about">About Us</Link></li>
                      <li><Link href="/about">Privacy Policy Page</Link></li>
                      <li><Link href="/agents">Seller Policy</Link></li>
                      <li><Link href="/about">Term Conditions Page</Link></li>
                    </ul>
                  </div>

                  <div>
                    <h4>CONTACTS</h4>
                    <p className="footer-text-dark">Address</p>
                    <p className="footer-text-dark">{contactAddress}</p>
                    <p className="footer-text-dark">Phone</p>
                    <p className="footer-text-dark">{tenantPhone}</p>
                    <p className="footer-text-dark">Email</p>
                    <p className="footer-text-dark">{contactEmailPrimary}</p>
                  </div>

                  <div>
                    <h4>MY ACCOUNT</h4>
                    <ul className="footer-list-dark">
                      <li><Link href="/login">Login</Link></li>
                      <li><Link href="/profile">Order History</Link></li>
                      <li><Link href="/profile">My Wishlist</Link></li>
                      <li><Link href="/profile">Track Order</Link></li>
                      <li><Link href="/agents">Be an affiliate partner</Link></li>
                    </ul>
                  </div>

                  <div>
                    <h4>SELLER ZONE</h4>
                    <ul className="footer-list-dark">
                      <li><Link href="/agents">Become A Seller</Link></li>
                      <li><Link href="/login">Login to Seller Panel</Link></li>
                      <li><Link href="/agents">Download Seller App</Link></li>
                    </ul>

                    <h4 className="footer-subtitle">DELIVERY BOY</h4>
                    <ul className="footer-list-dark">
                      <li><Link href="/login">Login to Delivery Boy Panel</Link></li>
                      <li><Link href="/agents">Download Delivery Boy App</Link></li>
                    </ul>
                  </div>
                </div>

                <div className="copyright-dark">
                  Copyright © {new Date().getFullYear()} {tenantName}. All rights reserved.
                </div>
              </div>
            </div>
          </footer>
        </div>

        <WhatsAppAgentsDrawer agents={agents} />
      </body>
    </html>
  );
}
