"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const loginUsers = [
  {
    email: "gomti@gomtimining.com",
    password: "Asdf@1234",
    role: "admin",
    name: "Admin",
  },
  {
    email: "employee@gomtimining.com",
    password: "Employee@1234",
    role: "employee",
    name: "Employee",
  },
  {
    email: "welspun@gomtimining.com",
    password: "Welspun@1234",
    role: "welspun",
    name: "Welspun",
  },
  {
    email: "shreecement@gomtimining.com",
    password: "ShreeCement@1234",
    role: "shreecement",
    name: "Shree Cement",
  },
  {
    email: "evonith@gomtimining.com",
    password: "Evonith@1234",
    role: "evonith",
    name: "Evonith",
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const user = loginUsers.find(
      (user) =>
        user.email.toLowerCase() === email.trim().toLowerCase() &&
        user.password === password
    );

    if (!user) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    // Save login information
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", user.role);
    localStorage.setItem("userName", user.name);
    localStorage.setItem("userEmail", user.email);

    router.push("/");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome Back
          </h1>

          <p className="mt-2 text-gray-500">
            Login to your dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}