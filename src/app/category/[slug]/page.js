
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API_URL = "https://api.api-store.workers.dev/api/bazardor";
const FALLBACK_API_URL = "https://api.abcz.workers.dev/api/bazardor";

async function fetchAPI(path) {
  for (const base of [API_URL, FALLBACK_API_URL]) {
    try {
      const response = await fetch(`${base}${path}`, {
        cache: "no-store",
      });

      if (response.ok) return await response.json();
    } catch (error) {
      console.error("API error:", error);
    }
  }

  throw new Error("API থেকে তথ্য আনা যায়নি");
}

function getArray(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function money(value) {
  if (value === null || value === undefined || value === "") {
    return "দাম পাওয়া যায়নি";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) return "দাম পাওয়া যায়নি";

  return (
    new Intl.NumberFormat("bn-BD", {
      maximumFractionDigits: 2,
    }).format(number) + " টাকা"
  );
}

function numberBn(value) {
  return new Intl.NumberFormat("bn-BD").format(value);
}

function CategoryContent() {
  const params = useParams();
  const slug = Array.isArray(params?.slug)
    ? params.slug[0]
    : params?.slug;

  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [sort, setSort] = useState("default");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [categoriesData, productsData] = await Promise.all([
          fetchAPI("/categories"),
          fetchAPI(`/products?category=${encodeURIComponent(slug)}`),
        ]);

        const categories = getArray(categoriesData, "categories");
        const allProducts = getArray(productsData, "products");

        const matchedCategory = categories.find(
          (item) =>
            String(item.slug) === String(slug) ||
            String(item.id) === String(slug)
        );

        if (!cancelled) {
          setCategory(matchedCategory || {
            slug,
            nameBn: allProducts[0]?.categoryNameBn || slug,
            icon: allProducts[0]?.categoryIcon || "🛒",
          });

          setProducts(allProducts);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            "ক্যাটাগরির পণ্য লোড করা যায়নি। ইন্টারনেট সংযোগ ও API পরীক্ষা করো।"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const sortedProducts = useMemo(() => {
    const list = [...products];

    if (sort === "price-low") {
      list.sort((a, b) => Number(a.today ?? Infinity) - Number(b.today ?? Infinity));
    } else if (sort === "price-high") {
      list.sort((a, b) => Number(b.today ?? -Infinity) - Number(a.today ?? -Infinity));
    } else if (sort === "change-up") {
      list.sort((a, b) => Number(b.pct ?? 0) - Number(a.pct ?? 0));
    } else if (sort === "change-down") {
      list.sort((a, b) => Number(a.pct ?? 0) - Number(b.pct ?? 0));
    }

    return list;
  }, [products, sort]);

  return (
    <main className="category-page">
      <div className="breadcrumb">
        <Link href="/">হোম পেজ</Link>
        <span>›</span>
        <span>{category?.nameBn || "ক্যাটাগরি"}</span>
      </div>

      <section className="category-heading">
        <div className="category-icon">
          {category?.icon || "🛒"}
        </div>

        <div>
          <h1>{category?.nameBn || "পণ্যসমূহ"}</h1>
          <p>এই ক্যাটাগরির পণ্যের বর্তমান দাম এক নজরে দেখুন।</p>
        </div>
      </section>

      <section className="products-section">
        <div className="products-toolbar">
          <p>
            {loading
              ? "পণ্য লোড হচ্ছে..."
              : `মোট ${numberBn(products.length)}টি পণ্য দেখানো হচ্ছে`}
          </p>

          <label className="sort-control">
            <span>সাজান:</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="default">ডিফল্ট</option>
              <option value="price-low">দাম: কম থেকে বেশি</option>
              <option value="price-high">দাম: বেশি থেকে কম</option>
              <option value="change-up">দাম বৃদ্ধি অনুযায়ী</option>
              <option value="change-down">দাম হ্রাস অনুযায়ী</option>
            </select>
          </label>
        </div>

        {error && (
          <div className="status-box error-box">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {loading && (
          <div className="product-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="product-skeleton" key={index}>
                <div className="skeleton-line icon-skeleton" />
                <div className="skeleton-line name-skeleton" />
                <div className="skeleton-line price-skeleton" />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="status-box">
            <div className="empty-icon">🛒</div>
            <h2>এই ক্যাটাগরিতে কোনো পণ্য পাওয়া যায়নি</h2>
            <p>API-তে ক্যাটাগরির slug এবং পণ্যের তথ্য পরীক্ষা করো।</p>
            <Link href="/">সব পণ্য দেখুন</Link>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="product-grid">
            {sortedProducts.map((product, index) => {
              const today =
                product.today !== null && product.today !== undefined
                  ? Number(product.today)
                  : null;

              const yesterday =
                product.yesterday !== null &&
                product.yesterday !== undefined
                  ? Number(product.yesterday)
                  : null;

              const difference =
                product.change !== null &&
                product.change !== undefined
                  ? Number(product.change)
                  : today !== null && yesterday !== null
                    ? today - yesterday
                    : null;

              const percentage =
                product.pct !== null && product.pct !== undefined
                  ? Number(product.pct)
                  : yesterday !== null &&
                      yesterday !== 0 &&
                      difference !== null
                    ? (difference / yesterday) * 100
                    : null;

              const direction =
                product.dir === "up" || (difference !== null && difference > 0)
                  ? "up"
                  : product.dir === "down" ||
                      (difference !== null && difference < 0)
                    ? "down"
                    : "flat";

              const icon =
                typeof product.image === "string" &&
                product.image.length <= 12
                  ? product.image
                  : product.categoryIcon || category?.icon || "🛒";

              return (
                <Link
                  href={`/product/${product.slug || product.id}`}
                  className="product-card"
                  key={product.id ?? product.slug ?? index}
                >
                  <div className="card-top">
                    <div className="product-icon">{icon}</div>

                    <div className="product-title-area">
                      <h2>{product.nameBn || product.name || "পণ্য"}</h2>
                      <p>প্রতি {product.unit || "কেজি"}</p>
                    </div>
                  </div>

                  <div className="card-price-area">
                    <span className="price-label">আজকের দাম</span>
                    <strong className="today-price">
                      {money(today)}
                    </strong>
                  </div>

                  <div className="card-bottom">
                    <span className="yesterday-price">
                      গতকাল: {money(yesterday)}
                    </span>

                    <span className={`change-badge ${direction}`}>
                      {direction === "up"
                        ? "▲"
                        : direction === "down"
                          ? "▼"
                          : "—"}

                      {percentage === null
                        ? " তথ্য নেই"
                        : ` ${numberBn(Math.abs(percentage).toFixed(1))}%`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <style jsx>{`
        .category-page {
          width: min(1180px, 100%);
          margin: 0 auto;
          padding: 26px 20px 48px;
          box-sizing: border-box;
          color: #202b24;
        }

        .breadcrumb {
          display: flex;
          gap: 10px;
          margin-bottom: 25px;
          color: #78847c;
          font-size: 13px;
        }

        .breadcrumb a {
          color: #16834a;
          text-decoration: none;
        }

        .category-heading {
          display: flex;
          align-items: center;
          gap: 17px;
          padding: 22px;
          margin-bottom: 26px;
          background: #f3f8f2;
          border: 1px solid #e5eee5;
          border-radius: 18px;
        }

        .category-icon {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 66px;
          height: 66px;
          border-radius: 16px;
          background: #e3f0df;
          font-size: 36px;
        }

        .category-heading h1 {
          margin: 0 0 7px;
          font-size: clamp(25px, 4vw, 32px);
        }

        .category-heading p {
          margin: 0;
          color: #718075;
          font-size: 14px;
          line-height: 1.7;
        }

        .products-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 19px;
        }

        .products-toolbar > p {
          color: #69776d;
          font-size: 14px;
        }

        .sort-control {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #5c695f;
        }

        .sort-control select {
          max-width: 190px;
          padding: 9px 10px;
          border: 1px solid #dfe7e0;
          border-radius: 9px;
          background: white;
          color: #27372c;
          outline-color: #16834a;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 17px;
        }

        .product-card {
          display: flex;
          flex-direction: column;
          min-width: 0;
          padding: 19px;
          color: inherit;
          text-decoration: none;
          background: #fff;
          border: 1px solid #e6ebe6;
          border-radius: 16px;
          box-shadow: 0 3px 12px rgba(24, 55, 33, 0.035);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .product-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 9px 25px rgba(24, 55, 33, 0.09);
          border-color: #cfe4d2;
        }

        .card-top {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
        }

        .product-icon {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          border-radius: 13px;
          background: #f0f6ef;
          font-size: 28px;
        }

        .product-title-area {
          min-width: 0;
        }

        .product-title-area h2 {
          overflow-wrap: anywhere;
          margin: 0 0 5px;
          font-size: 17px;
          line-height: 1.5;
        }

        .product-title-area p {
          margin: 0;
          color: #8a958d;
          font-size: 12px;
        }

        .card-price-area {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-top: 23px;
        }

        .price-label {
          color: #89948b;
          font-size: 12px;
        }

        .today-price {
          color: #17291c;
          font-size: 23px;
          overflow-wrap: anywhere;
        }

        .card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
          padding-top: 14px;
          margin-top: 15px;
          border-top: 1px solid #edf0ed;
        }

        .yesterday-price {
          color: #818b83;
          font-size: 11px;
        }

        .change-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 7px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 700;
        }

        .change-badge.up {
          color: #b94343;
          background: #fff0ef;
        }

        .change-badge.down {
          color: #16834a;
          background: #eaf7ed;
        }

        .change-badge.flat {
          color: #68756b;
          background: #f0f2f0;
        }

        .status-box {
          padding: 45px 20px;
          text-align: center;
          border: 1px solid #e4ebe5;
          border-radius: 16px;
          background: #fff;
        }

        .status-box h2 {
          font-size: 20px;
        }

        .status-box p {
          color: #768178;
          line-height: 1.8;
        }

        .status-box a,
        .status-box button {
          display: inline-block;
          margin-top: 10px;
          padding: 10px 16px;
          border: 0;
          border-radius: 9px;
          background: #16834a;
          color: #fff;
          text-decoration: none;
          cursor: pointer;
        }

        .empty-icon {
          font-size: 40px;
        }

        .error-box {
          background: #fff8f7;
        }

        .product-skeleton {
          padding: 20px;
          border: 1px solid #e6ebe6;
          border-radius: 16px;
        }

        .skeleton-line {
          border-radius: 8px;
          background: #edf1ed;
          animation: pulse 1.2s ease-in-out infinite alternate;
        }

        .icon-skeleton {
          width: 48px;
          height: 48px;
        }

        .name-skeleton {
          width: 65%;
          height: 17px;
          margin-top: 23px;
        }

        .price-skeleton {
          width: 48%;
          height: 24px;
          margin-top: 14px;
        }

        @keyframes pulse {
          from { opacity: 0.55; }
          to { opacity: 1; }
        }

        @media (max-width: 800px) {
          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 520px) {
          .category-page {
            padding: 18px 12px 35px;
          }

          .category-heading {
            padding: 16px;
            gap: 12px;
          }

          .category-icon {
            width: 53px;
            height: 53px;
            font-size: 29px;
          }

          .category-heading p {
            font-size: 12px;
          }

          .products-toolbar {
            align-items: flex-start;
            flex-direction: column;
            gap: 5px;
          }

          .products-toolbar > p {
            margin: 0 0 8px;
          }

          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .product-card {
            padding: 12px;
            border-radius: 13px;
          }

          .card-top {
            align-items: flex-start;
            gap: 8px;
          }

          .product-icon {
            width: 37px;
            height: 37px;
            font-size: 22px;
          }

          .product-title-area h2 {
            font-size: 14px;
          }

          .today-price {
            font-size: 18px;
          }

          .card-price-area {
            margin-top: 18px;
          }

          .card-bottom {
            align-items: flex-start;
            flex-direction: column;
            gap: 8px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .product-card { transition: none; }
          .skeleton-line { animation: none; }
        }
      `}</style>
    </main>
  );
}

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 40, textAlign: "center" }}>
          ক্যাটাগরি লোড হচ্ছে...
        </main>
      }
    >
      <CategoryContent />
    </Suspense>
  );
}
