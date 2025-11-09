"use client";

import { useEffect } from "react";

const BODY_CLASS = "contribcit-embed-qr";

export function EmbedChromeHider() {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const previous = document.body.classList.contains(BODY_CLASS);
    document.body.classList.add(BODY_CLASS);

    return () => {
      if (!previous) {
        document.body.classList.remove(BODY_CLASS);
      }
    };
  }, []);

  return null;
}


