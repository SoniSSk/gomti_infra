"use client";

import { useAppSelector } from "@/app/redux/hooks";

export default function GlobalLoader() {
  const loading = useAppSelector((state) => state.loader.loading);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
    </div>
  );
}
