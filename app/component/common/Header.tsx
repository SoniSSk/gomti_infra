// components/common/Header.tsx

import Link from "next/link";
import Logo from "./Logo";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" aria-label="Gomti Infra home">
          <Logo height={36} priority className="sm:hidden" />
          <Logo height={44} priority className="hidden sm:block" />
        </Link>

        <Link
          href="/login"
          className="rounded-lg bg-orange-500 px-4 py-2 font-semibold sm:px-5 text-white shadow-md transition hover:bg-orange-600"
        >
          Login
        </Link>
      </div>
    </header>
  );
}
