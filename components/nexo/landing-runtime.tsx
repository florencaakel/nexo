"use client";

import { useEffect } from "react";

/** Legacy presentation motion starts only after React has hydrated the markup. */
export function LandingRuntime() {
  useEffect(() => {
    if (document.querySelector("script[data-nexo-presentation]")) return;
    const script = document.createElement("script");
    script.type = "module";
    script.src = "/site/app.js";
    script.dataset.nexoPresentation = "true";
    document.body.appendChild(script);
  }, []);
  return null;
}
