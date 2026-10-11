"use client";

import { useEffect, useState } from "react";

const API_URL = "https://api.api-store.workers.dev/api/bazardor";
const FALLBACK_API_URL = "https://api.abcz.workers.dev/api/bazardor";

function toBanglaNumber(value) {
  return String(value ?? "").replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

function getPrice(product) {
  const candidates = [
    product.today,
    product.todayPrice,
    product.today_price,
    product.currentPrice,
    product.current_price,
    product.price,
  ];

  for (const value of candidates) {
    const number = Number(value);
    if (value !== null && value !== undefined && value !== "" && Number.isFinite(number)) {
      return number;
    }
  }

  return null;
}

function getChange(product) {
  const candidates = [
    product.changePercent,
    product.change_percent,
    product.percentageChange,
    product.percentage_change,
    product.change,
    product.priceChange,
  ];

  for (const value of candidates) {
    if (value !== null && value !== undefined && value !== "") {
      const number = Number(String(value).replace("%", "").replace("+", ""));
      if (Number.isFinite(number)) return number;
    }
  }

  const today = getPrice(product);
  const yesterday = Number(product.yesterday ?? product.yesterdayPrice ?? product.yesterday_price);

  if (today !== null && Number.isFinite(yesterday) && yesterday !== 0) {
    return ((today - yesterday) / yesterday) * 100;
  }

  return null;
}

function getProducts(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.products)) return data.data.products;
  return [];
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return `${toBanglaNumber(number.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  }))} টাকা`;
}

function ProductCard({ product, direction }) {
  const price = getPrice(product);
  const change = getChange(product);
  const isUp = direction === "up";

  const icon =
    product.categoryIcon ||
    product.category_icon ||
    product.icon ||
    product.emoji ||
    "🛒";

  const name =
    product.nameBn ||
    product.name_bn ||
    product.name ||
    product.title ||
    "পণ্য";

  const unit = product.unit || product.unitBn || product.unit_bn || "প্রতি একক";

  return (
    <article className="pc-card">
      <div className="pc-card-top">
        <div className="pc-product-icon" aria-hidden="true">
          {icon}
        </div>

        <div className="pc-product-info">
          <h3>{name}</h3>
          <p>{unit}</p>
        </div>

        <span className={`pc-change ${isUp ? "pc-up" : "pc-down"}`}>
          {change === null
            ? isUp ? "▲" : "▼"
            : `${isUp ? "▲" : "▼"} ${toBanglaNumber(Math.abs(change).toFixed(1))}%`}
        </span>
      </div>

      <div className="pc-price-label">আজকের দাম</div>
      <div className="pc-price">{formatPrice(price)}</div>

      {change !== null && (
        <p className="pc-change-caption">
          {isUp ? "▲ দাম বেড়েছে" : "▼ দাম কমেছে"}
        </p>
      )}
    </article>
  );
}

export default function PriceChangeSections() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setError("");

      for (const baseUrl of [API_URL, FALLBACK_API_URL]) {
        try {
          const response = await fetch(`${baseUrl}/products`, {
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error("পণ্যের তথ্য লোড করা যায়নি");
          }

          const data = await response.json();
          const list = getProducts(data);

          if (!list.length) {
            throw new Error("API থেকে কোনো পণ্য পাওয়া যায়নি");
          }

          if (!cancelled) {
            setProducts(list);
            setLoading(false);
          }
          return;
        } catch (err) {
          if (cancelled) return;
          console.error("Product API error:", err);
        }
      }

      if (!cancelled) {
        setError("পণ্যের তথ্য পাওয়া যায়নি। কিছুক্ষণ পর আবার চেষ্টা করো।");
        setLoading(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const changedProducts = products
    .map((product) => ({ product, change: getChange(product) }))
    .filter(({ change }) => change !== null && change !== 0);

  const rising = changedProducts
    .filter(({ change }) => change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, 6)
    .map(({ product }) => product);

  const falling = changedProducts
    .filter(({ change }) => change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, 6)
    .map(({ product }) => product);

  function renderCards(list, direction) {
    if (loading) {
      return (
        <div className="pc-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="pc-skeleton" key={index} />
          ))}
        </div>
      );
    }

    if (!list.length) {
      return (
        <div className="pc-empty">
          এই বিভাগে দেখানোর মতো পণ্য পাওয়া যায়নি।
        </div>
      );
    }

    return (
      <div className="pc-grid">
        {list.map((product, index) => (
          <ProductCard
            key={product.id ?? product.slug ?? product.name ?? index}
            product={product}
            direction={direction}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="pc-sections">
      <section className="pc-section">
        <div className="pc-heading">
          <div>
            <h2><span className="pc-heading-up">↗</span> আজ দাম বেড়েছে</h2>
            <p>যেসব পণ্যের দাম আজ সবচেয়ে বেশি বেড়েছে</p>
          </div>
          <span className="pc-count">{toBanglaNumber(rising.length)}/৬টি</span>
        </div>

        {error && !products.length ? (
          <div className="pc-empty">{error}</div>
        ) : (
          renderCards(rising, "up")
        )}
      </section>

      <section className="pc-section ">
        <div className="pc-heading ">
          <div>
            <h2><span className="pc-heading-down">↘</span> আজ দাম কমেছে</h2>
            <p>যেসব পণ্যের দাম আজ সবচেয়ে বেশি কমেছে</p>
          </div>

         <span className="pc-count">{toBanglaNumber(falling.length)}/৬টি</span>
        </div>

        {error && !products.length ? (
          <div className="pc-empty">{error}</div>
        ) : (
          renderCards(falling, "down")
        )}
      </section>

      <style jsx>{`
        .pc-sections {
          display: flex;
          flex-direction: column;
          gap: 38px;
          width: 100%;
          margin: 24px 0 36px;
        }

        .pc-section {
          width: 100%;
        }

        .pc-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .pc-heading h2 {
          margin: 0;
          color: #17231b;
          font-size: clamp(20px, 2.4vw, 27px);
          font-weight: 800;
        }

        .pc-heading p {
          margin: 5px 0 0;
          color: #778078;
          font-size: 13px;
        }

        .pc-heading-up {
          color: #dc5148;
          margin-right: 5px;
        }

        .pc-heading-down {
          color: #198754;
          margin-right: 5px;
        }

        .pc-count {
          white-space: nowrap;
          background: #eef5ef;
          color: #286b40;
          border-radius: 20px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
        }

        .pc-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .pc-card {
          min-width: 0;
          padding: 18px;
          background: #fff;
          border: 1px solid #e8ece8;
          border-radius: 15px;
          box-shadow: 0 3px 12px rgba(20, 40, 25, 0.035);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .pc-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 22px rgba(20, 40, 25, 0.08);
        }

        .pc-card-top {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .pc-product-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 43px;
          height: 43px;
          background: #f3f7f1;
          border-radius: 12px;
          font-size: 25px;
        }

        .pc-product-info {
          flex: 1;
          min-width: 0;
        }

        .pc-product-info h3 {
          margin: 0;
          font-size: 17px;
          color: #1e2921;
          font-weight: 750;
          overflow-wrap: anywhere;
        }

        .pc-product-info p {
          margin: 4px 0 0;
          color: #929a93;
          font-size: 12px;
        }

        .pc-change {
          flex-shrink: 0;
          font-size: 12px;
          font-weight: 700;
        }

        .pc-up {
          color: #c8463d;
        }

        .pc-down {
          color: #16824b;
        }

        .pc-price-label {
          margin-top: 20px;
          color: #8b938c;
          font-size: 12px;
        }

        .pc-price {
          margin-top: 4px;
          color: #1c2820;
          font-size: 23px;
          font-weight: 800;
        }

        .pc-change-caption {
          margin: 9px 0 0;
          font-size: 12px;
          color: #7a847b;
        }

        .pc-empty {
          padding: 24px 16px;
          border: 1px solid #e8ece8;
          border-radius: 12px;
          background: #fff;
          color: #7b847d;
          font-size: 14px;
        }

        .pc-skeleton {
          height: 155px;
          border-radius: 15px;
          background: linear-gradient(90deg, #f0f2ef 25%, #f8f9f7 50%, #f0f2ef 75%);
          background-size: 200% 100%;
          animation: pc-loading 1.4s infinite;
        }

        @keyframes pc-loading {
          to { background-position: -200% 0; }
        }

        @media (max-width: 800px) {
          .pc-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .pc-card {
            padding: 14px;
          }

          .pc-price {
            font-size: 20px;
          }
        }

        @media (max-width: 480px) {
          .pc-grid {
            grid-template-columns: 1fr;
          }

          .pc-heading {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
