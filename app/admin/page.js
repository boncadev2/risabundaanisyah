import Link from "next/link";
import { redirect } from "next/navigation";
import AdminConfirmForm from "@/components/AdminConfirmForm";
import {
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChartLine,
  ClipboardList,
  Download,
  FileText,
  GalleryHorizontal,
  LogOut,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserCog,
  UsersRound
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getAdminData, getAdminUsersData, getSecurityData, getVisitorStats } from "@/lib/cms";
import { imageUrl } from "@/lib/images";
import { canAccessModule } from "@/lib/rbac";
import {
  createArticle,
  createBooking,
  createDoctor,
  createGallery,
  createSchedule,
  createService,
  createAdminUser,
  deleteArticle,
  deleteBooking,
  deleteDoctor,
  deleteGallery,
  deleteSchedule,
  deleteService,
  updateArticle,
  updateBooking,
  updateDoctor,
  updateGallery,
  updateSchedule,
  updateService,
  updateSettings,
  updateAdminUser,
  changePassword
} from "./actions";

const modules = [
  { label: "Dashboard", slug: "dashboard", icon: ChartLine },
  { label: "Dokter", slug: "dokter", icon: UsersRound },
  { label: "Jadwal", slug: "jadwal", icon: CalendarDays },
  { label: "Booking", slug: "booking", icon: ClipboardList },
  { label: "Layanan", slug: "layanan", icon: Stethoscope },
  { label: "Artikel", slug: "artikel", icon: FileText },
  { label: "Galeri", slug: "galeri", icon: GalleryHorizontal },
  { label: "Statistik Pengunjung", slug: "statistik", icon: ChartNoAxesColumnIncreasing },
  { label: "Keamanan Admin", slug: "keamanan", icon: ShieldCheck },
  { label: "Pengguna Admin", slug: "pengguna", icon: UserCog },
  { label: "Pengaturan", slug: "pengaturan", icon: Settings }
];

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const availableModules = modules.filter((item) => canAccessModule(user.role, item.slug));
  const activeModule = availableModules.some((item) => item.slug === params?.module) ? params.module : "dashboard";
  const activeLabel = availableModules.find((item) => item.slug === activeModule)?.label || "Dashboard";
  const notice = params?.notice || "";
  const [data, visitorStats, securityData, adminUsersData] = await Promise.all([
    getAdminData(),
    activeModule === "statistik" ? getVisitorStats({ from: params?.from, to: params?.to }) : Promise.resolve(null),
    activeModule === "keamanan" ? getSecurityData() : Promise.resolve(null),
    activeModule === "pengguna" ? getAdminUsersData() : Promise.resolve(null)
  ]);

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand">
          <img src="/logo.png" alt="Logo RSIA Bunda Annisyah" />
          <span>
            <strong>RSIA Admin</strong>
            <small>{user.role}</small>
          </span>
        </Link>

        <nav>
          {availableModules.map(({ label, slug, icon: Icon }) => (
            <Link
              href={slug === "dashboard" ? "/admin" : `/admin?module=${slug}`}
              className={activeModule === slug ? "active" : ""}
              key={slug}
            >
              <Icon size={19} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <AdminConfirmForm action="/api/auth/logout" method="post" confirmMessage="Yakin ingin logout dari admin panel?">
          <button className="logout-btn" type="submit"><LogOut size={18} /> Logout</button>
        </AdminConfirmForm>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="pill">Admin Panel</span>
            <h1>{activeLabel}</h1>
          </div>
          <div className="admin-profile">
            <img src="https://i.pravatar.cc/80?img=12" alt="Admin" />
            <span>{user.name}</span>
          </div>
        </header>

        <AdminNotice notice={notice} moduleName={activeLabel} />

        {activeModule === "dashboard" && <DashboardModule data={data} />}
        {activeModule === "dokter" && <DoctorModule doctors={data.doctors} />}
        {activeModule === "jadwal" && <ScheduleModule schedules={data.schedules} doctors={data.doctors} />}
        {activeModule === "booking" && <BookingModule bookings={data.bookings} doctors={data.doctors} />}
        {activeModule === "layanan" && <ServiceModule services={data.services} />}
        {activeModule === "artikel" && <ArticleModule articles={data.articles} />}
        {activeModule === "galeri" && <GalleryModule galleries={data.galleries} />}
        {activeModule === "statistik" && <VisitorStatisticsModule stats={visitorStats} />}
        {activeModule === "keamanan" && <SecurityModule data={securityData} />}
        {activeModule === "pengguna" && <AdminUsersModule data={adminUsersData} currentUser={user} />}
        {activeModule === "pengaturan" && <SettingsModule user={user} settings={data.settings} />}
      </section>
    </main>
  );
}

function DashboardModule({ data }) {
  return (
    <>
      <div className="metric-grid">
        <article><span>Booking Baru</span><strong>{data.bookings.length}</strong><small>Total database</small></article>
        <article><span>Dokter</span><strong>{data.doctors.length}</strong><small>Data aktif</small></article>
        <article><span>Layanan</span><strong>{data.services.length}</strong><small>Tampil publik</small></article>
        <article><span>Artikel</span><strong>{data.articles.length}</strong><small>Publish</small></article>
      </div>
      <div className="admin-grid">
        <SummaryPanel title="Booking Terbaru" items={data.bookings.map((item) => `${item.code} - ${item.patient}`)} href="/admin?module=booking" />
        <SummaryPanel title="Dokter Aktif" items={data.doctors.map((item) => `${item.name} - ${item.specialty}`)} href="/admin?module=dokter" />
      </div>
    </>
  );
}

function VisitorStatisticsModule({ stats }) {
  const maxViews = Math.max(...stats.daily.map((item) => item.views), 1);
  const maxMonthly = Math.max(...stats.monthly.map((item) => item.views), 1);
  const average = stats.uniqueVisitors ? (stats.totalViews / stats.uniqueVisitors).toFixed(1) : "0";
  const exportHref = `/api/analytics/export?from=${encodeURIComponent(stats.from)}&to=${encodeURIComponent(stats.to)}`;

  return (
    <div className="visitor-statistics">
      <form className="analytics-filter" method="get" action="/admin">
        <input type="hidden" name="module" value="statistik" />
        <label>Dari<input name="from" type="date" defaultValue={stats.from} /></label>
        <label>Sampai<input name="to" type="date" defaultValue={stats.to} /></label>
        <button type="submit">Terapkan Filter</button>
        <Link className="analytics-export" href={exportHref}><Download size={17} /> Ekspor CSV</Link>
      </form>

      <div className="metric-grid visitor-metrics">
        <article><span>Tayangan Periode</span><strong>{stats.totalViews.toLocaleString("id-ID")}</strong><small>Sesuai rentang tanggal</small></article>
        <article><span>Pengunjung Unik</span><strong>{stats.uniqueVisitors.toLocaleString("id-ID")}</strong><small>Dalam periode terpilih</small></article>
        <article><span>Hari Ini</span><strong>{stats.todayViews.toLocaleString("id-ID")}</strong><small>Tayangan sejak pukul 00.00</small></article>
        <article><span>Halaman per Pengunjung</span><strong>{average}</strong><small>Rata-rata periode terpilih</small></article>
      </div>

      <div className="analytics-grid">
        <section className="admin-panel analytics-panel">
          <PanelHead title="Tren Harian" desc="Maksimal 31 hari terakhir dari periode yang dipilih." />
          <div className="visitor-chart">
            {stats.daily.map((item) => (
              <div className="visitor-bar-item" key={item.key}>
                <strong>{item.views}</strong>
                <div><i style={{ height: `${Math.max((item.views / maxViews) * 100, item.views ? 8 : 2)}%` }} /></div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel analytics-panel">
          <PanelHead title="Halaman Terpopuler" desc="Halaman dengan jumlah tayangan terbanyak." />
          <div className="popular-pages">
            {stats.topPages.length ? stats.topPages.map((page, index) => (
              <div key={page.path}>
                <b>{index + 1}</b>
                <span>{page.path === "/" ? "Beranda" : page.path}</span>
                <strong>{page.views.toLocaleString("id-ID")}</strong>
              </div>
            )) : <p>Belum ada data kunjungan.</p>}
          </div>
        </section>
      </div>

      <div className="analytics-grid analytics-secondary-grid">
        <section className="admin-panel analytics-panel">
          <PanelHead title="Jenis Perangkat" desc="Perangkat yang digunakan pengunjung." />
          <DistributionList items={stats.devices} total={stats.totalViews} />
        </section>
        <section className="admin-panel analytics-panel">
          <PanelHead title="Sumber Kunjungan" desc="Asal pengunjung sebelum membuka website." />
          <DistributionList items={stats.sources} total={stats.totalViews} />
        </section>
      </div>

      <section className="admin-panel analytics-panel monthly-panel">
        <PanelHead title="Tren 12 Bulan" desc="Perbandingan jumlah tayangan per bulan." />
        <div className="visitor-chart monthly-chart">
          {stats.monthly.map((item) => (
            <div className="visitor-bar-item" key={item.key}>
              <strong>{item.views}</strong>
              <div><i style={{ height: `${Math.max((item.views / maxMonthly) * 100, item.views ? 8 : 2)}%` }} /></div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel analytics-panel visitor-detail-panel">
        <PanelHead title="Detail Pengunjung Terbaru" desc="Maksimal 100 kunjungan terbaru pada periode yang dipilih." />
        <div className="visitor-detail-table-wrap">
          <table className="visitor-detail-table">
            <thead><tr><th>Waktu</th><th>Alamat IP</th><th>Perangkat</th><th>Sistem Operasi</th><th>Browser</th><th>Halaman</th></tr></thead>
            <tbody>
              {stats.recentVisits.map((visit) => (
                <tr key={visit.id}>
                  <td>{visit.date}</td>
                  <td><code>{visit.ipAddress}</code></td>
                  <td>{visit.device}</td>
                  <td>{visit.os}</td>
                  <td>{visit.browser}</td>
                  <td>{visit.path === "/" ? "Beranda" : visit.path}</td>
                </tr>
              ))}
              {!stats.recentVisits.length && <tr><td colSpan={6}>Belum ada data kunjungan.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DistributionList({ items, total }) {
  return (
    <div className="distribution-list">
      {items.length ? items.map((item) => {
        const percentage = total ? Math.round((item.views / total) * 100) : 0;
        return (
          <div key={item.name}>
            <p><span>{item.name}</span><strong>{item.views.toLocaleString("id-ID")} ({percentage}%)</strong></p>
            <i><b style={{ width: `${percentage}%` }} /></i>
          </div>
        );
      }) : <p>Belum ada data kunjungan.</p>}
    </div>
  );
}

function AdminNotice({ notice, moduleName }) {
  if (!notice) return null;

  const messages = {
    created: `${moduleName} berhasil ditambahkan.`,
    updated: `${moduleName} berhasil diperbarui.`,
    deleted: `${moduleName} berhasil dihapus.`,
    saved: `${moduleName} berhasil disimpan.`,
    failed: `${moduleName} gagal diproses. Cek format gambar, ukuran file, atau log server.`,
    password_weak: "Password baru minimal 10 karakter dan harus memiliki huruf besar, huruf kecil, serta angka.",
    password_mismatch: "Konfirmasi password baru tidak sama.",
    password_invalid: "Password saat ini tidak sesuai.",
    self_protected: "Anda tidak dapat menonaktifkan atau mengganti role akun sendiri.",
    last_super_admin: "Super Admin terakhir tidak dapat dinonaktifkan atau diturunkan rolenya."
  };
  const isFailed = ["failed", "password_weak", "password_mismatch", "password_invalid", "self_protected", "last_super_admin"].includes(notice);

  return (
    <div className={`admin-notice ${notice}`}>
      <strong>{isFailed ? "Gagal" : "Berhasil"}</strong>
      <span>{messages[notice] || messages.saved}</span>
    </div>
  );
}

function SecurityModule({ data }) {
  return (
    <div className="security-module">
      <div className="security-summary">
        <article><ShieldCheck size={28} /><div><strong>Perlindungan Login Aktif</strong><span>Maksimal 5 kegagalan dalam 15 menit</span></div></article>
        <article><ChartLine size={28} /><div><strong>{data.failedToday} Percobaan Gagal</strong><span>Tercatat hari ini</span></div></article>
      </div>

      <div className="security-grid">
        <section className="admin-panel">
          <PanelHead title="Ganti Password" desc="Mengganti password akan mengakhiri semua sesi lama akun ini." />
          <AdminConfirmForm action={changePassword} className="password-form" confirmMessage="Yakin ingin mengganti password dan keluar dari semua sesi?">
            <label>Password Saat Ini<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
            <label>Password Baru<input name="newPassword" type="password" minLength={10} autoComplete="new-password" required /></label>
            <label>Konfirmasi Password<input name="confirmPassword" type="password" minLength={10} autoComplete="new-password" required /></label>
            <small>Minimal 10 karakter, termasuk huruf besar, huruf kecil, dan angka.</small>
            <button type="submit"><ShieldCheck size={17} /> Ganti Password</button>
          </AdminConfirmForm>
        </section>

        <section className="admin-panel">
          <PanelHead title="Riwayat Keamanan" desc="30 aktivitas keamanan terbaru." />
          <div className="security-log-list">
            {data.auditLogs.length ? data.auditLogs.map((log) => (
              <article key={log.id}>
                <div><strong>{log.details}</strong><span>{log.email}</span></div>
                <div><small>{log.ipAddress}</small><time>{log.date}</time></div>
              </article>
            )) : <p>Belum ada aktivitas keamanan.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminUsersModule({ data, currentUser }) {
  return (
    <div className="admin-users-module">
      <section className="admin-panel">
        <PanelHead title="Tambah Pengguna Admin" desc="Buat akun baru dan tentukan hak aksesnya." />
        <AdminConfirmForm action={createAdminUser} className="admin-user-create-form" confirmMessage="Buat akun admin baru ini?">
          <label>Nama<input name="name" required /></label>
          <label>Email<input name="email" type="email" autoComplete="off" required /></label>
          <label>Password Awal<input name="password" type="password" minLength={10} autoComplete="new-password" required /></label>
          <label>Role<select name="role" defaultValue="operator">{data.roles.map((role) => <option value={role.slug} key={role.slug}>{role.name}</option>)}</select></label>
          <button type="submit"><Plus size={16} /> Tambah Admin</button>
        </AdminConfirmForm>
      </section>

      <div className="role-access-grid">
        <article><strong>Super Admin</strong><span>Semua fitur, pengguna, pengaturan, statistik, dan keamanan.</span></article>
        <article><strong>Admin</strong><span>Konten website, dokter, jadwal, booking, dan statistik.</span></article>
        <article><strong>Operator</strong><span>Dashboard, booking pasien, dan keamanan akun sendiri.</span></article>
      </div>

      <section className="admin-panel admin-users-list-panel">
        <PanelHead title="Daftar Pengguna" desc={`${data.users.length} akun admin terdaftar.`} />
        <div className="admin-users-list">
          {data.users.map((admin) => (
            <AdminConfirmForm action={updateAdminUser} className="admin-user-row" confirmMessage={`Simpan perubahan akun ${admin.email}?`} key={admin.id}>
              <input type="hidden" name="id" value={admin.id} />
              <label>Nama<input name="name" defaultValue={admin.name} required /></label>
              <label>Email<input name="email" type="email" defaultValue={admin.email} required /></label>
              <label>Role<select name="role" defaultValue={admin.role}>{data.roles.map((role) => <option value={role.slug} key={role.slug}>{role.name}</option>)}</select></label>
              <label>Password Baru<input name="newPassword" type="password" minLength={10} autoComplete="new-password" placeholder="Kosongkan jika tetap" /></label>
              <label className="admin-active-check"><input name="isActive" type="checkbox" defaultChecked={admin.isActive} /> Aktif</label>
              <div className="admin-user-meta"><span>{admin.status}</span><small>Dibuat {admin.createdAt}</small>{admin.id === Number(currentUser.id) && <b>Akun Anda</b>}</div>
              <button type="submit"><Save size={15} /> Simpan</button>
            </AdminConfirmForm>
          ))}
        </div>
      </section>

      <section className="admin-panel login-history-panel">
        <PanelHead title="Riwayat Login" desc="50 percobaan login terbaru, termasuk login yang gagal." />
        <div className="login-history-table-wrap">
          <table className="login-history-table">
            <thead><tr><th>Waktu</th><th>Email</th><th>Alamat IP</th><th>Status</th></tr></thead>
            <tbody>
              {data.loginAttempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td>{attempt.date}</td><td>{attempt.email}</td><td>{attempt.ipAddress}</td>
                  <td><span className={attempt.success ? "login-ok" : "login-failed"}>{attempt.success ? "Berhasil" : "Gagal"}</span></td>
                </tr>
              ))}
              {!data.loginAttempts.length && <tr><td colSpan={4}>Belum ada riwayat login.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryPanel({ title, items, href }) {
  return (
    <section className="admin-panel">
      <div className="panel-head">
        <h2>{title}</h2>
        <Link className="text-link" href={href}>Kelola</Link>
      </div>
      <div className="crud-list">
        {items.map((item) => <p key={item}>{item}</p>)}
      </div>
    </section>
  );
}

function DoctorModule({ doctors }) {
  return (
    <section className="admin-panel">
      <PanelHead title="Data Dokter" desc="Tambah, edit, dan hapus profil dokter." />
      <AdminConfirmForm action={createDoctor} className="crud-form doctor-form" confirmMessage="Tambah data dokter ini?">
        <label>Nama Dokter<input name="name" placeholder="Contoh: dr. Sari Amelia" required /></label>
        <label>Spesialis<input name="specialty" placeholder="Contoh: Sp. Anak" required /></label>
        <label className="file-field">Foto dokter<input name="photoFile" type="file" accept="image/jpeg,image/png,image/webp" /></label>
        <label className="doctor-bio-field">Bio Singkat<textarea name="bio" placeholder="Tulis pengalaman, fokus layanan, atau pendekatan konsultasi dokter." /></label>
        <label className="check-field"><input type="checkbox" name="isActive" defaultChecked /> Aktif</label>
        <button><Plus size={16} /> Tambah</button>
      </AdminConfirmForm>
      <div className="crud-list">
        {doctors.map((doctor) => (
          <article className="crud-card doctor-card-admin" key={doctor.id}>
            <div className="doctor-admin-preview">
              <img src={doctor.image} alt={doctor.name} />
              <div>
                <strong>{doctor.name}</strong>
                <span>{doctor.specialty}</span>
              </div>
            </div>
            <div className="doctor-admin-editor">
              <AdminConfirmForm id={`doctor-edit-${doctor.id}`} action={updateDoctor} className="crud-form edit doctor-form doctor-edit-form" confirmMessage="Simpan perubahan data dokter ini?">
                <input type="hidden" name="id" defaultValue={doctor.id} />
                <input type="hidden" name="photo" defaultValue={doctor.photo} />
                <label>Nama Dokter<input name="name" defaultValue={doctor.name} required /></label>
                <label>Spesialis<input name="specialty" defaultValue={doctor.specialty} required /></label>
                <label className="file-field">Ganti foto<input name="photoFile" type="file" accept="image/jpeg,image/png,image/webp" /></label>
                <label className="check-field"><input type="checkbox" name="isActive" defaultChecked={doctor.isActive} /> Aktif</label>
                <label className="doctor-bio-field">Bio<textarea name="bio" defaultValue={doctor.bio} placeholder="Bio dokter" /></label>
              </AdminConfirmForm>
              <div className="doctor-admin-actions">
                <button className="icon-action-btn save-btn" type="submit" form={`doctor-edit-${doctor.id}`}><Save size={15} /> Simpan</button>
                <DeleteButton action={deleteDoctor} id={doctor.id} className="delete-form doctor-delete-form" buttonClassName="danger-btn icon-action-btn" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ScheduleModule({ schedules, doctors }) {
  return (
    <section className="admin-panel">
      <PanelHead title="Jadwal Praktik" desc="Tambah, edit, dan hapus jadwal dokter." />
      <AdminConfirmForm action={createSchedule} className="crud-form schedule-form" confirmMessage="Tambah jadwal praktik ini?">
        <label>Dokter<DoctorSelect doctors={doctors} /></label>
        <label>Hari Praktik<input name="day" placeholder="Contoh: Senin - Rabu" required /></label>
        <label>Mulai<input name="startTime" type="time" required /></label>
        <label>Selesai<input name="endTime" type="time" required /></label>
        <label>Kuota<input name="quota" type="number" min="0" placeholder="20" defaultValue="20" /></label>
        <label className="check-field"><input type="checkbox" name="isActive" defaultChecked /> Aktif</label>
        <button><Plus size={16} /> Tambah</button>
      </AdminConfirmForm>
      <div className="crud-list">
        {schedules.map((schedule) => (
          <article className="crud-card schedule-card-admin" key={schedule.id}>
            <div className="schedule-admin-preview">
              <strong>{schedule.doctor}</strong>
              <span>{schedule.day}</span>
              <small>{schedule.time}</small>
            </div>
            <div className="schedule-admin-editor">
              <AdminConfirmForm id={`schedule-edit-${schedule.id}`} action={updateSchedule} className="crud-form edit schedule-form schedule-edit-form" confirmMessage="Simpan perubahan jadwal ini?">
                <input type="hidden" name="id" defaultValue={schedule.id} />
                <label>Dokter<DoctorSelect doctors={doctors} defaultValue={schedule.doctorId} /></label>
                <label>Hari Praktik<input name="day" defaultValue={schedule.day} required /></label>
                <label>Mulai<input name="startTime" type="time" defaultValue={schedule.startTime} required /></label>
                <label>Selesai<input name="endTime" type="time" defaultValue={schedule.endTime} required /></label>
                <label>Kuota<input name="quota" type="number" min="0" defaultValue={schedule.quota} /></label>
                <label className="check-field"><input type="checkbox" name="isActive" defaultChecked={schedule.isActive} /> Aktif</label>
              </AdminConfirmForm>
              <div className="schedule-admin-actions">
                <button className="icon-action-btn save-btn" type="submit" form={`schedule-edit-${schedule.id}`}><Save size={15} /> Simpan</button>
                <DeleteButton action={deleteSchedule} id={schedule.id} className="delete-form schedule-delete-form" buttonClassName="danger-btn icon-action-btn" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function BookingModule({ bookings, doctors }) {
  return (
    <section className="admin-panel">
      <PanelHead title="Booking Pasien" desc="Tambah, edit, dan hapus reservasi pasien." />
      <AdminConfirmForm action={createBooking} className="crud-form module-form booking-form" confirmMessage="Tambah booking pasien ini?">
        <label>Kode Booking<input name="code" placeholder="Kode booking" defaultValue={`BK-${Date.now().toString().slice(-5)}`} required /></label>
        <label>Nama Pasien<input name="patientName" placeholder="Nama pasien" required /></label>
        <label>No. HP<input name="phone" placeholder="Nomor HP" required /></label>
        <label>Layanan<input name="service" placeholder="Layanan" required /></label>
        <label>Dokter<DoctorSelect doctors={doctors} optional /></label>
        <label>Tanggal Booking<input name="bookingDate" type="datetime-local" required /></label>
        <label>Status<StatusSelect name="status" /></label>
        <label>Catatan<input name="notes" placeholder="Catatan" /></label>
        <button><Plus size={16} /> Tambah</button>
      </AdminConfirmForm>
      <div className="crud-list">
        {bookings.map((booking) => (
          <article className="crud-card module-card-admin" key={booking.id}>
            <div className="module-admin-preview with-image">
              <strong>{booking.patient}</strong>
              <span>{booking.service}</span>
              <small>{booking.code}</small>
            </div>
            <div className="module-admin-editor">
              <AdminConfirmForm id={`booking-edit-${booking.id}`} action={updateBooking} className="crud-form edit module-form module-edit-form booking-edit-form" confirmMessage="Simpan perubahan booking ini?">
                <input type="hidden" name="id" defaultValue={booking.id} />
                <label>Kode<input name="code" defaultValue={booking.code} required /></label>
                <label>Pasien<input name="patientName" defaultValue={booking.patient} required /></label>
                <label>No. HP<input name="phone" defaultValue={booking.phone} required /></label>
                <label>Layanan<input name="service" defaultValue={booking.service} required /></label>
                <label>Dokter<DoctorSelect doctors={doctors} optional defaultValue={booking.doctorId} /></label>
                <label>Tanggal<input name="bookingDate" type="datetime-local" defaultValue={booking.bookingDateInput} required /></label>
                <label>Status<StatusSelect name="status" defaultValue={booking.rawStatus} /></label>
                <label>Catatan<input name="notes" defaultValue={booking.notes} placeholder="Catatan" /></label>
              </AdminConfirmForm>
              <div className="module-admin-actions">
                <button className="icon-action-btn save-btn" type="submit" form={`booking-edit-${booking.id}`}><Save size={15} /> Simpan</button>
                <DeleteButton action={deleteBooking} id={booking.id} className="delete-form module-delete-form" buttonClassName="danger-btn icon-action-btn" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ServiceModule({ services }) {
  return (
    <section className="admin-panel">
      <PanelHead title="Layanan Website" desc="Tambah, edit, dan hapus layanan homepage." />
      <AdminConfirmForm action={createService} className="crud-form module-form service-admin-form" confirmMessage="Tambah layanan ini?">
        <label>Nama Layanan<input name="title" placeholder="Nama layanan" required /></label>
        <label>Slug<input name="slug" placeholder="slug-layanan" /></label>
        <label>Deskripsi<input name="description" placeholder="Deskripsi" required /></label>
        <label>Icon<input name="icon" placeholder="pregnant, baby, lab, bed" /></label>
        <label className="file-field">Gambar layanan<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" /></label>
        <label className="check-field"><input type="checkbox" name="isFeatured" defaultChecked /> Unggulan</label>
        <label className="check-field"><input type="checkbox" name="isActive" defaultChecked /> Aktif</label>
        <button><Plus size={16} /> Tambah</button>
      </AdminConfirmForm>
      <div className="crud-list">
        {services.map((service) => (
          <article className="crud-card module-card-admin" key={service.id}>
            <div className="module-admin-preview with-image">
              <strong>{service.title}</strong>
              <span>{service.slug}</span>
              <small>{service.isActive ? "Aktif" : "Nonaktif"}</small>
            </div>
            <div className="module-admin-editor">
              <AdminConfirmForm id={`service-edit-${service.id}`} action={updateService} className="crud-form edit module-form module-edit-form service-edit-form" confirmMessage="Simpan perubahan layanan ini?">
                <input type="hidden" name="id" defaultValue={service.id} />
                <input type="hidden" name="image" defaultValue={service.imageFile} />
                <label>Nama<input name="title" defaultValue={service.title} required /></label>
                <label>Slug<input name="slug" defaultValue={service.slug} required /></label>
                <label>Deskripsi<input name="description" defaultValue={service.description} required /></label>
                <label>Icon<input name="icon" defaultValue={service.icon} /></label>
                <label className="file-field">Ganti gambar<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" /></label>
                <label className="check-field"><input type="checkbox" name="isFeatured" defaultChecked={service.isFeatured} /> Unggulan</label>
                <label className="check-field"><input type="checkbox" name="isActive" defaultChecked={service.isActive} /> Aktif</label>
              </AdminConfirmForm>
              <div className="module-admin-actions">
                <button className="icon-action-btn save-btn" type="submit" form={`service-edit-${service.id}`}><Save size={15} /> Simpan</button>
                <DeleteButton action={deleteService} id={service.id} className="delete-form module-delete-form" buttonClassName="danger-btn icon-action-btn" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ArticleModule({ articles }) {
  return (
    <section className="admin-panel">
      <PanelHead title="Artikel Edukasi" desc="Tambah, edit, dan hapus artikel website." />
      <AdminConfirmForm action={createArticle} className="crud-form module-form article-admin-form" confirmMessage="Tambah artikel ini?">
        <label>Judul Artikel<input name="title" placeholder="Judul artikel" required /></label>
        <label>Slug<input name="slug" placeholder="slug-artikel" /></label>
        <label>Kategori<input name="category" placeholder="Kategori" required /></label>
        <label>Ringkasan<input name="excerpt" placeholder="Ringkasan" required /></label>
        <label className="file-field">Gambar artikel<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" /></label>
        <label>Status<select name="status" defaultValue="publish"><option value="publish">Publish</option><option value="draft">Draft</option></select></label>
        <label className="module-full-field">Konten Artikel<textarea name="content" placeholder="Konten artikel" required /></label>
        <button><Plus size={16} /> Tambah</button>
      </AdminConfirmForm>
      <div className="crud-list">
        {articles.map((article) => (
          <article className="crud-card module-card-admin" key={article.id}>
            <div className="module-admin-preview">
              <img className="module-preview-image" src={article.image} alt={article.title} />
              <div>
                <strong>{article.title}</strong>
                <span>{article.category}</span>
                <small>{article.status}</small>
              </div>
            </div>
            <div className="module-admin-editor">
              <AdminConfirmForm id={`article-edit-${article.id}`} action={updateArticle} className="crud-form edit module-form module-edit-form article-edit-form" confirmMessage="Simpan perubahan artikel ini?">
                <input type="hidden" name="id" defaultValue={article.id} />
                <input type="hidden" name="image" defaultValue={article.imageFile} />
                <label>Judul<input name="title" defaultValue={article.title} required /></label>
                <label>Slug<input name="slug" defaultValue={article.slug} required /></label>
                <label>Kategori<input name="category" defaultValue={article.category} required /></label>
                <label>Ringkasan<input name="excerpt" defaultValue={article.excerpt} required /></label>
                <label className="file-field">Ganti gambar<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" /></label>
                <label>Status<select name="status" defaultValue={article.status}><option value="publish">Publish</option><option value="draft">Draft</option></select></label>
                <label className="module-full-field">Konten<textarea name="content" defaultValue={article.content} required /></label>
              </AdminConfirmForm>
              <div className="module-admin-actions">
                <button className="icon-action-btn save-btn" type="submit" form={`article-edit-${article.id}`}><Save size={15} /> Simpan</button>
                <DeleteButton action={deleteArticle} id={article.id} className="delete-form module-delete-form" buttonClassName="danger-btn icon-action-btn" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function GalleryModule({ galleries }) {
  return (
    <section className="admin-panel">
      <PanelHead title="Galeri Rumah Sakit" desc="Tambah, edit, dan hapus foto fasilitas." />
      <AdminConfirmForm action={createGallery} className="crud-form module-form gallery-admin-form" confirmMessage="Tambah foto galeri ini?">
        <label>Judul Foto<input name="title" placeholder="Judul foto" required /></label>
        <label className="file-field">Upload foto<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
        <label>Alt Text<input name="alt" placeholder="Alt text" /></label>
        <label className="check-field"><input type="checkbox" name="isActive" defaultChecked /> Aktif</label>
        <button><Plus size={16} /> Tambah</button>
      </AdminConfirmForm>
      <div className="crud-list">
        {galleries.map((gallery) => (
          <article className="crud-card module-card-admin" key={gallery.id}>
            <div className="module-admin-preview">
              <img className="module-preview-image" src={gallery.image} alt={gallery.alt || gallery.title} />
              <div>
                <strong>{gallery.title}</strong>
                <span>{gallery.alt}</span>
                <small>{gallery.status}</small>
              </div>
            </div>
            <div className="module-admin-editor">
              <AdminConfirmForm id={`gallery-edit-${gallery.id}`} action={updateGallery} className="crud-form edit module-form module-edit-form gallery-edit-form" confirmMessage="Simpan perubahan foto galeri ini?">
                <input type="hidden" name="id" defaultValue={gallery.id} />
                <input type="hidden" name="image" defaultValue={gallery.imageFile} />
                <label>Judul<input name="title" defaultValue={gallery.title} required /></label>
                <label className="file-field">Ganti foto<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" /></label>
                <label>Alt Text<input name="alt" defaultValue={gallery.alt} /></label>
                <label className="check-field"><input type="checkbox" name="isActive" defaultChecked={gallery.isActive} /> Aktif</label>
              </AdminConfirmForm>
              <div className="module-admin-actions">
                <button className="icon-action-btn save-btn" type="submit" form={`gallery-edit-${gallery.id}`}><Save size={15} /> Simpan</button>
                <DeleteButton action={deleteGallery} id={gallery.id} className="delete-form module-delete-form" buttonClassName="danger-btn icon-action-btn" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsModule({ user, settings }) {
  const heroPreview = imageUrl(settings.hero_image, "/uploads/hero-rsia-bunda-annisyah.png");

  return (
    <section className="admin-panel">
      <PanelHead title="Pengaturan" desc="Konfigurasi dasar admin, kontak, dan teks homepage." />
      <AdminConfirmForm action={updateSettings} className="settings-grid editable" confirmMessage="Simpan perubahan pengaturan website?">
        <label>Nama Admin<input defaultValue={user.name} readOnly /></label>
        <label>Role<input defaultValue={user.role} readOnly /></label>
        <label>Nama Website<input name="site_name" defaultValue={settings.site_name} required /></label>
        <label>Tagline<input name="site_tagline" defaultValue={settings.site_tagline} required /></label>
        <label>Telepon<input name="phone" defaultValue={settings.phone} required /></label>
        <label>WhatsApp<input name="whatsapp" defaultValue={settings.whatsapp} required /></label>
        <label>Facebook URL<input name="facebook_url" defaultValue={settings.facebook_url} placeholder="https://facebook.com/..." /></label>
        <label>Instagram URL<input name="instagram_url" defaultValue={settings.instagram_url} placeholder="https://instagram.com/..." /></label>
        <label>YouTube URL<input name="youtube_url" defaultValue={settings.youtube_url} placeholder="https://youtube.com/..." /></label>
        <label className="settings-wide">Alamat<textarea name="address" defaultValue={settings.address} required /></label>
        <label>Hero Eyebrow<input name="hero_eyebrow" defaultValue={settings.hero_eyebrow} required /></label>
        <label className="settings-wide">Hero Title<textarea name="hero_title" defaultValue={settings.hero_title} required /></label>
        <label className="settings-wide">Hero Description<textarea name="hero_description" defaultValue={settings.hero_description} required /></label>
        <input type="hidden" name="hero_image" defaultValue={settings.hero_image || ""} />
        <label className="file-field settings-file-field">Hero Image<input name="heroImageFile" type="file" accept="image/jpeg,image/png,image/webp" /></label>
        <div className="settings-image-preview">
          <span>Preview Hero Image</span>
          <img src={heroPreview} alt="Preview hero homepage" />
          <small>{settings.hero_image ? `Tersimpan: ${settings.hero_image}` : "Belum ada gambar hero di database."}</small>
        </div>
        <label className="settings-wide">Google Maps Embed URL<textarea name="maps_embed_url" defaultValue={settings.maps_embed_url} placeholder="Tempel URL dari src iframe Google Maps embed" /></label>
        <p className="settings-help">Lokasi peta di halaman depan akan mengikuti URL ini dari database. Ambil dari Google Maps: Share, Embed a map, lalu salin isi src iframe.</p>
        <button className="settings-save">Simpan Pengaturan</button>
      </AdminConfirmForm>
    </section>
  );
}

function PanelHead({ title, desc }) {
  return (
    <div className="panel-head">
      <div>
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
    </div>
  );
}

function DeleteButton({ action, id, className = "delete-form", buttonClassName = "danger-btn" }) {
  return (
    <AdminConfirmForm action={action} className={className} confirmMessage="Yakin ingin menghapus data ini? Data yang dihapus tidak bisa dikembalikan.">
      <input type="hidden" name="id" defaultValue={id} />
      <button className={buttonClassName}><Trash2 size={15} /> Hapus</button>
    </AdminConfirmForm>
  );
}

function DoctorSelect({ doctors, defaultValue = "", optional = false }) {
  return (
    <select name="doctorId" defaultValue={defaultValue}>
      {optional && <option value="">Tanpa dokter</option>}
      {doctors.map((doctor) => <option value={doctor.id} key={doctor.id}>{doctor.name}</option>)}
    </select>
  );
}

function StatusSelect({ name, defaultValue = "menunggu" }) {
  return (
    <select name={name} defaultValue={defaultValue}>
      <option value="menunggu">Menunggu</option>
      <option value="terkonfirmasi">Terkonfirmasi</option>
      <option value="batal">Batal</option>
    </select>
  );
}
