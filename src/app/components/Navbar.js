
"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  async function handleSignOut() {
    try {
      const { error } = await authClient.signOut();

      if (error) {
        alert("Sign out করা যায়নি। আবার চেষ্টা করো।");
        return;
      }

      router.push("/signin");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
      alert("সমস্যা হয়েছে। আবার চেষ্টা করো।");
    }
  }

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

          {!isPending && (
            session?.user ? (
              <div className="auth-menu">
                <span className="user-name">
                  {session.user.name || session.user.email}
                </span>

                <button
                  type="button"
                  className="signout-button"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/signin" className="signin-link">
                Sign In
              </Link>
            )
          )}
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
          flex-shrink: 0;
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

        .auth-menu {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-name {
          color: #183c27;
          font-size: 13px;
          font-weight: 700;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .signout-button {
          padding: 8px 12px;
          border: 1px solid #e5ece6;
          border-radius: 8px;
          background: #ffffff;
          color: #c0392b;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .signout-button:hover {
          background: #fff1ef;
        }

        .signin-link {
          padding: 8px 13px;
          border-radius: 8px;
          background: #16834a;
          color: #ffffff !important;
        }

        @media (max-width: 720px) {
          .navbar-inner {
            padding: 12px;
            flex-wrap: wrap;
            gap: 12px;
          }

          .nav-links {
            flex-wrap: wrap;
            gap: 12px;
          }

          .auth-menu {
            gap: 7px;
          }

          .user-name {
            max-width: 100px;
          }
        }

        @media (max-width: 520px) {
          .brand-text strong {
            font-size: 18px;
          }

          .nav-links {
            gap: 10px;
          }

          .nav-links a {
            font-size: 12px;
          }

          .signout-button {
            padding: 7px 9px;
          }
        }
      `}</style>
    </header>
  );
}
