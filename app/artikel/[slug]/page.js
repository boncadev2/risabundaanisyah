import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getArticleDetail } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function ArticleDetailPage({ params }) {
  const { slug } = await params;
  const { article, settings } = await getArticleDetail(slug);

  if (!article) {
    notFound();
  }

  return (
    <main>
      <section className="subpage-hero article-detail-hero">
        <div className="container">
          <Link className="back-link" href="/artikel"><ArrowLeft size={18} /> Semua Artikel</Link>
          <span className="pill">{article.category}</span>
          <h1>{article.title}</h1>
          <p>{article.description}</p>
        </div>
      </section>

      <article className="section container article-detail">
        <img className="article-detail-image" src={article.image} alt={article.title} />
        <div className="article-content">
          {article.content.split("\n").filter(Boolean).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="article-detail-cta">
          <h2>Butuh bantuan dari {settings.site_name}?</h2>
          <p>Hubungi tim kami untuk informasi layanan, jadwal dokter, atau reservasi kunjungan.</p>
          <a className="btn primary" href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}`}>Hubungi WhatsApp</a>
        </div>
      </article>
    </main>
  );
}
