"use client";

export default function GlobalError({ reset }) {
  return (
    <html lang="id">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "Arial, sans-serif", textAlign: "center" }}>
          <section>
            <h1>Sistem sedang mengalami gangguan</h1>
            <p>Silakan coba beberapa saat lagi.</p>
            <button type="button" onClick={reset} style={{ padding: "12px 18px", border: 0, borderRadius: 8, cursor: "pointer" }}>Coba Lagi</button>
          </section>
        </main>
      </body>
    </html>
  );
}
