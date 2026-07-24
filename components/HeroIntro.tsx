"use client";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";

// Staggers the nav + headline + subhead + buttons in on first load.
export default function HeroIntro({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = el.querySelectorAll("[data-intro]");
    gsap.fromTo(targets, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.09, ease: "power2.out" });
  }, []);

  return <div ref={ref}>{children}</div>;
}
