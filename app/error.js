"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    console.error("Application error", error);
  }, [error]);

  return (
    <main className="friendly-error-page">
      <section>
        <AlertTriangle size={52} />
        <span className="pill">Terjadi Gangguan</span>
        <h1>Maaf, halaman belum dapat ditampilkan.</h1>
        <p>Sistem mengalami gangguan sementara. Silakan coba kembali atau kembali ke halaman utama.</p>
        <div>
          <button type="button" onClick={reset}><RefreshCw size={17} /> Coba Lagi</button>
          <Link href="/">Kembali ke Beranda</Link>
        </div>
      </section>
    </main>
  );
}
