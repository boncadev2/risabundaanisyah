"use client";

import { useEffect, useState } from "react";

export default function LoadingReveal({ children, className = "", count = 4, type = "card" }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  if (!isLoading) {
    return <div className="card-ready">{children}</div>;
  }

  if (type === "table") {
    return (
      <div className="table-card table-skeleton" aria-label="Memuat data jadwal">
        {[0, 1, 2, 3, 4].map((item) => (
          <span key={item} />
        ))}
      </div>
    );
  }

  if (type === "quick") {
    return (
      <section className={`quick-actions container ${className}`} aria-label="Memuat akses cepat">
        {Array.from({ length: count }).map((_, index) => (
          <article className="quick-card quick-skeleton" key={index}>
            <i />
            <span />
          </article>
        ))}
      </section>
    );
  }

  return (
    <div className={className} aria-label="Memuat data">
      {Array.from({ length: count }).map((_, index) => (
        <article className="service-card service-skeleton" key={index}>
          <i />
          <h3 />
          <p />
        </article>
      ))}
    </div>
  );
}
