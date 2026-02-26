import Link from "next/link";
import { getPublicProperties, getTenantWebsiteData } from "@/lib/serverApi";
import styles from "./page.module.css";

const heroSlides = [
  {
    title: "Gracefully Poised",
    subtitle: "Season-ready arrivals for effortless daily style.",
    cta: "Shop Collection",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    accent: "rose",
  },
  {
    title: "Fresh of Season",
    subtitle: "Curated products with modern looks and practical value.",
    cta: "Explore Deals",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    accent: "blue",
  },
];

const promoBanners = [
  {
    title: "Up to 40% OFF",
    subtitle: "On selected fashion essentials",
    image:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Beauty Week",
    subtitle: "Top-rated products under one roof",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Tech Picks",
    subtitle: "Performance accessories at better prices",
    image:
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1400&q=80",
  },
];

const toAmount = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatPrice = (value) => `AED ${toAmount(value).toLocaleString()}`;

const toCatalogItem = (product, index) => {
  const amount = toAmount(product?.price);
  const oldAmount = amount > 0 ? Math.round(amount * 1.22) : 0;

  return {
    id: String(product?._id || product?.id || `product-${index}`),
    href: `/properties/${product?._id || product?.id || ""}`,
    title: String(product?.title || product?.name || "Featured Product"),
    category: String(product?.category || "Featured").trim() || "Featured",
    location: String(product?.city || product?.location || "UAE"),
    image:
      product?.coverPhotoUrl
      || (Array.isArray(product?.gallery) ? product.gallery[0] : "")
      || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    price: amount > 0 ? amount : 199,
    oldPrice: oldAmount > 0 ? oldAmount : 259,
    badge: index % 5 === 0 ? "Hot" : index % 3 === 0 ? "New" : "",
    rating: 4 + ((index % 10) / 20),
  };
};

const mockCatalog = [
  "Smart Leather Bag",
  "Urban Runner Sneakers",
  "Premium Headphones",
  "Wireless Gaming Mouse",
  "Minimal Desk Lamp",
  "Classic Analog Watch",
  "Portable Bluetooth Speaker",
  "Slim Fit Jacket",
  "Luxury Perfume Set",
  "4K Action Camera",
  "Travel Duffel Bag",
  "Ergonomic Office Chair",
].map((title, index) => ({
  id: `mock-${index}`,
  href: "/properties",
  title,
  category: ["Fashion", "Electronics", "Lifestyle", "Accessories"][index % 4],
  location: "UAE",
  image: `https://images.unsplash.com/photo-${[
    "1505740420928-5e560c06d30e",
    "1542291026-7eec264c27ff",
    "1526170375885-4d8ecf77b99f",
    "1523275335684-37898b6baf30",
    "1491553895911-0055eca6402d",
    "1523170335258-f5ed11844a49",
    "1471115853179-bb1d604434e0",
    "1517841905240-472988babdf9",
    "1522335789203-aabd1fc54bc9",
    "1519183071298-a2962be96d19",
    "1521572163474-6864f9cf17ab",
    "1542291026-7eec264c27ff",
  ][index]}?auto=format&fit=crop&w=1200&q=80`,
  price: 149 + index * 37,
  oldPrice: 189 + index * 45,
  badge: index % 4 === 0 ? "New" : "",
  rating: 4.2,
}));

const chunk = (list, from, size) => {
  if (!Array.isArray(list) || list.length === 0) return [];
  const output = [];
  for (let i = 0; i < size; i += 1) {
    output.push(list[(from + i) % list.length]);
  }
  return output;
};

export default async function HomePage() {
  const websiteData = await getTenantWebsiteData();
  const tenantName = websiteData?.tenant?.name || "Active Commerce";

  const sourceProducts = await getPublicProperties();
  const mapped = sourceProducts.map(toCatalogItem).filter((item) => item.title);
  const catalog = mapped.length > 0 ? mapped : mockCatalog;

  const categoryMap = new Map();
  catalog.forEach((item) => {
    const key = String(item.category || "General").trim();
    categoryMap.set(key, (categoryMap.get(key) || 0) + 1);
  });

  const categories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const featuredProducts = chunk(catalog, 0, 8);
  const bestSelling = chunk(catalog, 3, 6);
  const topRated = chunk(catalog, 7, 5);
  const classified = chunk(catalog, 2, 7);

  return (
    <div className={styles.storefront}>
      <section className={styles.heroGrid}>
        <article className={`${styles.heroCard} ${styles.rose}`}>
          <img src={heroSlides[0].image} alt={heroSlides[0].title} loading="eager" decoding="async" />
          <div className={styles.overlay} />
          <div className={styles.heroCopy}>
            <p>NEW ARRIVAL</p>
            <h1>{heroSlides[0].title}</h1>
            <span>{heroSlides[0].subtitle}</span>
            <Link href="/properties">{heroSlides[0].cta}</Link>
          </div>
        </article>

        <article className={`${styles.heroCard} ${styles.blue}`}>
          <img src={heroSlides[1].image} alt={heroSlides[1].title} loading="eager" decoding="async" />
          <div className={styles.overlay} />
          <div className={styles.heroCopy}>
            <p>{tenantName}</p>
            <h2>{heroSlides[1].title}</h2>
            <span>{heroSlides[1].subtitle}</span>
            <Link href="/properties">{heroSlides[1].cta}</Link>
          </div>
        </article>
      </section>

      <section className={styles.categoryStrip}>
        <div className={styles.sectionHead}>
          <h3>Featured Categories</h3>
          <Link href="/properties">All Categories</Link>
        </div>
        <div className={styles.categoryRow}>
          {categories.map((category, index) => (
            <Link
              key={category.name}
              href={`/properties?category=${encodeURIComponent(category.name)}`}
              className={`${styles.categoryPill} ${index === 0 ? styles.activeCategory : ""}`}
            >
              <strong>{category.name}</strong>
              <span>{category.count} products</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3>Featured Products</h3>
          <Link href="/properties">View all</Link>
        </div>
        <div className={styles.productsGrid}>
          {featuredProducts.map((product) => (
            <Link href={product.href} key={`featured-${product.id}`} className={styles.productCard}>
              <div className={styles.productMedia}>
                <img src={product.image} alt={product.title} loading="lazy" decoding="async" />
                {product.badge ? <span className={styles.badge}>{product.badge}</span> : null}
              </div>
              <div className={styles.productBody}>
                <p>{product.category}</p>
                <h4>{product.title}</h4>
                <div className={styles.priceRow}>
                  <strong>{formatPrice(product.price)}</strong>
                  <span>{formatPrice(product.oldPrice)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.bannerRow}>
        {promoBanners.map((banner) => (
          <article key={banner.title} className={styles.bannerCard}>
            <img src={banner.image} alt={banner.title} loading="lazy" decoding="async" />
            <div className={styles.overlay} />
            <div className={styles.bannerCopy}>
              <h4>{banner.title}</h4>
              <p>{banner.subtitle}</p>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.doubleSection}>
        <div className={styles.panel}>
          <div className={styles.sectionHead}>
            <h3>Best Selling</h3>
            <Link href="/properties">View all</Link>
          </div>
          <div className={styles.miniList}>
            {bestSelling.map((product) => (
              <Link href={product.href} key={`best-${product.id}`} className={styles.miniCard}>
                <img src={product.image} alt={product.title} loading="lazy" decoding="async" />
                <div>
                  <h5>{product.title}</h5>
                  <p>{product.category}</p>
                  <strong>{formatPrice(product.price)}</strong>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <article className={styles.flashDeal}>
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80"
            alt="Flash deal"
            loading="lazy"
            decoding="async"
          />
          <div className={styles.overlay} />
          <div className={styles.flashCopy}>
            <p>Today&apos;s Deal</p>
            <h3>Limited Stock Collections</h3>
            <Link href="/properties">Shop Now</Link>
          </div>
        </article>
      </section>

      <section className={styles.auctionSection}>
        <article className={styles.auctionHero}>
          <img
            src="https://images.unsplash.com/photo-1513116476489-7635e79feb27?auto=format&fit=crop&w=1200&q=80"
            alt="Auction picks"
            loading="lazy"
            decoding="async"
          />
          <div className={styles.overlay} />
          <div className={styles.auctionCopy}>
            <p>Live Auctions</p>
            <h3>Rare Finds & Premium Picks</h3>
            <Link href="/properties">Join Auction</Link>
          </div>
        </article>

        <div className={styles.panel}>
          <div className={styles.sectionHead}>
            <h3>Top Rated Products</h3>
            <Link href="/properties">Browse</Link>
          </div>
          <div className={styles.miniList}>
            {topRated.map((product) => (
              <Link href={product.href} key={`top-${product.id}`} className={styles.miniCard}>
                <img src={product.image} alt={product.title} loading="lazy" decoding="async" />
                <div>
                  <h5>{product.title}</h5>
                  <p>{product.location}</p>
                  <strong>{formatPrice(product.price)}</strong>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3>Classified Ads</h3>
          <Link href="/properties">See all</Link>
        </div>
        <div className={styles.classifiedGrid}>
          {classified.map((product) => (
            <Link href={product.href} key={`classified-${product.id}`} className={styles.classifiedCard}>
              <img src={product.image} alt={product.title} loading="lazy" decoding="async" />
              <div>
                <h5>{product.title}</h5>
                <span>{formatPrice(product.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.ctaBand}>
        <div>
          <h3>1000s of Shops with their best for you</h3>
          <p>Discover trusted sellers, curated collections, and fast-growing local brands.</p>
        </div>
        <Link href="/properties">Shop Now</Link>
      </section>
    </div>
  );
}
