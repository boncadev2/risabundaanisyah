import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({ searchParams }) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/admin");
  }

  const params = await searchParams;

  return (
    <main className="login-page">
      <section className="login-card">
        <img src="/logo.png" alt="Logo RSIA Bunda Annisyah" />
        <span className="pill">Admin Login</span>
        <h1>Masuk ke Admin RSIA</h1>
        <p>Gunakan akun admin untuk mengelola dokter, jadwal, booking, layanan, artikel, dan galeri.</p>

        {params?.error === "locked" && <div className="alert">Terlalu banyak percobaan login. Coba kembali setelah 15 menit.</div>}
        {params?.error && params.error !== "locked" && <div className="alert">Email, password, atau akses role tidak sesuai.</div>}
        {params?.notice === "password_changed" && <div className="login-success">Password berhasil diubah. Silakan login kembali.</div>}

        <LoginForm />
      </section>
    </main>
  );
}
