"use client";

import { ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollY, innerHeight } = window;
      const distanceFromBottom =
        document.documentElement.scrollHeight - (scrollY + innerHeight);

      // Hide near the page end so it doesn't cover pagination (Next) or footer actions
      setVisible(scrollY > 400 && distanceFromBottom > 160);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
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
        lg:bottom-6
        lg:right-6
        cursor-pointer
        z-50
        orange-gradient
        orange-hover
        p-2.5
        lg:p-4
        rounded-full
        text-white
        shadow-lg
      "
    >
      <ChevronUp className="size-5 lg:size-6" />
    </button>
  );
}
