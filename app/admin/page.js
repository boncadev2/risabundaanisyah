import Link from "next/link";
import { redirect } from "next/navigation";
import AdminConfirmForm from "@/components/AdminConfirmForm";
import {
  CalendarDays,
  ChartLine,
  ClipboardList,
  FileText,
  GalleryHorizontal,
  LogOut,
  Plus,
  Save,
  Settings,
  Stethoscope,
  Trash2,
  UsersRound
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getAdminData } from "@/lib/cms";
import { imageUrl } from "@/lib/images";
import {
  createArticle,
  createBooking,
  createDoctor,
  createGallery,
  createSchedule,
  createService,
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
  updateSettings
} from "./actions";

const modules = [
  { label: "Dashboard", slug: "dashboard", icon: ChartLine },
  { label: "Dokter", slug: "dokter", icon: UsersRound },
  { label: "Jadwal", slug: "jadwal", icon: CalendarDays },
  { label: "Booking", slug: "booking", icon: ClipboardList },
  { label: "Layanan", slug: "layanan", icon: Stethoscope },
  { label: "Artikel", slug: "artikel", icon: FileText },
  { label: "Galeri", slug: "galeri", icon: GalleryHorizontal },
  { label: "Pengaturan", slug: "pengaturan", icon: Settings }
];

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const activeModule = modules.some((item) => item.slug === params?.module) ? params.module : "dashboard";
  const activeLabel = modules.find((item) => item.slug === activeModule)?.label || "Dashboard";
  const notice = params?.notice || "";
  const data = await getAdminData();

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
          {modules.map(({ label, slug, icon: Icon }) => (
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

function AdminNotice({ notice, moduleName }) {
  if (!notice) return null;

  const messages = {
    created: `${moduleName} berhasil ditambahkan.`,
    updated: `${moduleName} berhasil diperbarui.`,
    deleted: `${moduleName} berhasil dihapus.`,
    saved: `${moduleName} berhasil disimpan.`
  };

  return (
    <div className={`admin-notice ${notice}`}>
      <strong>Berhasil</strong>
      <span>{messages[notice] || messages.saved}</span>
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
        <label className="file-field">Foto dokter<input name="photoFile" type="file" accept="image/*" /></label>
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
                <label className="file-field">Ganti foto<input name="photoFile" type="file" accept="image/*" /></label>
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
        <label className="file-field">Gambar layanan<input name="imageFile" type="file" accept="image/*" /></label>
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
                <label className="file-field">Ganti gambar<input name="imageFile" type="file" accept="image/*" /></label>
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
        <label className="file-field">Gambar artikel<input name="imageFile" type="file" accept="image/*" /></label>
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
                <label className="file-field">Ganti gambar<input name="imageFile" type="file" accept="image/*" /></label>
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
        <label className="file-field">Upload foto<input name="imageFile" type="file" accept="image/*" required /></label>
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
                <label className="file-field">Ganti foto<input name="imageFile" type="file" accept="image/*" /></label>
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
        <label className="file-field settings-file-field">Hero Image<input name="heroImageFile" type="file" accept="image/*" /></label>
        <div className="settings-image-preview">
          <span>Preview Hero Image</span>
          <img src={heroPreview} alt="Preview hero homepage" />
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
