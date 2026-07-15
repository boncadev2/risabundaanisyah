"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import MobileAutoSlider from "@/components/MobileAutoSlider";

export default function GalleryGrid({ galleries, className = "" }) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);
  const activeGallery = activeIndex === null ? null : galleries[activeIndex];

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  function move(direction) {
    if (activeIndex === null || galleries.length === 0) return;
    setActiveIndex((activeIndex + direction + galleries.length) % galleries.length);
  }

  if (isLoading) {
    return (
      <div className={`gallery-grid ${className}`}>
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <article className="gallery-card gallery-skeleton" key={item}>
            <i />
            <span />
          </article>
        ))}
      </div>
    );
  }

  return (
    <>
      <MobileAutoSlider label="Galeri" className={`gallery-mobile-slider card-ready ${className}`}>
        {galleries.map((gallery, index) => (
          <button className="gallery-card" type="button" key={gallery.title} onClick={() => setActiveIndex(index)}>
            <img src={gallery.image} alt={gallery.alt} />
            <span>{gallery.title}</span>
          </button>
        ))}
      </MobileAutoSlider>

      {activeGallery && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Preview galeri">
          <button className="lightbox-close" type="button" aria-label="Tutup preview" onClick={() => setActiveIndex(null)}>
            <X size={24} />
          </button>
          <button className="lightbox-nav left" type="button" aria-label="Gambar sebelumnya" onClick={() => move(-1)}>
            <ChevronLeft size={30} />
          </button>
          <figure>
            <img src={activeGallery.image} alt={activeGallery.alt} />
            <figcaption>{activeGallery.title}</figcaption>
          </figure>
          <button className="lightbox-nav right" type="button" aria-label="Gambar berikutnya" onClick={() => move(1)}>
            <ChevronRight size={30} />
          </button>
        </div>
      )}
    </>
  );
}
