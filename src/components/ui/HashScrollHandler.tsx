"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function HashScrollHandler() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const scrollToHash = () => {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const timeout = setTimeout(scrollToHash, 100);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}
