import Link from "next/link";
import { createPageTitle, getPublicProperties, getTenantWebsiteData } from "@/lib/serverApi";
import styles from "./page.module.css";

const fallbackDeals = [
  "Wireless Earbuds Pro",
  "Minimal Leather Bag",
  "Studio Desk Lamp",
  "Performance Sneakers",
  "Mirrorless Camera Kit",
  "Premium Smart Watch",
  "Gaming Keyboard RGB",
  "Fragrance Collection",
  "Travel Backpack Pro",
  "Portable Monitor 4K",
].map((title, index) => ({
  id: `deal-${index}`,
  title,
  category: ["Electronics", "Fashion", "Lifestyle", "Accessories"][index % 4],
  city: "UAE",
  coverPhotoUrl: `https://images.unsplash.com/photo-${[
    "1505740420928-5e560c06d30e",
    "1542291026-7eec264c27ff",
    "1523275335684-37898b6baf30",
    "1517841905240-472988babdf9",
    "1519183071298-a2962be96d19",
    "1521572163474-6864f9cf17ab",
    "1491553895911-0055eca6402d",
    "1522335789203-aabd1fc54bc9",
    "1471115853179-bb1d604434e0",
    "1517336714739-489689fd1ca8",
  ][index]}?auto=format&fit=crop&w=1200&q=80`,
  price: 179 + index * 49,
  createdAt: new Date(Date.now() - index * 1000 * 60 * 60).toISOString(),
}));

const toAmount = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatAed = (value) => `AED ${toAmount(value).toLocaleString()}`;

const normalizeDeal = (item, index) => {
  const base = toAmount(item?.price) || 149 + index * 30;
  const discountPct = [12, 18, 25, 30, 35][index % 5];
  const discounted = Math.max(1, Math.round(base * (1 - discountPct / 100)));

  return {
    id: String(item?._id || item?.id || `flash-${index}`),
    title: String(item?.title || "Flash Deal Product"),
    category: String(item?.category || "General"),
    city: String(item?.city || item?.location || "UAE"),
    image:
      item?.coverPhotoUrl
      || (Array.isArray(item?.gallery) ? item.gallery[0] : "")
      || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    price: base,
    salePrice: discounted,
    discountPct,
    href: `/properties/${item?._id || item?.id || ""}`,
    createdAt: item?.createdAt || new Date().toISOString(),
  };
};

export async function generateMetadata() {
  const data = await getTenantWebsiteData();
  const tenantName = data?.tenant?.name;

  return {
    title: createPageTitle(tenantName, "Flash Sale"),
    description: "Limited-time offers and discounted products across categories.",
  };
}

export default async function FlashSalePage({ searchParams }) {
  const data = await getTenantWebsiteData();
  const tenantName = data?.tenant?.name || "Active eCommerce";

  const publicProducts = await getPublicProperties();
  const source = publicProducts.length > 0 ? publicProducts : fallbackDeals;
  const deals = source.map(normalizeDeal);

  const selectedCategory = String(searchParams?.category || "").trim();
  const selectedSort = String(searchParams?.sort || "discount").trim();

  const categories = Array.from(
    deals.reduce((acc, item) => {
      const key = String(item.category || "General").trim();
      if (!key) return acc;
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map())
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const filtered = deals
    .filter((item) => (selectedCategory ? item.category === selectedCategory : true))
    .sort((a, b) => {
      if (selectedSort === "newest") return String(b.createdAt).localeCompare(String(a.createdAt));
      if (selectedSort === "price_low") return a.salePrice - b.salePrice;
      if (selectedSort === "price_high") return b.salePrice - a.salePrice;
      return b.discountPct - a.discountPct;
    });

  const buildHref = (next = {}) => {
    const params = new URLSearchParams();
    const category = typeof next.category === "undefined" ? selectedCategory : String(next.category || "").trim();
    const sort = typeof next.sort === "undefined" ? selectedSort : String(next.sort || "discount").trim();

    if (category) params.set("category", category);
    if (sort && sort !== "discount") params.set("sort", sort);

    const qs = params.toString();
    return qs ? `/properties?${qs}` : "/properties";
  };

  return (
    <div className={styles.flashPage}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p>{tenantName}</p>
          <h1>Flash Sale</h1>
          <span>Daily limited-time drops with unbeatable prices across top product categories.</span>
          <div className={styles.heroActions}>
            <Link href="#flash-grid">Shop Deals</Link>
            <Link href="/">Back to Home</Link>
          </div>
        </div>

        <div className={styles.countdownCard}>
          <h3>Deal Ends In</h3>
          <div className={styles.countdownGrid}>
            <div><strong>08</strong><span>Hours</span></div>
            <div><strong>24</strong><span>Minutes</span></div>
            <div><strong>36</strong><span>Seconds</span></div>
          </div>
          <small>New deals are refreshed every day.</small>
        </div>
      </section>

      <section className={styles.toolbar}>
        <div className={styles.categories}>
          <Link href={buildHref({ category: "" })} className={!selectedCategory ? styles.active : ""}>All</Link>
          {categories.map((category) => (
            <Link
              key={category.name}
              href={buildHref({ category: category.name })}
              className={selectedCategory === category.name ? styles.active : ""}
            >
              {category.name} <span>({category.count})</span>
            </Link>
          ))}
        </div>

        <div className={styles.sortWrap}>
          <span>Sort:</span>
          <Link href={buildHref({ sort: "discount" })} className={selectedSort === "discount" ? styles.activeSort : ""}>Best Discount</Link>
          <Link href={buildHref({ sort: "newest" })} className={selectedSort === "newest" ? styles.activeSort : ""}>Newest</Link>
          <Link href={buildHref({ sort: "price_low" })} className={selectedSort === "price_low" ? styles.activeSort : ""}>Price Low</Link>
          <Link href={buildHref({ sort: "price_high" })} className={selectedSort === "price_high" ? styles.activeSort : ""}>Price High</Link>
        </div>
      </section>

      <section className={styles.stats}>
        <article><strong>{filtered.length}</strong><span>Live Deals</span></article>
        <article><strong>{categories.length}</strong><span>Categories</span></article>
        <article><strong>24/7</strong><span>New Offers</span></article>
      </section>

      <section id="flash-grid" className={styles.grid}>
        {filtered.length === 0 ? (
          <article className={styles.emptyState}>
            <h3>No flash deals found</h3>
            <p>Try another category or check back in a few minutes.</p>
          </article>
        ) : (
          filtered.map((item, index) => (
            <Link key={item.id} href={item.href} className={styles.card}>
              <div className={styles.media}>
                <img src={item.image} alt={item.title} loading={index < 6 ? "eager" : "lazy"} decoding="async" />
                <span className={styles.badge}>-{item.discountPct}%</span>
              </div>

              <div className={styles.body}>
                <p>{item.category}</p>
                <h3>{item.title}</h3>
                <small>{item.city}</small>
                <div className={styles.priceRow}>
                  <strong>{formatAed(item.salePrice)}</strong>
                  <span>{formatAed(item.price)}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
