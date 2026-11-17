"use client";

import { useEffect } from "react";

/** Navegação simples, sem animações automáticas ou efeitos diferentes nos botões. */
export function LandingRuntime() {
  useEffect(() => {
    const toggle = document.querySelector<HTMLButtonElement>(".menu-toggle");
    const nav = document.querySelector<HTMLElement>("#main-nav");
    if (!toggle || !nav) return;
    const mobile = matchMedia("(max-width: 800px)");
    const close = () => {
      if (mobile.matches && nav.contains(document.activeElement)) toggle.focus();
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      nav.inert = mobile.matches;
    };
    const open = () => {
      if (toggle.getAttribute("aria-expanded") === "true") { close(); return; }
      toggle.setAttribute("aria-expanded", "true"); nav.inert = false; nav.classList.add("is-open");
    };
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    const outside = (event: MouseEvent) => { if (event.target instanceof Element && !event.target.closest(".site-header")) close(); };
    const navigate = (event: MouseEvent) => { if (event.target instanceof Element && event.target.closest("a")) close(); };
    close();
    toggle.addEventListener("click", open); nav.addEventListener("click", navigate);
    document.addEventListener("keydown", keydown); document.addEventListener("click", outside); mobile.addEventListener("change", close);
    return () => { toggle.removeEventListener("click", open); nav.removeEventListener("click", navigate); document.removeEventListener("keydown", keydown); document.removeEventListener("click", outside); mobile.removeEventListener("change", close); nav.inert = false; };
  }, []);
  return null;
}
