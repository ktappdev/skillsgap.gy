"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const heroImages = [
  "/images/offshore-hero.webp",
  "/images/energy-hero.webp",
  "/images/energy-office-hero.webp",
  "/images/oil-rig-workers.webp",
  "/images/hospitality-housekeeping.webp",
  "/images/commercial-kitchen-chef.webp",
  "/images/offshore-fieldwork.webp",
  "/images/industrial-maintenance-team.webp",
  "/images/career-skills-coaching.webp",
] as const;

type HeroImage = (typeof heroImages)[number];

export function HeroBackdrop() {
  const [images, setImages] = useState<HeroImage[]>([...heroImages]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const shuffleTimeout = window.setTimeout(() => {
      const shuffledImages = [...heroImages];
      for (let index = shuffledImages.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffledImages[index], shuffledImages[randomIndex]] = [
          shuffledImages[randomIndex],
          shuffledImages[index],
        ];
      }
      setImages(shuffledImages);
    }, 0);

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (prefersReducedMotion) {
      return () => window.clearTimeout(shuffleTimeout);
    }

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % heroImages.length);
    }, 9000);

    return () => {
      window.clearTimeout(shuffleTimeout);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-20 bg-foreground" aria-hidden="true">
      {images.map((src, index) => (
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
