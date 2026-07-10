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

        {params?.error && <div className="alert">Email, password, atau akses role tidak sesuai.</div>}

        <LoginForm />
      </section>
    </main>
  );
}
