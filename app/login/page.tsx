"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginType, setLoginType] = useState<"admin" | "employee">("admin");
  const [error, setError] = useState("");

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // ADMIN LOGIN
    if (
      loginType === "admin" &&
      email === "gomti@gomtimining.com" &&
      password === "Gomti@1234"
    ) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userRole", "admin");

      router.push("/");
      return;
    }

    // EMPLOYEE LOGIN
    if (
      loginType === "employee" &&
      email === "employee@gomtimining.com" &&
      password === "Employee@1234"
    ) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userRole", "employee");

      router.push("/");
      return;
    }

    setError("Invalid email or password");
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome Back
          </h1>

          <p className="text-gray-500 mt-2">
            Login to your dashboard
          </p>
        </div>

        {/* Login Type */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setLoginType("admin");
              setError("");
              setEmail("");
              setPassword("");
            }}
            className={`w-1/2 py-2.5 rounded-md text-sm font-semibold transition ${loginType === "admin"
              ? "bg-white text-blue-600 shadow"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Admin
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginType("employee");
              setError("");
              setEmail("");
              setPassword("");
            }}
            className={`w-1/2 py-2.5 rounded-md text-sm font-semibold transition ${loginType === "employee"
              ? "bg-white text-blue-600 shadow"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Employee
          </button>
        </div>

        {/* Selected Login */}
        <div className="text-center mb-5">
          <span className="inline-block bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-medium">
            {loginType === "admin" ? "Admin Login" : "Employee Login"}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                loginType === "admin"
                  ? "Enter admin email"
                  : "Enter employee email"
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 text-center">
              {error}
            </p>
          )}

          {/* Login Button */}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 transition"
          >
            Login as {loginType === "admin" ? "Admin" : "Employee"}
          </button>
        </form>
      </div>
    </main>
  );
}