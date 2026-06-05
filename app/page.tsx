"use client";

import Script from "next/script";
import Dashboard from "./component/Dashboard";

export default function Home() {
  return (
    <>
      <Script
        src="https://upload-widget.cloudinary.com/global/all.js"
        strategy="beforeInteractive"
      />

      <Dashboard />
    </>
  );
}
