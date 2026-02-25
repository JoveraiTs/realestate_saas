// App.js
import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL
  || (window.location.hostname.endsWith('.luxury-uaeproperty.com') ? '' : 'http://localhost:8080');

const apiUrl = (path) => `${API_BASE_URL}${path}`;

const readApiPayload = async (response) => {
  const raw = await response.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
};

const getApiErrorMessage = (response, data, fallback) => {
  if (data && typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }
  if (data && typeof data.error === 'string' && data.error.trim()) {
    return data.error;
  }
  if (!response.ok && response.status) {
    return `${fallback} (${response.status})`;
  }
  return fallback;
};

const parseItemLines = (text) => String(text || '')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [title, ...rest] = line.split('|');
    return {
      title: (title || '').trim(),
      description: rest.join('|').trim(),
    };
  })
  .filter((item) => item.title || item.description);

const toItemLines = (items) => (Array.isArray(items) ? items : [])
  .map((item) => `${item?.title || ''}|${item?.description || ''}`.trim())
  .filter(Boolean)
  .join('\n');

const parsePackageLines = (text) => String(text || '')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [title, price, ...rest] = line.split('|');
    return {
      title: (title || '').trim(),
      price: (price || '').trim(),
      description: rest.join('|').trim(),
    };
  })
  .filter((item) => item.title || item.description);

const toPackageLines = (items) => (Array.isArray(items) ? items : [])
  .map((item) => `${item?.title || ''}|${item?.price || ''}|${item?.description || ''}`.trim())
  .filter(Boolean)
  .join('\n');

const DEFAULT_FAQS = [
  { question: 'How fast can I launch my real estate website?', answer: 'Most agencies can go live in less than 30 minutes with the one-click setup and ready templates.' },
  { question: 'Can I use my own domain name?', answer: 'Yes. Pro and Enterprise plans support custom domains, and Enterprise supports multiple domains.' },
  { question: 'Does this include CRM and lead management?', answer: 'Yes. Every plan includes CRM, with more advanced capacity and automation in higher plans.' },
  { question: 'Is this suitable for luxury real estate agencies?', answer: 'Yes. The platform includes premium themes, high-end showcase layouts, and conversion-focused lead flows.' },
];

const SaasMarketingPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [registeredEmailBlocked, setRegisteredEmailBlocked] = useState(false);
  const [saasConfig, setSaasConfig] = useState(null);
  const [topAgencies, setTopAgencies] = useState([]);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');
  const [lookupWebsiteUrl, setLookupWebsiteUrl] = useState('');
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('saasTheme') || 'dark';
    if (savedTheme === 'black') return 'dark';
    if (savedTheme === 'gold') return 'light';
    return savedTheme;
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    desiredDomain: '',
    plan: 'trial',
  });

  const defaultServices = [
    { icon: '🏠', title: 'Website + Listings', description: 'Build a modern real estate website and publish properties instantly.' },
    { icon: '📞', title: 'Lead Capture CRM', description: 'Collect, assign, and follow up leads with full pipeline tracking.' },
    { icon: '📊', title: 'Sales Dashboard', description: 'Track team activity, conversion rates, and deal progress in one place.' },
    { icon: '⚡', title: 'One-Click Launch', description: 'Go live fast with your own domain, branding, and ready-to-use pages.' },
  ];

  const defaultComparisonRows = [
    { feature: 'Monthly Price', starter: 'AED 0', pro: 'AED 799', enterprise: 'AED 2,999' },
    { feature: 'User Seats', starter: '1 user', pro: 'Up to 10 users', enterprise: 'Up to 100 users' },
    { feature: 'Listing Capacity', starter: 'Up to 25 listings', pro: 'Up to 1,000 listings', enterprise: 'Up to 10,000 listings' },
    { feature: 'Domain Setup', starter: 'Subdomain only', pro: '1 custom domain', enterprise: 'Up to 5 custom domains' },
    { feature: 'Support Level', starter: 'Standard support', pro: 'Priority support', enterprise: 'Priority + SLA support' },
  ];

  const demoImages = [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80',
  ];

  const defaultHero = {
    title: 'Make Your Real Estate Website with CRM in Just One Click',
    subtitle: 'Launch a premium agency website, capture leads, and manage your full sales pipeline from one dashboard in minutes.',
    buttonText: 'Start Your Agency Setup',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
  };

  const heroTitle = saasConfig?.heroTitle || defaultHero.title;
  const heroSubtitle = saasConfig?.heroSubtitle || defaultHero.subtitle;
  const heroButtonText = saasConfig?.heroButtonText || defaultHero.buttonText;
  const heroImage = saasConfig?.heroImage || defaultHero.image;
  const serviceItems = (saasConfig?.services || defaultServices).map((item, index) => ({
    ...item,
    icon: item.icon || defaultServices[index % defaultServices.length]?.icon || '🏡',
  }));

  useEffect(() => {
    const upsertMeta = (key, value, content) => {
      if (!content) return;
      let tag = document.querySelector(`meta[${key}="${value}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(key, value);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    const upsertLink = (rel, href) => {
      if (!href) return;
      let tag = document.querySelector(`link[rel="${rel}"]`);
      if (!tag) {
        tag = document.createElement('link');
        tag.setAttribute('rel', rel);
        document.head.appendChild(tag);
      }
      tag.setAttribute('href', href);
    };

    const upsertJsonLd = (payload) => {
      const scriptId = 'saas-jsonld';
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(payload);
    };

    const fetchConfig = async () => {
      try {
        const [configResponse, agenciesResponse] = await Promise.all([
          fetch(apiUrl('/api/saas/public')),
          fetch(apiUrl('/api/tenants/top-agencies?limit=6')),
        ]);

        const data = await readApiPayload(configResponse);
        const agenciesData = await readApiPayload(agenciesResponse);

        if (configResponse.ok) {
          setSaasConfig(data);
          const seoTitle = data?.seo?.title || 'Luxury UAE Property SaaS - Real Estate Website + CRM';
          const seoDescription = data?.seo?.description || 'Launch your real estate website with CRM in one click. Capture leads, manage listings, and grow faster with luxury-ready templates.';
          const seoKeywords = Array.isArray(data?.seo?.keywords)
            ? data.seo.keywords.join(', ')
            : 'real estate crm, property website, real estate saas, agency crm, luxury property';
          const canonical = window.location.origin;

          document.title = seoTitle;
          upsertMeta('name', 'description', seoDescription);
          upsertMeta('name', 'keywords', seoKeywords);
          upsertMeta('property', 'og:title', seoTitle);
          upsertMeta('property', 'og:description', seoDescription);
          upsertMeta('property', 'og:type', 'website');
          upsertMeta('property', 'og:url', canonical);
          upsertMeta('name', 'twitter:card', 'summary_large_image');
          upsertMeta('name', 'twitter:title', seoTitle);
          upsertMeta('name', 'twitter:description', seoDescription);
          upsertLink('canonical', canonical);

          upsertJsonLd({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'SoftwareApplication',
                name: data?.brandName || 'Luxury UAE Property SaaS',
                applicationCategory: 'BusinessApplication',
                operatingSystem: 'Web',
                description: seoDescription,
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              },
              {
                '@type': 'FAQPage',
                mainEntity: DEFAULT_FAQS.map((faq) => ({
                  '@type': 'Question',
                  name: faq.question,
                  acceptedAnswer: { '@type': 'Answer', text: faq.answer },
                })),
              },
            ],
          });
        }

        if (agenciesResponse.ok && Array.isArray(agenciesData?.agencies)) {
          setTopAgencies(agenciesData.agencies);
        }
      } catch {
      }
    };

    document.title = 'Luxury UAE Property SaaS - Real Estate Website + CRM';
    fetchConfig();
  }, []);

  useEffect(() => {
    localStorage.setItem('saasTheme', theme);
  }, [theme]);

  const onInput = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
    setSuccessMessage('');
    if (e.target.name === 'email') {
      setError('');
      setAvailabilityMessage('');
      setRegisteredEmailBlocked(false);
    }
    if (e.target.name === 'email' && !lookupEmail) {
      setLookupEmail(e.target.value);
    }
  };

  const checkAvailability = async ({ showSuccessMessage = true } = {}) => {
    const email = formData.email.trim().toLowerCase();

    if (!email) {
      setError('Email is required to check availability');
      return false;
    }

    const response = await fetch(
      apiUrl(`/api/tenants/precheck?email=${encodeURIComponent(email)}`)
    );
    const data = await readApiPayload(response);

    if (!response.ok) {
      throw new Error(getApiErrorMessage(response, data, 'Availability check failed'));
    }

    if (!data?.email?.available) {
      setRegisteredEmailBlocked(true);
      setSuccess(false);
      setSuccessMessage('');
      throw new Error('Email is already registered. Use "Find your website" below.');
    }

    setRegisteredEmailBlocked(false);

    if (showSuccessMessage) {
      setAvailabilityMessage('Email is available for registration.');
    }
    return true;
  };

  const verifyEmailAvailability = async () => {
    if (!formData.email.trim()) return;
    setError('');
    setAvailabilityMessage('');
    setSuccess(false);
    setSuccessMessage('');
    try {
      await checkAvailability();
    } catch (err) {
      setError(err.message || 'Email verification failed');
    }
  };

  const findWebsiteByEmail = async () => {
    const email = lookupEmail.trim().toLowerCase();
    if (!email) {
      setLookupMessage('Please enter email address');
      setLookupWebsiteUrl('');
      return;
    }

    setLookupLoading(true);
    setLookupMessage('');
    setLookupWebsiteUrl('');
    try {
      const response = await fetch(apiUrl(`/api/tenants/find-website?email=${encodeURIComponent(email)}`));
      const data = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, data, 'Website lookup failed'));
      }

      const websiteUrl = data?.tenant?.websiteUrl || '';
      setLookupWebsiteUrl(websiteUrl);
      setLookupMessage(
        websiteUrl
          ? `Website found for ${data?.tenant?.name || 'tenant'} (${data?.tenant?.status || 'unknown'}).`
          : 'Website found, but domain is not available yet.'
      );
    } catch (err) {
      setLookupMessage(err.message || 'No website found for this email');
    } finally {
      setLookupLoading(false);
    }
  };

  const submitSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSuccessMessage('');
    setAvailabilityMessage('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Agency name, email and phone are required');
      return;
    }

    setLoading(true);
    try {
      const available = await checkAvailability({ showSuccessMessage: false });
      if (!available) {
        setSuccess(false);
        setSuccessMessage('');
        setLoading(false);
        return;
      }

      const body = new FormData();
      body.append('name', formData.name);
      body.append('email', formData.email);
      body.append('phone', formData.phone);
      body.append('desiredDomain', formData.desiredDomain);
      body.append('plan', formData.plan);

      const response = await fetch(apiUrl('/api/tenants/register'), { method: 'POST', body });
      const data = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, data, 'Signup failed'));
      }

      const registeredStatus = String(data?.tenant?.status || '').toLowerCase();
      const autoApproved = registeredStatus === 'approved';

      setSuccess(true);
      setSuccessMessage(
        autoApproved
          ? 'Signup approved automatically for Free / Trial. Check your email for your admin username and create-password link.'
          : 'Signup submitted. Tenant status is pending review.'
      );
      setFormData({
        name: '',
        email: '',
        phone: '',
        desiredDomain: '',
        plan: 'trial',
      });
    } catch (err) {
      setSuccess(false);
      setSuccessMessage('');
      setError(err.message || 'Failed to submit signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`saas-page saas-theme-${theme}`}>
      <header className="saas-nav">
        <div className="saas-nav-inner">
          <div className="saas-brand">{saasConfig?.brandName || 'JoveraITS SaaS'}</div>
          <nav className="saas-links">
            <a href="#home">Home</a>
            <a href="#services">Services</a>
            <a href="#pricing">Packages / Pricing</a>
            <a href="#compare">Compare</a>
            <a href="#demos">Top Agencies</a>
            <a href="#faq">FAQ</a>
            <a href="#signup" className="saas-cta-link">Sign Up as Agency</a>
            <div className="saas-theme-switch">
              <button
                type="button"
                className={`saas-theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => {
                  setTheme('dark');
                }}
              >
                Dark
              </button>
              <button
                type="button"
                className={`saas-theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => {
                  setTheme('light');
                }}
              >
                Light
              </button>
            </div>
          </nav>
        </div>
      </header>

      <section id="home" className="saas-hero">
        <div className="saas-container saas-hero-grid">
          <div>
            <h1>{heroTitle}</h1>
            <p>{heroSubtitle}</p>
            <a href="#signup" className="btn btn-primary">{heroButtonText}</a>
            <div className="saas-hero-points">
              <span>⚡ One-click launch</span>
              <span>🏆 Luxury-ready templates</span>
              <span>📈 CRM + lead automation</span>
            </div>
          </div>
          <div className="saas-hero-media">
            <img src={heroImage} alt="Real estate SaaS hero" className="saas-hero-photo" />
          </div>
        </div>
      </section>

      <section id="services" className="saas-section">
        <div className="saas-container">
          <h2>Services</h2>
          <div className="saas-grid">
            {serviceItems.map((item, index) => (
              <article className="saas-card" key={`service-${index}`}>
                <div className="saas-service-icon" aria-hidden="true">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="saas-section saas-muted">
        <div className="saas-container">
          <h2>Packages / Pricing</h2>
          <div className="saas-grid">
            {(saasConfig?.packages || [
              { title: 'Free / Trial', price: 'AED 0 / month', description: '1 admin user, up to 25 listings, subdomain only, basic CRM and website pages.' },
              { title: 'Pro', price: 'AED 799 / month', description: 'Up to 10 users, 1 custom domain, up to 1,000 listings, advanced CRM and SEO controls.' },
              { title: 'Enterprise', price: 'AED 2,999 / month', description: 'Up to 100 users, up to 5 custom domains, up to 10,000 listings, priority support and enterprise controls.' },
            ]).map((item, index) => (
              <article className="saas-card" key={`package-${index}`}>
                <h3>{item.title}</h3>
                {item.price && <p className="saas-package-price">{item.price}</p>}
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="compare" className="saas-section">
        <div className="saas-container">
          <h2>Feature Comparison</h2>
          <div className="saas-compare-wrap">
            <table className="saas-compare-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Starter</th>
                  <th>Pro</th>
                  <th>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {defaultComparisonRows.map((row) => (
                  <tr key={row.feature}>
                    <td>{row.feature}</td>
                    <td>{row.starter}</td>
                    <td>{row.pro}</td>
                    <td>{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="demos" className="saas-section">
        <div className="saas-container">
          <h2>Our Top Agencies</h2>
          <div className="saas-grid">
            {(topAgencies.length > 0 ? topAgencies : [
              { name: 'Royal Palm Estates', description: 'Luxury villa specialists with high-converting listing funnels.' },
              { name: 'Skyline Prime Realty', description: 'Premium urban property agency with strong lead automation.' },
              { name: 'Prestige Commercial Group', description: 'Top-performing commercial advisory with enterprise workflows.' },
            ]).map((item, index) => (
              <article className="saas-card" key={`agency-${item.id || index}`}>
                <img src={item.logoUrl || demoImages[index % demoImages.length]} alt={item.name} className="saas-demo-photo" />
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                {item.websiteUrl && (
                  <a
                    href={item.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline"
                  >
                    View Website
                  </a>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="saas-section saas-muted">
        <div className="saas-container">
          <h2>Frequently Asked Questions</h2>
          <div className="saas-faq-list">
            {DEFAULT_FAQS.map((faq) => (
              <article className="saas-faq-card" key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="signup" className="saas-section saas-muted">
        <div className="saas-container saas-signup-wrap">
          <h2>Sign Up as Agency</h2>
          <form className="saas-signup-form" onSubmit={submitSignup}>
            <div className="saas-signup-card">
              <div className="saas-form-grid">
                <div className="saas-field">
                  <label>Agency Name</label>
                  <input name="name" value={formData.name} onChange={onInput} placeholder="Your Agency Name" required />
                </div>
                <div className="saas-field">
                  <label>Email Address</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={onInput}
                    onBlur={verifyEmailAvailability}
                    placeholder="name@agency.com"
                    required
                  />
                </div>
                <div className="saas-field">
                  <label>Phone Number</label>
                  <input name="phone" value={formData.phone} onChange={onInput} placeholder="+971..." required />
                </div>
                <div className="saas-field">
                  <label>Desired Domain</label>
                  <input name="desiredDomain" value={formData.desiredDomain} onChange={onInput} placeholder="youragency.com (optional)" />
                </div>
                <div className="saas-field">
                  <label>Plan</label>
                  <select name="plan" value={formData.plan} onChange={onInput}>
                    <option value="trial">Free / Trial</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              {availabilityMessage && <div className="saas-success">{availabilityMessage}</div>}
              {error && <div className="error-message">{error}</div>}
              {success && <div className="saas-success">{successMessage}</div>}
              <button className="btn btn-primary saas-submit-btn" type="submit" disabled={loading || registeredEmailBlocked}>
                {loading ? 'Submitting...' : 'Submit Agency Signup'}
              </button>

              <div className="saas-lookup-box">
                <h3>Find your website using email address</h3>
                <div className="saas-lookup-row">
                  <input
                    type="email"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    placeholder="name@agency.com"
                  />
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={findWebsiteByEmail}
                    disabled={lookupLoading}
                  >
                    {lookupLoading ? 'Searching...' : 'Find Website'}
                  </button>
                </div>
                {lookupMessage && <p>{lookupMessage}</p>}
                {lookupWebsiteUrl && (
                  <a href={lookupWebsiteUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                    Open Website
                  </a>
                )}
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

const SuperAdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/api/auth/master/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, data, 'Super admin login failed'));
      }

      localStorage.setItem('masterAuth', JSON.stringify({
        token: data.token,
        user: data.user,
      }));

      window.location.href = data.redirectTo || '/super-admin';
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sa-page">
      <div className="sa-login-card">
        <h2>Super Admin Login</h2>
        <p>Review and approve pending tenants</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@testrealestate.com"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="form-input"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

const SuperAdminDashboard = ({ session }) => {
  const [tenants, setTenants] = useState([]);
  const [saasDraft, setSaasDraft] = useState({
    brandName: '',
    heroTitle: '',
    heroSubtitle: '',
    heroButtonText: '',
    servicesText: '',
    packagesText: '',
    demosText: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState('');
  const [error, setError] = useState('');
  const [domainMessage, setDomainMessage] = useState('');
  const [customDomainDrafts, setCustomDomainDrafts] = useState({});
  const [busyId, setBusyId] = useState('');
  const [domainBusyId, setDomainBusyId] = useState('');
  const [tenantFilter, setTenantFilter] = useState('pending');
  const [tenantServicesView, setTenantServicesView] = useState(
    window.location.pathname.includes('/custom-domains') ? 'custom-domains' : 'approvals'
  );
  const [websiteServicesView, setWebsiteServicesView] = useState(
    window.location.pathname.includes('/package-pricing') ? 'package-pricing' : 'content'
  );
  const [activePage, setActivePage] = useState(
    window.location.pathname.includes('/website-services') ? 'website-services' : 'tenant-services'
  );

  const token = session?.token;

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(apiUrl('/api/tenants'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, data, 'Failed to fetch tenants'));
      }
      const list = (Array.isArray(data) ? data : []).map((tenant) => ({
        ...tenant,
        _id: tenant._id || tenant.id,
      }));
      setTenants(list);
      setCustomDomainDrafts((prev) => {
        const next = { ...prev };
        list.forEach((tenant) => {
          if (typeof next[tenant._id] !== 'string') {
            next[tenant._id] =
              (Array.isArray(tenant.customDomains) && tenant.customDomains[0])
              || tenant.requestedDomain
              || '';
          }
        });
        return next;
      });
    } catch (err) {
      setError(err.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const fetchSaasConfig = useCallback(async () => {
    try {
      setConfigLoading(true);
      const response = await fetch(apiUrl('/api/saas/admin'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, data, 'Failed to load SaaS config'));
      }

      setSaasDraft({
        brandName: data.brandName || '',
        heroTitle: data.heroTitle || '',
        heroSubtitle: data.heroSubtitle || '',
        heroButtonText: data.heroButtonText || '',
        servicesText: toItemLines(data.services || []),
        packagesText: toPackageLines(data.packages || []),
        demosText: toItemLines(data.demoWebsites || []),
        seoTitle: data.seo?.title || '',
        seoDescription: data.seo?.description || '',
        seoKeywords: Array.isArray(data.seo?.keywords) ? data.seo.keywords.join(', ') : '',
      });
    } catch (err) {
      setError(err.message || 'Failed to load SaaS config');
    } finally {
      setConfigLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSaasConfig();
  }, [fetchSaasConfig]);

  useEffect(() => {
    const syncPageFromPath = () => {
      setActivePage(window.location.pathname.includes('/website-services') ? 'website-services' : 'tenant-services');
      setTenantServicesView(window.location.pathname.includes('/custom-domains') ? 'custom-domains' : 'approvals');
      setWebsiteServicesView(window.location.pathname.includes('/package-pricing') ? 'package-pricing' : 'content');
    };
    window.addEventListener('popstate', syncPageFromPath);
    return () => window.removeEventListener('popstate', syncPageFromPath);
  }, []);

  const approveTenant = async (tenant) => {
    try {
      setBusyId(tenant._id);
      const response = await fetch(apiUrl(`/api/tenants/approve/${tenant._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: tenant.requestedPlan || tenant.plan || 'trial',
          adminEmail: tenant.email,
          websiteTheme: tenant.websiteTheme || 'black',
          seo: {
            title: tenant.seo?.title || '',
            description: tenant.seo?.description || '',
            keywords: Array.isArray(tenant.seo?.keywords) ? tenant.seo.keywords : [],
          },
        }),
      });
      const data = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, data, 'Approval failed'));
      }
      await fetchTenants();
    } catch (err) {
      setError(err.message || 'Approval failed');
    } finally {
      setBusyId('');
    }
  };

  const rejectTenant = async (tenant) => {
    const note = window.prompt('Reason / requested info for rejection:', 'Please provide complete details.');
    if (note === null) return;

    try {
      setBusyId(tenant._id);
      const response = await fetch(apiUrl(`/api/tenants/reject/${tenant._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note }),
      });
      const data = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, data, 'Rejection failed'));
      }
      await fetchTenants();
    } catch (err) {
      setError(err.message || 'Rejection failed');
    } finally {
      setBusyId('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('masterAuth');
    window.location.href = '/super-admin/login';
  };

  const updateCustomDomainDraft = (tenantId, value) => {
    setCustomDomainDrafts((prev) => ({
      ...prev,
      [tenantId]: value,
    }));
  };

  const saveCustomDomain = async (tenant) => {
    const domain = (customDomainDrafts[tenant._id] || '').trim();
    if (!domain) {
      setError('Custom domain is required');
      return;
    }

    try {
      setError('');
      setDomainMessage('');
      setDomainBusyId(tenant._id);
      const response = await fetch(apiUrl(`/api/tenants/custom-domain/${tenant._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ domain }),
      });
      const data = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, data, 'Failed to save custom domain'));
      }

      setDomainMessage(`Custom domain updated for ${tenant.name}.`);
      await fetchTenants();
    } catch (err) {
      setError(err.message || 'Failed to save custom domain');
    } finally {
      setDomainBusyId('');
    }
  };

  const verifyCustomDomain = async (tenant) => {
    const domain = (customDomainDrafts[tenant._id] || '').trim();
    if (!domain) {
      setError('Custom domain is required to verify');
      return;
    }

    try {
      setError('');
      setDomainMessage('');
      setDomainBusyId(tenant._id);
      const response = await fetch(apiUrl(`/api/tenants/verify-domain/${tenant._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ domain }),
      });
      const data = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, data, 'Failed to verify domain'));
      }

      setDomainMessage(`Domain verified for ${tenant.name}.`);
      await fetchTenants();
    } catch (err) {
      setError(err.message || 'Failed to verify domain');
    } finally {
      setDomainBusyId('');
    }
  };

  const updateSaasDraft = (key, value) => {
    setSaasDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveSaasConfig = async (e) => {
    e.preventDefault();
    setConfigMessage('');
    setError('');
    setConfigSaving(true);

    try {
      const response = await fetch(apiUrl('/api/saas/admin'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brandName: saasDraft.brandName,
          heroTitle: saasDraft.heroTitle,
          heroSubtitle: saasDraft.heroSubtitle,
          heroButtonText: saasDraft.heroButtonText,
          services: parseItemLines(saasDraft.servicesText),
          packages: parsePackageLines(saasDraft.packagesText),
          demoWebsites: parseItemLines(saasDraft.demosText),
          seo: {
            title: saasDraft.seoTitle,
            description: saasDraft.seoDescription,
            keywords: saasDraft.seoKeywords
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
          },
        }),
      });
      const data = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, data, 'Failed to save SaaS config'));
      }
      setConfigMessage('SaaS website settings saved successfully.');
      fetchSaasConfig();
    } catch (err) {
      setError(err.message || 'Failed to save SaaS config');
    } finally {
      setConfigSaving(false);
    }
  };

  const statusCounts = tenants.reduce((acc, tenant) => {
    const status = tenant.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { pending: 0, approved: 0, rejected: 0 });

  const filteredTenants = tenants.filter((tenant) => (tenant.status || 'pending') === tenantFilter);
  const approvedTenants = tenants.filter((tenant) => (tenant.status || 'pending') === 'approved');

  const goToAdminPage = (page, tenantView = 'approvals', websiteView = 'content') => {
    const nextPath = page === 'website-services'
      ? websiteView === 'package-pricing'
        ? '/super-admin/website-services/package-pricing'
        : '/super-admin/website-services'
      : tenantView === 'custom-domains'
        ? '/super-admin/tenant-services/custom-domains'
        : '/super-admin/tenant-services';
    window.history.pushState({}, '', nextPath);
    setActivePage(page);
    if (page === 'tenant-services') {
      setTenantServicesView(tenantView);
    } else if (page === 'website-services') {
      setWebsiteServicesView(websiteView);
    }
  };

  return (
    <div className="sa-page">
      <div className="sa-container sa-layout">
        <aside className="sa-sidebar">
          <div className="sa-sidebar-brand">Super Admin</div>
          <div className="sa-sidebar-group">
            <p>Tenant Services</p>
            <button
              type="button"
              className={`sa-side-link ${activePage === 'tenant-services' && tenantServicesView === 'approvals' ? 'active' : ''}`}
              onClick={() => {
                goToAdminPage('tenant-services', 'approvals');
                setTenantFilter('pending');
              }}
            >
              Tenant Approvals
            </button>
            <button
              type="button"
              className={`sa-side-link ${activePage === 'tenant-services' && tenantServicesView === 'custom-domains' ? 'active' : ''}`}
              onClick={() => goToAdminPage('tenant-services', 'custom-domains')}
            >
              Custom Domains
            </button>
          </div>

          <div className="sa-sidebar-group">
            <p>Website Services</p>
            <button
              type="button"
              className={`sa-side-link ${activePage === 'website-services' && websiteServicesView === 'content' ? 'active' : ''}`}
              onClick={() => goToAdminPage('website-services', 'approvals', 'content')}
            >
              Website Content
            </button>
            <button
              type="button"
              className={`sa-side-link ${activePage === 'website-services' && websiteServicesView === 'package-pricing' ? 'active' : ''}`}
              onClick={() => goToAdminPage('website-services', 'approvals', 'package-pricing')}
            >
              Package & Pricing
            </button>
          </div>

          <button className="btn btn-outline" type="button" onClick={handleLogout}>Logout</button>
        </aside>

        <div className="sa-main">
          <div className="sa-header">
            <div>
              <h1>Super Admin Dashboard</h1>
              <p>
                {activePage === 'tenant-services'
                  ? 'Tenant Services page - manage pending, approved, and rejected tenants'
                  : websiteServicesView === 'package-pricing'
                    ? 'Package & Pricing page - manage package names, price, and descriptions'
                    : 'Website Services page - manage SaaS website customization and SEO'}
              </p>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {activePage === 'tenant-services' ? (
            <>
              {tenantServicesView === 'approvals' ? (
                <>
                  <section id="tenant-management">
                    <div className="sa-status-tabs">
                      <button
                        type="button"
                        className={`sa-status-tab ${tenantFilter === 'pending' ? 'active' : ''}`}
                        onClick={() => setTenantFilter('pending')}
                      >
                        Pending ({statusCounts.pending || 0})
                      </button>
                      <button
                        type="button"
                        className={`sa-status-tab ${tenantFilter === 'approved' ? 'active' : ''}`}
                        onClick={() => setTenantFilter('approved')}
                      >
                        Approved ({statusCounts.approved || 0})
                      </button>
                      <button
                        type="button"
                        className={`sa-status-tab ${tenantFilter === 'rejected' ? 'active' : ''}`}
                        onClick={() => setTenantFilter('rejected')}
                      >
                        Rejected ({statusCounts.rejected || 0})
                      </button>
                    </div>
                  </section>

                  {loading ? (
                    <div className="sa-empty">Loading tenants...</div>
                  ) : filteredTenants.length === 0 ? (
                    <div className="sa-empty">No {tenantFilter} tenants.</div>
                  ) : (
                    <div className="sa-table-wrap">
                      <table className="sa-table">
                        <thead>
                          <tr>
                            <th>Agency</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Subdomain</th>
                            <th>Domain</th>
                            <th>Custom Domains</th>
                            <th>Requested Domain</th>
                            <th>Requested Plan</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTenants.map((tenant) => (
                            <tr key={tenant._id}>
                              <td>{tenant.name}</td>
                              <td>{tenant.email}</td>
                              <td>{tenant.phone || '-'}</td>
                              <td>{tenant.subdomain || '-'}</td>
                              <td>{tenant.domain || '-'}</td>
                              <td>
                                {Array.isArray(tenant.customDomains) && tenant.customDomains.length > 0
                                  ? tenant.customDomains.join(', ')
                                  : '-'}
                              </td>
                              <td>{tenant.requestedDomain || '-'}</td>
                              <td>{tenant.requestedPlan || tenant.plan || '-'}</td>
                              <td>{tenant.status || 'pending'}</td>
                              <td className="sa-actions">
                                {tenant.status !== 'approved' && (
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => approveTenant(tenant)}
                                    disabled={busyId === tenant._id}
                                  >
                                    Approve
                                  </button>
                                )}
                                {tenant.status !== 'rejected' && (
                                  <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => rejectTenant(tenant)}
                                    disabled={busyId === tenant._id}
                                  >
                                    Reject / Request Info
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="sa-config-card sa-domain-card" id="custom-domain-management">
                  <div className="sa-config-head">
                    <h2>Custom Domain Management</h2>
                    <p>Add and verify custom domains for approved tenants.</p>
                  </div>

                  {domainMessage && <div className="sa-success">{domainMessage}</div>}

                  {approvedTenants.length === 0 ? (
                    <div className="sa-empty">No approved tenants available for custom domain setup.</div>
                  ) : (
                    <div className="sa-table-wrap sa-domain-table-wrap">
                      <table className="sa-table">
                        <thead>
                          <tr>
                            <th>Agency</th>
                            <th>Default Domain</th>
                            <th>Current Custom Domains</th>
                            <th>Custom Domain</th>
                            <th>Verification</th>
                            <th>Visit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {approvedTenants.map((tenant) => (
                            <tr key={`domain-${tenant._id}`}>
                              <td>{tenant.name}</td>
                              <td>{tenant.domain || '-'}</td>
                              <td>
                                {Array.isArray(tenant.customDomains) && tenant.customDomains.length > 0
                                  ? tenant.customDomains.join(', ')
                                  : '-'}
                              </td>
                              <td className="sa-domain-input-cell">
                                <input
                                  type="text"
                                  value={customDomainDrafts[tenant._id] || ''}
                                  onChange={(e) => updateCustomDomainDraft(tenant._id, e.target.value)}
                                  placeholder="example.com"
                                />
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={() => saveCustomDomain(tenant)}
                                  disabled={domainBusyId === tenant._id}
                                >
                                  Save Domain
                                </button>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  onClick={() => verifyCustomDomain(tenant)}
                                  disabled={domainBusyId === tenant._id}
                                >
                                  Mark Verified
                                </button>
                              </td>
                              <td>
                                <a
                                  className="btn btn-outline"
                                  href={`https://${(customDomainDrafts[tenant._id] || tenant.domain || '').trim()}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Visit Site
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : websiteServicesView === 'content' ? (
            <div className="sa-config-card" id="saas-config">
              <div className="sa-config-head">
                <h2>SaaS Website Customization + SEO</h2>
                <p>Manage global homepage content shown on root domain.</p>
              </div>

              {configLoading ? (
                <div className="sa-empty">Loading SaaS website settings...</div>
              ) : (
                <form className="sa-config-form" onSubmit={saveSaasConfig}>
                  <div className="sa-config-grid">
                    <input
                      type="text"
                      value={saasDraft.brandName}
                      onChange={(e) => updateSaasDraft('brandName', e.target.value)}
                      placeholder="Brand name"
                    />
                    <input
                      type="text"
                      value={saasDraft.heroButtonText}
                      onChange={(e) => updateSaasDraft('heroButtonText', e.target.value)}
                      placeholder="Hero button text"
                    />
                  </div>

                  <input
                    type="text"
                    value={saasDraft.heroTitle}
                    onChange={(e) => updateSaasDraft('heroTitle', e.target.value)}
                    placeholder="Hero title"
                  />

                  <textarea
                    rows={3}
                    value={saasDraft.heroSubtitle}
                    onChange={(e) => updateSaasDraft('heroSubtitle', e.target.value)}
                    placeholder="Hero subtitle"
                  />

                  <textarea
                    rows={4}
                    value={saasDraft.servicesText}
                    onChange={(e) => updateSaasDraft('servicesText', e.target.value)}
                    placeholder="Services items: one per line as Title|Description"
                  />

                  <textarea
                    rows={4}
                    value={saasDraft.demosText}
                    onChange={(e) => updateSaasDraft('demosText', e.target.value)}
                    placeholder="Demo website items: one per line as Title|Description"
                  />

                  <input
                    type="text"
                    value={saasDraft.seoTitle}
                    onChange={(e) => updateSaasDraft('seoTitle', e.target.value)}
                    placeholder="SEO title"
                  />

                  <textarea
                    rows={3}
                    value={saasDraft.seoDescription}
                    onChange={(e) => updateSaasDraft('seoDescription', e.target.value)}
                    placeholder="SEO description"
                  />

                  <input
                    type="text"
                    value={saasDraft.seoKeywords}
                    onChange={(e) => updateSaasDraft('seoKeywords', e.target.value)}
                    placeholder="SEO keywords (comma separated)"
                  />

                  {configMessage && <div className="sa-success">{configMessage}</div>}

                  <button className="btn btn-primary" type="submit" disabled={configSaving}>
                    {configSaving ? 'Saving...' : 'Save SaaS Website Settings'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="sa-config-card" id="saas-packages">
              <div className="sa-config-head">
                <h2>Package & Pricing Management</h2>
                <p>Manage package title, price, and description for the SaaS landing page.</p>
              </div>

              {configLoading ? (
                <div className="sa-empty">Loading package settings...</div>
              ) : (
                <form className="sa-config-form" onSubmit={saveSaasConfig}>
                  <textarea
                    rows={8}
                    value={saasDraft.packagesText}
                    onChange={(e) => updateSaasDraft('packagesText', e.target.value)}
                    placeholder="One package per line: Title|Price|Description"
                  />

                  <div className="sa-empty">
                    Example: Pro|AED 299/month|Custom domain, CRM, and website builder included.
                  </div>

                  {configMessage && <div className="sa-success">{configMessage}</div>}

                  <button className="btn btn-primary" type="submit" disabled={configSaving}>
                    {configSaving ? 'Saving...' : 'Save Package & Pricing'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Login Page Component
const LoginPage = ({ tenantData }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      // Add actual login API call here
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await readApiPayload(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, data, 'Login failed'));
      }

      localStorage.setItem('tenantAuth', JSON.stringify({
        token: data.token,
        user: data.user,
        tenant: data.tenant,
      }));
      console.log('Login successful:', data);
      window.location.href = data.redirectTo || '/dashboard';
      
    } catch (err) {
      setLoginError(err.message || 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left side - Branding */}
        <div className="login-brand">
          <div className="brand-content">
            <div className="brand-logo">
              {tenantData.logo ? (
                <img src={tenantData.logo} alt={tenantData.name} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              )}
            </div>
            <h1 className="brand-title">Welcome back to</h1>
            <h2 className="brand-subtitle">{tenantData.name}</h2>
            
            <div className="brand-details">
              <div className="detail-item">
                <span className="detail-label">Your CRM Domain</span>
                <span className="detail-value">
                  {tenantData.subdomain}.luxury-uaeproperty.com
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Current Plan</span>
                <span className="detail-value plan-badge">
                  {tenantData.plan}
                  {tenantData.trialActive && (
                    <span className="trial-indicator">Trial</span>
                  )}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className={`detail-value status-badge status-${tenantData.status}`}>
                  {tenantData.status}
                </span>
              </div>
            </div>

            {tenantData.trialActive && (
              <div className="trial-notice">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <div>
                  <strong>Trial ends in:</strong>
                  <span>
                    {Math.ceil((new Date(tenantData.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="login-form-container">
          <div className="form-wrapper">
            <div className="form-header">
              <h2>Sign in to your account</h2>
              <p>Welcome back! Please enter your details</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@testrealty.com"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me for 30 days</span>
                </label>
                <a href="/forgot-password" className="forgot-link">
                  Forgot password?
                </a>
              </div>

              {loginError && (
                <div className="error-message">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                  </svg>
                  {loginError}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                Having trouble signing in? <a href="/support">Contact support</a>
              </p>
            </div>

            <div className="security-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Secured by enterprise-grade encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = ({ session, tenantData }) => {
  const user = session?.user || {};
  const tenant = session?.tenant || {};
  const isAdminUser = ['admin', 'super_admin'].includes(String(user.role || '').toLowerCase());

  const dashboardTenantName = tenantData?.name || tenant?.name || 'Tenant CRM';
  const dashboardPlan = tenantData?.plan || tenant?.plan || 'basic';
  const dashboardSubdomain = tenantData?.subdomain || tenant?.subdomain || 'tenant';
  const [planUsage, setPlanUsage] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [targetPlan, setTargetPlan] = useState('pro');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);

  const planOrder = { free: 1, pro: 2, enterprise: 3 };
  const planMeta = {
    pro: { name: 'Pro', monthly: 799, yearly: 799 * 12 },
    enterprise: { name: 'Enterprise', monthly: 2999, yearly: 2999 * 12 },
  };
  const currentPlanKey = String(planUsage?.plan?.key || dashboardPlan || '').toLowerCase();
  const displayPlan = planUsage?.plan?.name || dashboardPlan;
  const selectedPlanMeta = planMeta[targetPlan] || { name: targetPlan, monthly: 0, yearly: 0 };
  const selectedPrice = billingCycle === 'yearly' ? selectedPlanMeta.yearly : selectedPlanMeta.monthly;

  const fetchPlanUsage = useCallback(async () => {
    if (!isAdminUser || !session?.token) return;

    setPlanLoading(true);
    setPlanError('');
    try {
      const response = await fetch(apiUrl(`/api/dashboard/plan-usage?subdomain=${encodeURIComponent(dashboardSubdomain)}`), {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });
      const data = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, data, 'Failed to load plan usage'));
      }
      setPlanUsage(data);
    } catch (err) {
      setPlanError(err.message || 'Failed to load plan usage');
    } finally {
      setPlanLoading(false);
    }
  }, [dashboardSubdomain, isAdminUser, session?.token]);

  useEffect(() => {
    fetchPlanUsage();
  }, [fetchPlanUsage]);

  const handleUpgradePlan = async () => {
    if (!session?.token) return;

    setUpgradeLoading(true);
    setUpgradeError('');
    setUpgradeMessage('');

    try {
      const response = await fetch(apiUrl(`/api/dashboard/upgrade-plan?subdomain=${encodeURIComponent(dashboardSubdomain)}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          plan: targetPlan,
          billingCycle,
        }),
      });

      const data = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, data, 'Failed to upgrade plan'));
      }

      setUpgradeMessage(data?.message || 'Plan upgraded successfully');
      if (data?.planUsage) {
        setPlanUsage(data.planUsage);
      } else {
        await fetchPlanUsage();
      }
    } catch (err) {
      setUpgradeError(err.message || 'Failed to upgrade plan');
    } finally {
      setUpgradeLoading(false);
      setShowUpgradeConfirm(false);
    }
  };

  const openUpgradeConfirm = () => {
    setUpgradeError('');
    setUpgradeMessage('');
    setShowUpgradeConfirm(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('tenantAuth');
    window.location.href = '/';
  };

  return (
    <div className="tenant-dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>{dashboardTenantName}</h2>
          <p>{dashboardSubdomain}.luxury-uaeproperty.com</p>
        </div>

        <nav className="sidebar-nav">
          <button className="sidebar-link active" type="button">Dashboard</button>
          <button className="sidebar-link" type="button">Properties</button>
          <button className="sidebar-link" type="button">Leads</button>
          <button className="sidebar-link" type="button">Clients</button>
          <button className="sidebar-link" type="button">Settings</button>
        </nav>

        <button className="btn btn-outline sidebar-logout" type="button" onClick={handleLogout}>
          Sign out
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Tenant Dashboard</h1>
            <p>Welcome back, {user.name || 'User'}</p>
          </div>
          <div className="dashboard-plan">Plan: {displayPlan}</div>
        </header>

        {isAdminUser && (
          <section className="dashboard-panel">
            <h3>Plan Usage & Upgrade</h3>

            {planLoading && <div className="sa-empty">Loading plan usage...</div>}
            {planError && <div className="error-message">{planError}</div>}

            {planUsage && (
              <>
                <ul>
                  <li><strong>Users:</strong> {planUsage.usage?.usersUsed ?? 0} / {planUsage.limits?.maxUsers ?? 0}</li>
                  <li><strong>Listings:</strong> {planUsage.usage?.listingsUsed ?? 0} / {planUsage.limits?.maxListings ?? 0}</li>
                  <li><strong>Custom domains:</strong> {planUsage.usage?.customDomainsUsed ?? 0} / {planUsage.limits?.maxCustomDomains ?? 0}</li>
                </ul>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                  <select value={targetPlan} onChange={(e) => setTargetPlan(e.target.value)}>
                    <option value="pro" disabled={(planOrder[currentPlanKey] || 0) >= planOrder.pro}>Pro</option>
                    <option value="enterprise" disabled={(planOrder[currentPlanKey] || 0) >= planOrder.enterprise}>Enterprise</option>
                  </select>

                  <select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value)}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={openUpgradeConfirm}
                    disabled={upgradeLoading || (planOrder[targetPlan] || 0) <= (planOrder[currentPlanKey] || 0)}
                  >
                    {upgradeLoading ? 'Upgrading...' : 'Upgrade Plan'}
                  </button>
                </div>

                {showUpgradeConfirm && (
                  <div style={{ marginTop: '12px', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px', background: '#fff' }}>
                    <p style={{ margin: '0 0 8px 0' }}>
                      Confirm upgrade to <strong>{selectedPlanMeta.name}</strong> ({billingCycle}) for <strong>AED {selectedPrice.toLocaleString()}</strong>{billingCycle === 'monthly' ? ' / month' : ' / year'}?
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" className="btn btn-primary" onClick={handleUpgradePlan} disabled={upgradeLoading}>
                        {upgradeLoading ? 'Processing...' : 'Confirm Upgrade'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setShowUpgradeConfirm(false)}
                        disabled={upgradeLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {upgradeError && <div className="error-message">{upgradeError}</div>}
                {upgradeMessage && <div className="sa-success">{upgradeMessage}</div>}
              </>
            )}
          </section>
        )}

        <section className="dashboard-cards">
          <div className="dashboard-card">
            <h3>Active Properties</h3>
            <p>24</p>
          </div>
          <div className="dashboard-card">
            <h3>New Leads</h3>
            <p>18</p>
          </div>
          <div className="dashboard-card">
            <h3>Scheduled Visits</h3>
            <p>7</p>
          </div>
          <div className="dashboard-card">
            <h3>Conversion Rate</h3>
            <p>32%</p>
          </div>
        </section>

        <section className="dashboard-panel">
          <h3>Today Overview</h3>
          <ul>
            <li>3 new tenant inquiries received from website form.</li>
            <li>2 follow-ups due before 5:00 PM.</li>
            <li>1 property listing pending approval.</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

// Registration Page Component
const RegistrationPage = ({ apiError }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    desiredDomain: '',
    plan: 'trial',
  });

  const [logo, setLogo] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo size should be less than 2MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Company name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      return 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) return 'Phone is required';
    if (!/^\+?[0-9]{7,15}$/.test(formData.phone.trim())) {
      return 'Please enter a valid phone number';
    }
    if (!logo) return 'Company logo is required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('email', formData.email);
    submitData.append('phone', formData.phone);
    submitData.append('desiredDomain', formData.desiredDomain);
    submitData.append('plan', formData.plan);
    submitData.append('logo', logo);

    try {
      console.log('Sending registration request to:', apiUrl('/api/tenants/register'));
      
      const response = await fetch(apiUrl('/api/tenants/register'), {
        method: 'POST',
        body: submitData
      });

      const responseData = await readApiPayload(response);
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return;
      }

      const errorMessage = getApiErrorMessage(response, responseData, `HTTP Error ${response.status}: ${response.statusText}`);

      throw new Error(errorMessage);
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || `Failed to connect to server. Make sure API is running at ${API_BASE_URL}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="registration-page">
        <div className="registration-container">
          <div className="success-state-large">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Registration Successful!</h2>
            <p>Thank you for registering with EstateCRM.</p>
            <p className="redirect-message">Redirecting to login page...</p>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-page">
      <div className="registration-container">
        <div className="registration-header">
          <div className="logo">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>EstateCRM</span>
          </div>
          <h2>Get started with your CRM</h2>
          <p>Join 500+ real estate agencies using EstateCRM</p>
        </div>

        {/* Show API Error if any */}
        {apiError && (
          <div className="api-error-details">
            <h4>API Connection Details:</h4>
            <p>{apiError}</p>
            <p className="api-error-help">
              Make sure your backend server is running at <strong>{API_BASE_URL}</strong>
            </p>
          </div>
        )}

        <div className="registration-form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Company Logo <span className="required">*</span></label>
              <div className="logo-upload">
                <div className="logo-preview">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                  )}
                </div>
                <div className="upload-controls">
                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={handleLogoChange}
                    hidden
                  />
                  <label htmlFor="logo" className="btn btn-outline">
                    Choose Logo
                  </label>
                  <span className="file-name">
                    {logo ? logo.name : 'No file chosen'}
                  </span>
                </div>
              </div>
              <small>Maximum file size: 2MB</small>
            </div>

            <div className="form-group">
              <label>Company Name <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Luxury Homes Realty"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Email Address <span className="required">*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="contact@company.com"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Phone Number <span className="required">*</span></label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+971501234567"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Desired Custom Domain (Optional)</label>
              <input
                type="text"
                name="desiredDomain"
                value={formData.desiredDomain}
                onChange={handleInputChange}
                placeholder="abcd.com"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Selected Plan <span className="required">*</span></label>
              <select
                name="plan"
                value={formData.plan}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="trial">Free / Trial</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            {error && (
              <div className="error-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                </svg>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Registering...
                </>
              ) : (
                'Register Your CRM'
              )}
            </button>

            <div className="trial-info">
              ✓ 14-day free trial included • ✓ Cancel anytime • ✓ No credit card required
            </div>
          </form>
        </div>

        <div className="registration-footer">
          <p>Already have an account? <button type="button" className="link-button" onClick={() => window.location.reload()}>Sign in</button></p>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [tenantData, setTenantData] = useState(null);
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(true);

  const pathname = window.location.pathname;
  const host = window.location.hostname;
  const isRootHost = host === 'luxury-uaeproperty.com' || host === 'www.luxury-uaeproperty.com' || host === 'localhost';
  const isSuperAdminPath = pathname.startsWith('/super-admin');

  useEffect(() => {
    if (isRootHost || isSuperAdminPath) {
      setLoading(false);
      return;
    }

    const resolveTenant = async () => {
      try {
        setLoading(true);
        setApiError('');
        const subdomain = host.split('.')[0];
        const query = subdomain ? `?subdomain=${encodeURIComponent(subdomain)}` : '';
        const response = await fetch(apiUrl(`/api/tenants/resolve${query}`));
        const data = await readApiPayload(response);
        if (!response.ok) {
          if (response.status === 404 && data?.redirectTo) {
            window.location.href = data.redirectTo;
            return;
          }
          throw new Error(getApiErrorMessage(response, data, 'Unable to resolve tenant'));
        }
        setTenantData(data?.tenant || data);
      } catch (err) {
        setApiError(err.message || 'Unable to connect to tenant API');
      } finally {
        setLoading(false);
      }
    };

    resolveTenant();
  }, [host, isRootHost, isSuperAdminPath]);

  const masterSession = (() => {
    try {
      return JSON.parse(localStorage.getItem('masterAuth') || 'null');
    } catch {
      return null;
    }
  })();

  const tenantSession = (() => {
    try {
      return JSON.parse(localStorage.getItem('tenantAuth') || 'null');
    } catch {
      return null;
    }
  })();

  if (isSuperAdminPath) {
    if (pathname === '/super-admin/login') return <SuperAdminLoginPage />;
    if (!masterSession?.token) return <SuperAdminLoginPage />;
    return <SuperAdminDashboard session={masterSession} />;
  }

  if (isRootHost) {
    return <SaasMarketingPage />;
  }

  if (loading) {
    return <div className="sa-empty">Loading...</div>;
  }

  if (pathname === '/register') {
    return <RegistrationPage apiError={apiError} />;
  }

  if (pathname === '/dashboard') {
    if (!tenantSession?.token) return <LoginPage tenantData={tenantData || {}} />;
    return <DashboardPage session={tenantSession} tenantData={tenantData} />;
  }

  if (apiError && !tenantData) {
    return <RegistrationPage apiError={apiError} />;
  }

  return <LoginPage tenantData={tenantData || {}} />;
};

export default App;