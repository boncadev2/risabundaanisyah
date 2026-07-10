"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ArticleGrid({ articles, className = "" }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className={`article-grid ${className}`}>
        {[0, 1, 2].map((item) => (
          <article className="article-card article-skeleton" key={item}>
            <i />
            <div>
              <span />
              <h3 />
              <p />
              <b />
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className={`article-grid card-ready ${className}`}>
      {articles.map((article) => (
        <article className="article-card" key={article.slug || article.title}>
          <Link href={`/artikel/${article.slug || ""}`} className="article-image-link" aria-label={`Baca ${article.title}`}>
            <img src={article.image} alt={article.title} />
          </Link>
          <div>
            <span className="badge neutral">{article.category}</span>
            <h3>{article.title}</h3>
            <p>{article.description}</p>
            <Link className="read-more" href={`/artikel/${article.slug || ""}`}>Baca Lengkap</Link>
          </div>
        </article>
      ))}
    </div>
  );
}
