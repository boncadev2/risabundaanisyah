import Link from "next/link";
import GalleryGrid from "@/components/GalleryGrid";
import { ArrowLeft } from "lucide-react";
import { getGalleryPageData } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const { galleries, settings } = await getGalleryPageData();

  return (
    <main>
      <section className="subpage-hero">
        <div className="container">
          <Link className="back-link" href="/"><ArrowLeft size={18} /> Kembali</Link>
          <span className="pill">Galeri RSIA</span>
          <h1>Galeri fasilitas dan kegiatan {settings.site_name}.</h1>
          <p>Lihat dokumentasi layanan, fasilitas, dan suasana rumah sakit.</p>
        </div>
      </section>

      <section className="section container">
        <GalleryGrid galleries={galleries} className="gallery-page-grid" />
      </section>
    </main>
  );
}
