"use client";

import { ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        })
      }
      className="
        fixed
        bottom-[calc(1rem+env(safe-area-inset-bottom))]
        right-4
        sm:bottom-6
        sm:right-6
        cursor-pointer
        z-50
        orange-gradient
        orange-hover
        p-3
        sm:p-4
        rounded-full
        text-white
      "
    >
      <ChevronUp />
    </button>
  );
}
