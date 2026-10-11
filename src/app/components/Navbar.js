"use client";
import Link from "next/link";
export default function Navbar() {
  return (
    <header className="site-navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand">
          <span className="brand-logo">▦</span>

          <span className="brand-text">
            <strong>বাজার দর</strong>
            <small>প্রতিদিনের বাজারদর</small>
          </span>
        </Link>

        <nav className="nav-links">
          <Link href="/">হোম</Link>
          <Link href="/#categories">ক্যাটাগরি</Link>
          <Link href="/#products">সব পণ্য</Link>
        </nav>
      </div>

      <style jsx>{`
        .site-navbar {
          width: 100%;
          background: #ffffff;
          border-bottom: 1px solid #e5ece6;
        }

        .navbar-inner {
          max-width: 1180px;
          margin: 0 auto;
          padding: 14px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #183c27;
          text-decoration: none;
        }

        .brand-logo {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #e5f4e7;
          color: #16834a;
          font-size: 27px;
          font-weight: 800;
        }

        .brand-text strong {
          display: block;
          font-size: 21px;
        }

        .brand-text small {
          display: block;
          margin-top: 3px;
          color: #78847b;
          font-size: 11px;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .nav-links a {
          color: #34453a;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }

        .nav-links a:hover {
          color: #16834a;
        }

        @media (max-width: 520px) {
          .navbar-inner {
            padding: 12px;
            flex-wrap: wrap;
            gap: 12px;
          }

          .brand-text strong {
            font-size: 18px;
          }

          .nav-links {
            gap: 14px;
          }

          .nav-links a {
            font-size: 12px;
          }
        }
      `}</style>
    </header>
  );
}
