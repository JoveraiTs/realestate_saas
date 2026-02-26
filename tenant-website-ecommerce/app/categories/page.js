import { createPageTitle, getTenantWebsiteData } from "@/lib/serverApi";
import styles from "./page.module.css";

const MAIN_CATEGORIES = [
  "Electronics",
  "Men's Fashion",
  "Women's Fashion",
  "Kids' Fashion",
  "Home & Kitchen",
  "Beauty & Fragrance",
  "Health & Nutrition",
  "Baby",
  "Toys",
  "Sports & Outdoors",
  "Grocery",
  "Automotive",
  "Stationery",
  "Books & media",
];

const coverImageByIndex = [
  "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1556911220-bda9f7f7597e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80",
];

export async function generateMetadata() {
  const data = await getTenantWebsiteData();
  const tenantName = data?.tenant?.name;
  return {
    title: createPageTitle(tenantName, "Main Product Categories"),
    description: "Browse all main product categories.",
  };
}

export default async function CategoriesPage() {
  const data = await getTenantWebsiteData();
  const tenantName = data?.tenant?.name || "Active eCommerce";

  return (
    <div className={styles.catalogPage}>
      <section className={styles.hero}>
        <p>{tenantName}</p>
        <h1>Main Product Categories</h1>
        <span>Discover all major departments in one place and start shopping faster.</span>
      </section>

      <section className={styles.grid}>
        {MAIN_CATEGORIES.map((category, index) => (
          <a key={category} href="/properties" className={styles.card}>
            <img src={coverImageByIndex[index % coverImageByIndex.length]} alt={category} loading="lazy" decoding="async" />
            <div className={styles.overlay} />
            <div className={styles.copy}>
              <h3>{category}</h3>
              <span>Open category</span>
            </div>
          </a>
        ))}
      </section>
    </div>
  );
}
