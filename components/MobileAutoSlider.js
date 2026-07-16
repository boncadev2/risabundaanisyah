"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";

export default function MobileAutoSlider({ children, label, className = "", enableDesktop = false }) {
  const trackRef = useRef(null);

  function slide(direction) {
    const track = trackRef.current;
    if (!track) return;

    const card = track.firstElementChild;
    const gap = 18;
    const step = card ? card.getBoundingClientRect().width + gap : track.clientWidth;
    const isAtEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    const isAtStart = track.scrollLeft <= 8;

    if (direction > 0 && isAtEnd) {
      track.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }

    if (direction < 0 && isAtStart) {
      track.scrollTo({ left: track.scrollWidth, behavior: "smooth" });
      return;
    }

    track.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (enableDesktop || window.matchMedia("(max-width: 700px)").matches) slide(1);
    }, 3600);

    return () => window.clearInterval(timer);
  }, [enableDesktop]);

  return (
    <div className={`mobile-auto-slider ${enableDesktop ? "desktop-auto-slider" : ""} ${className}`}>
      <button className="slider-btn left mobile-slider-btn" type="button" aria-label={`${label} sebelumnya`} onClick={() => slide(-1)}>
        <ChevronLeft size={24} />
      </button>
      <div className="mobile-auto-track" ref={trackRef}>
        {children}
      </div>
      <button className="slider-btn right mobile-slider-btn" type="button" aria-label={`${label} berikutnya`} onClick={() => slide(1)}>
        <ChevronRight size={24} />
      </button>
    </div>
  );
}
