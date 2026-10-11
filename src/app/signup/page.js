
"use client";

import { authClient } from "@/lib/auth-client";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignup(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();

    if (!name || !email || !password) {
      toast.error("সবগুলো ঘর পূরণ করো");
      return;
    }

    if (password.length < 8) {
      toast.error("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে");
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (error) {
        toast.error(error.message || "অ্যাকাউন্ট তৈরি করা যায়নি");
        return;
      }

      toast.success("অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!");
      router.push("/signin");
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("সমস্যা হয়েছে। আবার চেষ্টা করো।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: "420px",
        margin: "60px auto",
        padding: "24px",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          marginBottom: "24px",
        }}
      >
        সাইন আপ
      </h1>

      <form onSubmit={handleSignup}>
        <label htmlFor="name">নাম</label>
        <input
          id="name"
          type="text"
          name="name"
          placeholder="নাম"
          autoComplete="name"
          required
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            margin: "8px 0 16px",
          }}
        />

        <label htmlFor="email">ইমেইল</label>
        <input
          id="email"
          type="email"
          name="email"
          placeholder="ইমেইল"
          autoComplete="email"
          required
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            margin: "8px 0 16px",
          }}
        />

        <label htmlFor="password">পাসওয়ার্ড</label>
        <input
          id="password"
          type="password"
          name="password"
          placeholder="কমপক্ষে ৮ অক্ষর"
          autoComplete="new-password"
          minLength={8}
          required
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            margin: "8px 0 20px",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: loading ? "#86a892" : "#15803d",
            color: "white",
            border: 0,
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "অ্যাকাউন্ট তৈরি হচ্ছে..." : "রেজিস্টার"}
        </button>
      </form>

      <p style={{ marginTop: "20px" }}>
        অ্যাকাউন্ট আছে? <Link href="/signin">সাইন ইন</Link>
      </p>
    </main>
  );
}
