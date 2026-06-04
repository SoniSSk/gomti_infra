// components/common/Header.tsx

import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <h1 className="text-xl font-bold text-orange-600">Gomti Infra</h1>

        <nav className="flex gap-6">
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </header>
  );
}
