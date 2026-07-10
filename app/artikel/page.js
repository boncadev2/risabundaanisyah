import Link from "next/link";
import ArticleGrid from "@/components/ArticleGrid";
import { ArrowLeft } from "lucide-react";
import { getArticlePageData } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function ArticlePage() {
  const { articles, settings } = await getArticlePageData();

  return (
    <main>
      <section className="subpage-hero">
        <div className="container">
          <Link className="back-link" href="/"><ArrowLeft size={18} /> Kembali</Link>
          <span className="pill">Artikel Edukasi</span>
          <h1>Informasi kesehatan dari {settings.site_name}.</h1>
          <p>Temukan artikel seputar ibu, anak, dan keluarga untuk membantu persiapan kunjungan dan perawatan harian.</p>
        </div>
      </section>

      <section className="section container">
        <ArticleGrid articles={articles} className="article-page-grid" />
      </section>
    </main>
  );
}
