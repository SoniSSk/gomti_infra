// components/common/Header.tsx

import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <h1 className="text-xl font-bold text-orange-600">Gomti Infra</h1>

        <Link
          href="/login"
          className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white shadow-md transition hover:bg-orange-600"
        >
          Login
        </Link>
      </div>
    </header>
  );
}
