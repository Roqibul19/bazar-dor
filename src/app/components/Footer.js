
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Footer() {
  const [year, setYear] = useState("");

  useEffect(() => {
    setYear(String(new Date().getFullYear()));
  }, []);

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-about">
          <Link href="/" className="footer-brand">
            🟩 বাজার দর
          </Link>

          <p>
            বাংলাদেশের নিত্যপ্রয়োজনীয় পণ্যের বাজারদর
            এক জায়গায় জানুন।
          </p>
        </div>

        <div className="footer-links">
          <h3>দ্রুত লিংক</h3>
          <Link href="/">হোম পেজ</Link>
          <Link href="/#categories">ক্যাটাগরি</Link>
          <Link href="/#products">সব পণ্য</Link>
        </div>

        <div className="footer-info">
          <h3>বাজারদরের তথ্য</h3>
          <p>
            পণ্যের দাম API থেকে নেওয়া হয়। বাস্তব বাজারে
            দাম সময় ও স্থানভেদে পরিবর্তিত হতে পারে।
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        © {year || "2026"} বাজার দর। সর্বস্বত্ব সংরক্ষিত।
      </div>

      <style jsx>{`
        .site-footer {
          margin-top: auto;
          background: #142c1d;
          color: #ffffff;
        }

        .footer-container {
          max-width: 1180px;
          margin: auto;
          padding: 38px 20px;
          display: grid;
          grid-template-columns: 1.3fr 0.8fr 1.2fr;
          gap: 35px;
        }

        .footer-brand {
          color: #ffffff;
          text-decoration: none;
          font-size: 23px;
          font-weight: 800;
        }

        .footer-container p {
          color: #c3d0c6;
          font-size: 13px;
          line-height: 1.9;
        }

        .footer-container h3 {
          margin: 0 0 15px;
          font-size: 16px;
        }

        .footer-links {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 11px;
        }

        .footer-links a {
          color: #c3d0c6;
          text-decoration: none;
          font-size: 13px;
        }

        .footer-links a:hover {
          color: #ffffff;
        }

        .footer-bottom {
          padding: 16px 12px;
          border-top: 1px solid #304737;
          color: #c3d0c6;
          text-align: center;
          font-size: 12px;
        }

        @media (max-width: 650px) {
          .footer-container {
            grid-template-columns: 1fr;
            gap: 22px;
            padding: 30px 16px;
          }
        }
      `}</style>
    </footer>
  );
}
