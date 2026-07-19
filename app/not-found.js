import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="friendly-error-page">
      <section>
        <SearchX size={52} />
        <span className="pill">404</span>
        <h1>Halaman tidak ditemukan.</h1>
        <p>Alamat mungkin sudah berubah atau halaman yang dicari tidak tersedia.</p>
        <div><Link href="/">Kembali ke Beranda</Link></div>
      </section>
    </main>
  );
}
