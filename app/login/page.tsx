
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");

  // Signup
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] =
    useState("");
  const [signupPassword, setSignupPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [role, setRole] =
    useState("employee");

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  // Common
  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");
  const [loading, setLoading] =
    useState(false);

  // -----------------------------------------
  // INPUT CLASS
  // -----------------------------------------

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200";

  // -----------------------------------------
  // GET CURRENT LOCATION
  // -----------------------------------------

  const getCurrentLocation = (): Promise<{
    latitude?: number;
    longitude?: number;
  }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({});
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude:
              position.coords.latitude,

            longitude:
              position.coords.longitude,
          });
        },

        () => {
          // User denied location
          resolve({});
        },

        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  };

  // -----------------------------------------
  // LOGIN
  // -----------------------------------------

  const handleLogin = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Get GPS location
      const location =
        await getCurrentLocation();

      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email: email
              .trim()
              .toLowerCase(),

            password,

            latitude:
              location.latitude,

            longitude:
              location.longitude,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
          "Invalid email or password"
        );

        return;
      }

      // -------------------------------------
      // SAVE USER
      // -------------------------------------

      localStorage.setItem(
        "isLoggedIn",
        "true"
      );

      localStorage.setItem(
        "userRole",
        data.user.role
      );

      localStorage.setItem(
        "userName",
        data.user.name
      );

      localStorage.setItem(
        "userEmail",
        data.user.email
      );

      // Login successful
      router.push("/");
    } catch (error) {
      console.error(
        "Login Error:",
        error
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // SIGNUP
  // -----------------------------------------

  const handleSignup = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Password validation
    if (signupPassword.length < 8) {
      setError(
        "Password must be at least 8 characters"
      );

      return;
    }

    // Confirm password
    if (
      signupPassword !== confirmPassword
    ) {
      setError(
        "Passwords do not match"
      );

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/signup",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: name.trim(),

            email: signupEmail
              .trim()
              .toLowerCase(),

            password: signupPassword,

            role,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
          "Unable to create account"
        );

        return;
      }

      // -------------------------------------
      // SUCCESS
      // -------------------------------------

      setSuccess(
        "Account created successfully. Waiting for admin approval."
      );

      // Clear fields
      setName("");
      setSignupEmail("");
      setSignupPassword("");
      setConfirmPassword("");
      setRole("employee");

      // Switch to login
      setTimeout(() => {
        setMode("login");
        setSuccess("");
      }, 2000);
    } catch (error) {
      console.error(
        "Signup Error:",
        error
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // SWITCH LOGIN / SIGNUP
  // -----------------------------------------

  const switchMode = (
    newMode: Mode
  ) => {
    setMode(newMode);

    setError("");
    setSuccess("");

    setName("");
    setSignupEmail("");
    setSignupPassword("");
    setConfirmPassword("");
    setRole("employee");

    setEmail("");
    setPassword("");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 px-4 py-8">

      {/* Card */}

      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-2xl">

        {/* Orange top */}

        <div className="h-2 bg-orange-500" />

        <div className="p-8 sm:p-10">

          {/* -------------------------------- */}
          {/* HEADER */}
          {/* -------------------------------- */}

          <div className="mb-7 text-center">

            {/* Logo */}

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-2xl font-bold text-white shadow-lg shadow-orange-200">
              G
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {mode === "login"
                ? "Welcome Back"
                : "Create Account"}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {mode === "login"
                ? "Login to your Gomti Mining dashboard"
                : "Create your Gomti Mining account"}
            </p>

          </div>

          {/* -------------------------------- */}
          {/* LOGIN / SIGNUP SWITCH */}
          {/* -------------------------------- */}

          {/* <div className="mb-7 flex rounded-xl bg-orange-50 p-1">

            <button
              type="button"
              onClick={() =>
                switchMode("login")
              }
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${mode === "login"
                ? "bg-orange-500 text-white shadow-md"
                : "text-gray-600 hover:text-orange-600"
                }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() =>
                switchMode("signup")
              }
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${mode === "signup"
                ? "bg-orange-500 text-white shadow-md"
                : "text-gray-600 hover:text-orange-600"
                }`}
            >
              Signup
            </button>

          </div> */}

          {/* -------------------------------- */}
          {/* ERROR */}
          {/* -------------------------------- */}

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">

              <span>⚠</span>

              <span>{error}</span>

            </div>
          )}

          {/* -------------------------------- */}
          {/* SUCCESS */}
          {/* -------------------------------- */}

          {success && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-600">

              <span>✓</span>

              <span>{success}</span>

            </div>
          )}

          {/* ================================= */}
          {/* LOGIN FORM */}
          {/* ================================= */}

          {mode === "login" && (
            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >

              {/* Email */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(
                      e.target.value
                    );
                    setError("");
                  }}
                  placeholder="Enter your email"
                  className={inputClass}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(
                      e.target.value
                    );
                    setError("");
                  }}
                  placeholder="Enter your password"
                  className={inputClass}
                  required
                  autoComplete="current-password"
                />
              </div>

              {/* Login Button */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 py-3.5 font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">

                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />

                    Logging in...

                  </span>
                ) : (
                  "Login"
                )}
              </button>

            </form>
          )}

          {/* ================================= */}
          {/* SIGNUP FORM */}
          {/* ================================= */}

          {mode === "signup" && (
            <form
              onSubmit={handleSignup}
              className="space-y-4"
            >

              {/* Name */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Full Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(
                      e.target.value
                    );
                    setError("");
                  }}
                  placeholder="Enter your full name"
                  className={inputClass}
                  required
                  autoComplete="name"
                />
              </div>

              {/* Email */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Email Address
                </label>

                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => {
                    setSignupEmail(
                      e.target.value
                    );
                    setError("");
                  }}
                  placeholder="Enter your email"
                  className={inputClass}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Role */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Account Type
                </label>

                <select
                  value={role}
                  onChange={(e) => {
                    setRole(
                      e.target.value
                    );
                    setError("");
                  }}
                  className={inputClass}
                  required
                >

                  <option value="admin">
                    Admin
                  </option>
                  <option value="employee">
                    Employee
                  </option>

                  <option value="shreecement">
                    Shree Cement
                  </option>
                  <option value="welspun">
                    Welspun
                  </option>

                  <option value="evonith">
                    Evonith
                  </option>
                </select>
              </div>

              {/* Password */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Password
                </label>

                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => {
                    setSignupPassword(
                      e.target.value
                    );
                    setError("");
                  }}
                  placeholder="Minimum 8 characters"
                  className={inputClass}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              {/* Confirm Password */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(
                      e.target.value
                    );
                    setError("");
                  }}
                  placeholder="Confirm your password"
                  className={inputClass}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              {/* Approval Message */}

              <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">

                <div className="flex items-center gap-2 text-sm font-semibold text-orange-700">
                  <span>🕐</span>
                  Admin Approval Required
                </div>

                <p className="mt-1 text-xs leading-5 text-orange-600">
                  Your account will be created
                  as pending. You can login only
                  after Gomti Admin approves your
                  account.
                </p>

              </div>

              {/* Signup Button */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 py-3.5 font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">

                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />

                    Creating Account...

                  </span>
                ) : (
                  "Create Account"
                )}
              </button>

            </form>
          )}

          {/* -------------------------------- */}
          {/* FOOTER */}
          {/* -------------------------------- */}

          <div className="mt-8 border-t border-gray-100 pt-5 text-center">

            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Gomti Mining
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Secure access to your dashboard
            </p>

          </div>

        </div>
      </div>
    </main>
  );
}

