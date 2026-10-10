
"use client";

import { useEffect, useState } from "react";

const API_URL = "https://api.api-store.workers.dev/api/bazardor";
const FALLBACK_API_URL =
  "https://api.abcz.workers.dev/api/bazardor";

const categories = [
  { name: "সব পণ্য", icon: "🛒", slug: "all" },
  { name: "চাল", icon: "🍚", slug: "chal" },
  { name: "ডাল", icon: "🫘", slug: "dal" },
  { name: "তেল", icon: "🛢️", slug: "tel" },
  { name: "সবজি", icon: "🥬", slug: "sobji" },
  { name: "মাছ", icon: "🐟", slug: "mach" },
  { name: "মাংস", icon: "🍗", slug: "mangsho" },
  { name: "ডিম-দুধ", icon: "🥚", slug: "dim-dudh" },
  { name: "মসলা", icon: "🌶️", slug: "mosla" },
];

function toBanglaNumber(value) {
  return String(value).replace(
    /\d/g,
    (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]
  );
}

function formatPrice(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return toBanglaNumber(
    new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
    }).format(number)
  );
}

function getProductName(product) {
  return (
    product.nameBn ||
    product.name_bn ||
    product.name ||
    product.title ||
    "পণ্যের নাম"
  );
}

function getProductPrice(product) {
  return (
    product.today ??
    product.price ??
    product.currentPrice ??
    product.current_price ??
    product.todayPrice ??
    0
  );
}

function getProductChange(product) {
  return Number(
    product.change ??
      product.pct ??
      product.changePercent ??
      product.change_percent ??
      0
  );
}

function getProductImage(product) {
  const image =
    product.image ||
    product.imageUrl ||
    product.image_url;

  if (
    typeof image === "string" &&
    /^https?:\/\//i.test(image)
  ) {
    return image;
  }

  return null;
}
function getProductIcon(product) {
  const image = getProductImage(product);

  if (image) return image;

  const icon =
    product.categoryIcon ||
    product.category_icon ||
    product.emoji;

  return typeof icon === "string" ? icon : "🛒";
}

function getProductUnit(product) {
  return (
    product.unit ||
    product.unitBn ||
    product.unit_bn ||
    "কেজি"
  );
}

function getProductSlug(product) {
  return product.slug ?? product.id ?? product._id;
}

function getBanglaDate(date) {
  return new Intl.DateTimeFormat("bn-BD", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getChangeLabel(change) {
  if (change > 0) return "দাম বেড়েছে";
  if (change < 0) return "দাম কমেছে";
  return "দাম অপরিবর্তিত";
}

/* Product Card */

function ProductCard({ product }) {
  const change = getProductChange(product);
  const image = getProductImage(product);
  const icon = getProductIcon(product);
  const slug = getProductSlug(product);

  return (
    <article className="product-card">
      <div className="product-image">
        {image ? (
          <img
            src={image}
            alt={getProductName(product)}
            loading="lazy"
          />
        ) : (
          <span>{icon}</span>
        )}
      </div>

      <h3>{getProductName(product)}</h3>

      <p className="product-price">
        ৳{formatPrice(getProductPrice(product))}
        <span className="product-unit">
          {" "}/ {getProductUnit(product)}
        </span>
      </p>

      <p
        className={`product-change ${
          change > 0
            ? "price-up"
            : change < 0
              ? "price-down"
              : "price-same"
        }`}
      >
        {change > 0 ? "▲" : change < 0 ? "▼" : "—"}
        {" "}
        {formatPrice(Math.abs(change))}%
        {" · "}
        {getChangeLabel(change)}
      </p>

      {slug != null && (
        <a href={`/product/${slug}`}>
          বিস্তারিত দেখুন →
        </a>
      )}
    </article>
  );
}

/* Product Section */

function ProductSection({
  id,
  title,
  description,
  products,
}) {
  return (
    <section id={id} className="products-section">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        {id !== "all-products" && (
          <a href="#all-products">সব পণ্য দেখুন →</a>
        )}
      </div>

      {products.length > 0 ? (
        <div className="product-grid">
          {products.map((product, index) => (
            <ProductCard
              key={
                product.id ??
                product.slug ??
                product._id ??
                `${getProductName(product)}-${index}`
              }
              product={product}
            />
          ))}
        </div>
      ) : (
        <p className="empty-products">
          এই বিভাগে দেখানোর মতো পণ্য পাওয়া যায়নি।
        </p>
      )}
    </section>
  );
}

/* Homepage */

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(getBanglaDate(new Date()));

    let cancelled = false;

    async function fetchProducts() {
      setLoading(true);
      setError("");

      const urls = [
        `${API_URL}/products`,
        `${FALLBACK_API_URL}/products`,
      ];

      try {
        let productList = null;

        for (const url of urls) {
          try {
            const response = await fetch(url);

            if (!response.ok) continue;

            const result = await response.json();

            const list = Array.isArray(result)
              ? result
              : result.products ??
                result.data?.products ??
                result.data ??
                [];

            if (Array.isArray(list)) {
              productList = list;
              break;
            }
          } catch {
            // Try the fallback API.
          }
        }

        if (productList === null) {
          throw new Error("পণ্যের তথ্য পাওয়া যায়নি।");
        }

        if (!cancelled) {
          setProducts(productList);
        }
      } catch {
        if (!cancelled) {
          setError(
            "পণ্যের তথ্য লোড করা যায়নি। ইন্টারনেট বা API পরীক্ষা করে আবার চেষ্টা করুন।"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const tickerProducts = [...products, ...products];

  const risingProducts = products
    .filter((product) => getProductChange(product) > 0)
    .sort(
      (a, b) => getProductChange(b) - getProductChange(a)
    )
    .slice(0, 6);

  const fallingProducts = products
    .filter((product) => getProductChange(product) < 0)
    .sort(
      (a, b) => getProductChange(a) - getProductChange(b)
    )
    .slice(0, 6);

  return (
    <>
      {/* Header */}
      <header className="site-header">
        <div className="container header-top">
          <a
            href="/"
            className="brand"
            aria-label="বাজার দর হোম পেজ"
          >
            <div className="brand-icon">🛒</div>

            <div className="brand-copy">
              <h2>বাজার দর</h2>
              <p>{today || "আজকের বাজারদর"}</p>
            </div>
          </a>

          <div className="auth-links">
            <a href="/signin">সাইন ইন</a>
            <a href="/signup" className="signup-link">
              সাইন আপ
            </a>
          </div>
        </div>

        {/* Category Navigation */}
        <nav
          className="category-nav"
          aria-label="পণ্যের ক্যাটাগরি"
        >
          <div className="container category-list">
            {categories.map((category) => (
              <a
                key={category.slug}
                href={
                  category.slug === "all"
                    ? "/#all-products"
                    : `/category/${category.slug}`
                }
                className={
                  category.slug === "all"
                    ? "category-active"
                    : ""
                }
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </a>
            ))}
          </div>
        </nav>
      </header>

      {/* Running Price Ticker */}
      <div
        className="price-ticker"
        aria-label="পণ্যের চলমান বাজারদর"
      >
        {loading ? (
          <div className="ticker-track ticker-loading">
            <span>⏳ বাজারদর লোড হচ্ছে...</span>
          </div>
        ) : error ? (
          <div className="ticker-track ticker-loading">
            <span>ℹ️ বাজারদর লোড করা যায়নি</span>
          </div>
        ) : products.length > 0 ? (
          <div className="ticker-track">
            {tickerProducts.map((product, index) => {
              const change = getProductChange(product);
              const icon = getProductIcon(product);
              const isImage =
                typeof icon === "string" &&
                /^https?:\/\//i.test(icon);

              return (
                <span
                  className="ticker-item"
                  key={`${getProductSlug(product) ?? index}-${index}`}
                >
                  <span>{isImage ? "🛒" : icon}</span>
                  <span>{getProductName(product)}</span>

                  <strong>
                    ৳{formatPrice(getProductPrice(product))}
                  </strong>

                  <span
                    className={
                      change > 0
                        ? "price-up"
                        : change < 0
                          ? "price-down"
                          : "price-same"
                    }
                  >
                    {change > 0
                      ? "▲"
                      : change < 0
                        ? "▼"
                        : "—"}
                    {" "}
                    {formatPrice(Math.abs(change))}%
                  </span>
                </span>
              );
            })}
          </div>
        ) : (
          <div className="ticker-track ticker-loading">
            <span>🛒 নিত্যপ্রয়োজনীয় পণ্যের বাজারদর</span>
          </div>
        )}
      </div>

      <main className="container home-content">
        {/* Hero Banner */}
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-eyebrow">
              {today ||
                "বাংলাদেশের নিত্যপ্রয়োজনীয় পণ্যের বাজারদর"}
            </span>

            <h1>
              আজকের বাজারের দাম
              <br />
              <span>এক নজরে</span>
            </h1>

            <p className="hero-description">
              চাল, ডাল, তেল, সবজি, মাছ, মাংস ও মসলার দাম —
              বাজারভিত্তিক বিস্তারিত, গড়, সর্বনিম্ন-সর্বোচ্চ
              এবং দামের পরিবর্তন এক জায়গায়।
            </p>

            <a href="#all-products" className="hero-button">
              সব পণ্য দেখুন →
            </a>
          </div>

          {/* Only one banner image on the right */}
          <div className="hero-illustration">
            <img
              src="/bazar-hero.png"
              alt="বাজারের ফল ও সবজির ঝুড়ি"
              className="hero-banner-image"
            />
          </div>
        </section>

        {/* Loading / Error */}
        {loading && (
          <p className="status-message" role="status">
            ⏳ পণ্যের দাম লোড হচ্ছে...
          </p>
        )}

        {error && (
          <p className="status-message" role="alert">
            {error}
          </p>
        )}

        {/* Product Sections */}
        {!loading && !error && products.length > 0 && (
          <>
            <ProductSection
              id="rising-products"
              title="📈 আজ দাম বেড়েছে"
              description="যেসব পণ্যের দাম সবচেয়ে বেশি বৃদ্ধি পেয়েছে"
              products={risingProducts}
            />

            <ProductSection
              id="falling-products"
              title="📉 আজ দাম কমেছে"
              description="যেসব পণ্যের দাম সবচেয়ে বেশি হ্রাস পেয়েছে"
              products={fallingProducts}
            />

            <ProductSection
              id="all-products"
              title="🛒 সব পণ্য"
              description="নিত্যপ্রয়োজনীয় পণ্যের বর্তমান বাজারদর"
              products={products}
            />
          </>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="status-message">
            কোনো পণ্যের তথ্য পাওয়া যায়নি।
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container">
          <p>
            বাজার দর — প্রয়োজনীয় পণ্যের দাম এক নজরে।
          </p>
          <p>
            সকল দাম সম্ভাব্য; বাজার অবস্থার ওপর নির্ভর করে
            পরিবর্তিত হয়।
          </p>
        </div>
      </footer>
    </>
  );
}
