
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API_URL = "https://api.api-store.workers.dev/api/bazardor";
const FALLBACK_API_URL = "https://api.abcz.workers.dev/api/bazardor";

function formatPrice(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return new Intl.NumberFormat("bn-BD", {
    maximumFractionDigits: 2,
  }).format(number) + " টাকা";
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return new Intl.NumberFormat("bn-BD", {
    maximumFractionDigits: 2,
  }).format(number);
}

async function fetchFromApi(path) {
  const urls = [API_URL, FALLBACK_API_URL];

  for (const base of urls) {
    try {
      const response = await fetch(`${base}${path}`, {
        cache: "no-store",
      });

      if (!response.ok) continue;

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${base}${path}`, error);
    }
  }

  return null;
}

function getProducts(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getProductFromResponse(data) {
  if (!data) return null;

  if (Array.isArray(data)) return null;

  if (data.product) return data.product;
  if (data.data && !Array.isArray(data.data)) return data.data;

  if (data.id !== undefined || data.slug) return data;

  return null;
}

function getMarketRows(product) {
  if (!Array.isArray(product?.markets)) return [];

  return product.markets
    .filter((market) => market && typeof market === "object")
    .map((market, index) => {
      const min =
        market.min !== null &&
        market.min !== undefined &&
        market.min !== ""
          ? Number(market.min)
          : null;

      const max =
        market.max !== null &&
        market.max !== undefined &&
        market.max !== ""
          ? Number(market.max)
          : null;

      return {
        id: `${market.market || "market"}-${market.division || ""}-${index}`,
        market: market.market || "বাজারের নাম নেই",
        division: market.division || "লোকেশন নেই",
        min: min !== null && Number.isFinite(min) ? min : null,
        max: max !== null && Number.isFinite(max) ? max : null,
        average:
          min !== null &&
          max !== null &&
          Number.isFinite(min) &&
          Number.isFinite(max)
            ? (min + max) / 2
            : null,
      };
    });
}

function getAverage(rows) {
  const values = rows
    .map((row) => row.average)
    .filter((value) => value !== null && Number.isFinite(value));

  if (!values.length) return null;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getLowest(rows) {
  const values = rows
    .map((row) => row.min)
    .filter((value) => value !== null && Number.isFinite(value));

  return values.length ? Math.min(...values) : null;
}

function getHighest(rows) {
  const values = rows
    .map((row) => row.max)
    .filter((value) => value !== null && Number.isFinite(value));

  return values.length ? Math.max(...values) : null;
}

function ProductDetailContent() {
  const params = useParams();
  const slug = Array.isArray(params?.slug)
    ? params.slug[0]
    : params?.slug;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setError("");
      setProduct(null);

      try {
        // First try the single-product endpoint.
        const singleData = await fetchFromApi(
          `/products/${encodeURIComponent(slug)}`
        );

        let foundProduct = getProductFromResponse(singleData);

        // The API documents single-product lookup by ID.
        // If the route uses a slug, search the products list.
        if (
          !foundProduct ||
          String(foundProduct.slug || "") !== String(slug)
        ) {
          const allData = await fetchFromApi("/products");
          const products = getProducts(allData);

          const matched = products.find(
            (item) =>
              String(item.slug || "") === String(slug) ||
              String(item.id || "") === String(slug)
          );

          if (matched) foundProduct = matched;
        }

        if (!cancelled) {
          if (foundProduct) {
            setProduct(foundProduct);
          } else {
            setError(
              "পণ্যটি পাওয়া যায়নি। API-তে পণ্যটির slug বা ID যাচাই করো।"
            );
          }
        }
      } catch (err) {
        console.error("Product loading error:", err);

        if (!cancelled) {
          setError("পণ্যের তথ্য লোড করা যায়নি। আবার চেষ্টা করো।");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const markets = useMemo(() => getMarketRows(product), [product]);

  const lowest = useMemo(() => getLowest(markets), [markets]);
  const highest = useMemo(() => getHighest(markets), [markets]);
  const average = useMemo(() => getAverage(markets), [markets]);

  if (loading) {
    return (
      <main className="page-container">
        <div className="skeleton title-skeleton" />
        <div className="skeleton card-skeleton" />
        <div className="summary-grid">
          <div className="skeleton summary-skeleton" />
          <div className="skeleton summary-skeleton" />
          <div className="skeleton summary-skeleton" />
        </div>
        <div className="skeleton table-skeleton" />
        <style jsx>{styles}</style>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="page-container">
        <div className="message-card">
          <div className="message-icon">🥬</div>
          <h2>পণ্য পাওয়া যায়নি</h2>
          <p>{error || "এই পণ্যের তথ্য পাওয়া যায়নি।"}</p>
          <Link href="/" className="back-button">
            ← সব পণ্যে ফিরে যান
          </Link>
        </div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  const today =
    product.today !== null && product.today !== undefined
      ? product.today
      : null;

  const yesterday =
    product.yesterday !== null && product.yesterday !== undefined
      ? product.yesterday
      : null;

  const change =
    product.change !== null && product.change !== undefined
      ? Number(product.change)
      : today !== null && yesterday !== null
        ? Number(today) - Number(yesterday)
        : null;

  const changeDirection =
    change === null ? "neutral" : change > 0 ? "up" : change < 0 ? "down" : "neutral";

  const unit = product.unit || "কেজি";

  return (
    <main className="page-container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">হোম</Link>
        <span>›</span>
        <Link href="/#products">পণ্যসমূহ</Link>
        <span>›</span>
        <span>{product.nameBn || product.name || slug}</span>
      </nav>

      <section className="product-card">
        <div className="product-icon">
          {product.image &&
          typeof product.image === "string" &&
          product.image.length < 12
            ? product.image
            : product.categoryIcon || "🥬"}
        </div>

        <div className="product-info">
          <span className="eyebrow">আজকের বাজারদর</span>
          <h1>{product.nameBn || product.name || slug}</h1>

          <p className="product-meta">
            প্রতি {unit} · API-তে পাওয়া তথ্য
          </p>

          <div className="current-price">
            {formatPrice(today)}
          </div>

          <p className={`price-change ${changeDirection}`}>
            {change === null
              ? "দামের পরিবর্তনের তথ্য নেই"
              : change > 0
                ? `↑ গতকালের তুলনায় ${formatPrice(Math.abs(change))} বেশি`
                : change < 0
                  ? `↓ গতকালের তুলনায় ${formatPrice(Math.abs(change))} কম`
                  : "গতকালের তুলনায় দাম অপরিবর্তিত"}
          </p>
        </div>
      </section>

      <section className="summary-section">
        <div className="section-heading">
          <div>
            <h2>দামের সারসংক্ষেপ</h2>
            <p>সব বাজারের API রেকর্ড থেকে হিসাব করা</p>
          </div>
        </div>

        <div className="summary-grid">
          <article className="summary-card lowest">
            <div className="summary-label">সর্বনিম্ন দাম</div>
            <div className="summary-value">{formatPrice(lowest)}</div>
            <div className="summary-note">বাজারগুলোর মধ্যে সর্বনিম্ন</div>
          </article>

          <article className="summary-card highest">
            <div className="summary-label">সর্বোচ্চ দাম</div>
            <div className="summary-value">{formatPrice(highest)}</div>
            <div className="summary-note">বাজারগুলোর মধ্যে সর্বোচ্চ</div>
          </article>

          <article className="summary-card average">
            <div className="summary-label">আনুমানিক গড়</div>
            <div className="summary-value">{formatPrice(average)}</div>
            <div className="summary-note">
              প্রতিটি বাজারের (সর্বনিম্ন + সর্বোচ্চ) ÷ ২-এর গড়
            </div>
          </article>
        </div>
      </section>

      <section className="market-section">
        <div className="section-heading">
          <div>
            <h2>বাজারভিত্তিক আজকের দাম</h2>
            <p>API-তে পাওয়া বাজার ও লোকেশন অনুযায়ী দামের তালিকা</p>
          </div>

          <span className="record-count">
            মোট {formatNumber(markets.length)}টি বাজার
          </span>
        </div>

        {markets.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>বাজার</th>
                  <th>জেলা / লোকেশন</th>
                  <th>সর্বনিম্ন দাম</th>
                  <th>সর্বোচ্চ দাম</th>
                  <th>আনুমানিক গড়</th>
                </tr>
              </thead>

              <tbody>
                {markets.map((market) => (
                  <tr key={market.id}>
                    <td className="market-name">{market.market}</td>
                    <td className="location">
                      <span className="pin">📍</span>
                      {market.division}
                    </td>
                    <td className="min-price">
                      {formatPrice(market.min)}
                    </td>
                    <td className="max-price">
                      {formatPrice(market.max)}
                    </td>
                    <td className="average-price">
                      {formatPrice(market.average)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-markets">
            <div>📍</div>
            <h3>বাজারের তথ্য পাওয়া যায়নি</h3>
            <p>
              এই পণ্যের API রেসপন্সে markets অ্যারে নেই অথবা বাজারের
              রেকর্ড খালি।
            </p>
          </div>
        )}

        <p className="disclaimer">
          ⚠️ বাজারভিত্তিক সর্বনিম্ন ও সর্বোচ্চ দাম API-এর তথ্য থেকে দেখানো
          হয়েছে। আনুমানিক গড় হলো প্রতিটি বাজারের সর্বনিম্ন ও সর্বোচ্চ
          দামের মধ্যবিন্দু। এটি API-প্রদত্ত প্রকৃত গড় দাম নয়। প্রকৃত
          বাজারদর সময় ও স্থানভেদে পরিবর্তিত হতে পারে।
        </p>
      </section>

      <div className="bottom-navigation">
        <Link href="/">← সব পণ্যে ফিরে যান</Link>
      </div>

      <style jsx>{styles}</style>
    </main>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: "40px 20px", textAlign: "center" }}>
          পণ্যের তথ্য লোড হচ্ছে...
        </main>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}

const styles = `
  .page-container {
    width: min(1180px, 100%);
    margin: 0 auto;
    padding: 24px 20px 48px;
    color: #17231c;
    box-sizing: border-box;
  }

  .breadcrumb {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    align-items: center;
    margin-bottom: 22px;
    font-size: 13px;
    color: #718078;
  }

  .breadcrumb a, .bottom-navigation a {
    color: #16834a;
    text-decoration: none;
  }

  .product-card {
    display: flex;
    align-items: center;
    gap: 22px;
    padding: 28px;
    border: 1px solid #e4eee7;
    border-radius: 20px;
    background: linear-gradient(135deg, #f2fbf4, #ffffff);
  }

  .product-icon {
    width: 108px;
    height: 108px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border-radius: 20px;
    background: #e5f5e8;
    font-size: 53px;
  }

  .eyebrow {
    color: #16834a;
    font-size: 13px;
    font-weight: 700;
  }

  .product-info h1 {
    margin: 7px 0;
    font-size: clamp(25px, 4vw, 36px);
    line-height: 1.35;
  }

  .product-meta {
    margin: 0 0 12px;
    color: #69776e;
    font-size: 14px;
  }

  .current-price {
    color: #138442;
    font-size: clamp(25px, 4vw, 34px);
    font-weight: 800;
  }

  .price-change {
    margin: 7px 0 0;
    font-size: 13px;
    font-weight: 600;
  }

  .price-change.up { color: #c33f3f; }
  .price-change.down { color: #138442; }
  .price-change.neutral { color: #69776e; }

  .summary-section, .market-section {
    margin-top: 34px;
  }

  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 17px;
  }

  .section-heading h2 {
    margin: 0;
    font-size: clamp(20px, 3vw, 26px);
  }

  .section-heading p {
    margin: 6px 0 0;
    color: #758078;
    font-size: 14px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .summary-card {
    min-width: 0;
    padding: 21px;
    border: 1px solid #e5ece7;
    border-radius: 16px;
    background: #fff;
  }

  .summary-card.lowest { border-top: 4px solid #1c9a59; }
  .summary-card.highest { border-top: 4px solid #e4a13a; }
  .summary-card.average { border-top: 4px solid #5186d9; }

  .summary-label {
    margin-bottom: 12px;
    color: #66736a;
    font-size: 14px;
    font-weight: 600;
  }

  .summary-value {
    overflow-wrap: anywhere;
    color: #18251d;
    font-size: clamp(19px, 2.5vw, 25px);
    font-weight: 800;
  }

  .summary-note {
    margin-top: 8px;
    color: #7b857e;
    font-size: 12px;
    line-height: 1.6;
  }

  .record-count {
    flex-shrink: 0;
    padding: 7px 12px;
    border-radius: 20px;
    background: #eaf7ed;
    color: #187744;
    font-size: 12px;
    font-weight: 700;
  }

  .table-wrapper {
    overflow-x: auto;
    border: 1px solid #e3eae5;
    border-radius: 14px;
    background: #fff;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 14px;
  }

  th {
    padding: 16px;
    background: #f2f8f3;
    color: #334a39;
    white-space: nowrap;
    font-weight: 700;
  }

  td {
    padding: 15px 16px;
    border-top: 1px solid #edf1ee;
    white-space: nowrap;
  }

  tbody tr:hover { background: #f9fcf9; }

  .market-name {
    color: #1c2c22;
    font-weight: 700;
  }

  .location { color: #56655b; }
  .pin { margin-right: 5px; }
  .min-price { color: #16834a; font-weight: 700; }
  .max-price { color: #bd7b19; font-weight: 700; }
  .average-price { color: #315fbd; font-weight: 700; }

  .disclaimer {
    margin-top: 17px;
    padding: 13px 15px;
    border-radius: 10px;
    background: #fff8e8;
    color: #79602c;
    font-size: 12px;
    line-height: 1.8;
  }

  .bottom-navigation { margin-top: 28px; font-size: 14px; }

  .message-card {
    max-width: 560px;
    margin: 55px auto;
    padding: 35px 22px;
    border: 1px solid #e4ece6;
    border-radius: 18px;
    text-align: center;
  }

  .message-icon { font-size: 42px; }
  .message-card h2 { margin: 12px 0; }
  .message-card p { color: #68756c; line-height: 1.8; }

  .back-button {
    display: inline-block;
    margin-top: 12px;
    padding: 11px 18px;
    border-radius: 9px;
    background: #16834a;
    color: white;
    text-decoration: none;
  }

  .skeleton {
    border-radius: 12px;
    background: linear-gradient(90deg, #edf1ee 25%, #f7f9f7 50%, #edf1ee 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }

  .title-skeleton { height: 25px; width: 42%; margin-bottom: 22px; }
  .card-skeleton { height: 170px; margin-bottom: 25px; }
  .summary-skeleton { height: 130px; }
  .table-skeleton { height: 300px; margin-top: 30px; }

  @keyframes shimmer {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }

  @media (max-width: 700px) {
    .page-container { padding: 18px 13px 35px; }
    .product-card { padding: 20px 16px; gap: 14px; }
    .product-icon { width: 72px; height: 72px; font-size: 38px; border-radius: 15px; }
    .summary-grid { grid-template-columns: 1fr; gap: 12px; }
    .summary-card { padding: 17px; }
    .summary-value { font-size: 23px; }
    .section-heading { align-items: flex-start; }
    .section-heading p { font-size: 12px; }
    .record-count { font-size: 11px; }
    th, td { padding: 13px 12px; }
    table { font-size: 12px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton { animation: none; }
  }
`;
