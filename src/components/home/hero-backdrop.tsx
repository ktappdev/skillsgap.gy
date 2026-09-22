"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const heroImages = [
  "/images/offshore-hero.webp",
  "/images/energy-hero.webp",
  "/images/energy-office-hero.webp",
] as const;

export function HeroBackdrop() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (prefersReducedMotion) return;

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % heroImages.length);
    }, 9000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 -z-20 bg-foreground" aria-hidden="true">
      {heroImages.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes="100vw"
          preload={index === 0}
          className={`absolute inset-0 object-cover object-[70%_center] transition-opacity duration-1000 ease-in-out motion-reduce:transition-none lg:object-center ${activeIndex === index ? "opacity-100" : "opacity-0"}`}
        />
      ))}
    </div>
  );
}
