import Image from "next/image";
import Link from "next/link";
import ArticleGrid from "@/components/ArticleGrid";
import DoctorSlider from "@/components/DoctorSlider";
import GalleryGrid from "@/components/GalleryGrid";
import HeroSearchPanel from "@/components/HeroSearchPanel";
import LoadingReveal from "@/components/LoadingReveal";
import MobileAutoSlider from "@/components/MobileAutoSlider";
import MobileMenu from "@/components/MobileMenu";
import {
  Ambulance,
  Baby,
  BedDouble,
  CalendarCheck,
  ClipboardList,
  Facebook,
  FlaskConical,
  HeartPulse,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserRoundPlus,
  Youtube
} from "lucide-react";
import { getPublicData } from "@/lib/cms";
import { imageUrl } from "@/lib/images";

const iconMap = {
  pregnant: HeartPulse,
  baby: Baby,
  lab: FlaskConical,
  bed: BedDouble
};

const serviceImages = {
  pregnant: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=900&q=80",
  baby: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=900&q=80",
  lab: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=80",
  bed: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80"
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { articles, doctors, galleries, services, settings } = await getPublicData();
  const heroImage = imageUrl(settings.hero_image, "/uploads/hero-rsia-bunda-annisyah.png");
  const mapEmbedUrl = String(settings.maps_embed_url || "").trim();
  const whatsappHref = `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Halo RSIA Bunda Annisyah, saya ingin booking jadwal konsultasi.")}`;
  const doctorScheduleRows = doctors.flatMap((doctor) => {
    const schedules = Array.isArray(doctor.schedules) && doctor.schedules.length
      ? doctor.schedules
      : [{ day: doctor.schedule, time: doctor.time, status: doctor.status }];

    return schedules.map((schedule, index) => ({
      key: `${doctor.name}-${schedule.day}-${schedule.time}-${index}`,
      name: doctor.name,
      specialty: doctor.specialty,
      day: schedule.day || "Belum diatur",
      time: schedule.time || "-",
      status: schedule.status || doctor.status
    }));
  });
  const socialLinks = [
    { label: "Facebook", href: settings.facebook_url, Icon: Facebook },
    { label: "Instagram", href: settings.instagram_url, Icon: Instagram },
    { label: "YouTube", href: settings.youtube_url, Icon: Youtube }
  ].filter((item) => item.href);

  return (
    <main>
      <div className="utility-bar">
        <div className="container utility-inner">
          <div className="utility-links">
            <a href="#kontak">Pasien & Pengunjung</a>
            <a href="#artikel">Edukasi Kesehatan</a>
            <a href="#layanan">Layanan RSIA</a>
          </div>
          <div className="utility-contact">
            <a href={whatsappHref}>WhatsApp {settings.whatsapp}</a>
            <span><Phone size={15} /> IGD 24 Jam: {settings.phone}</span>
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand">
            <Image src="/logo.png" width={52} height={52} alt="Logo RSIA Bunda Annisyah" />
            <span>
              <strong>{settings.site_name}</strong>
              <small>{settings.site_tagline}</small>
            </span>
          </Link>
          <nav className="site-nav">
            <a href="#dokter">Cari Dokter</a>
            <a href="#layanan">Layanan Kesehatan</a>
            <a href="#dokter">Dokter</a>
            <a href="#jadwal">Buat Janji</a>
            <a href="#artikel">Artikel</a>
            <Link href="/admin" className="nav-login"><ShieldCheck size={17} /> Admin</Link>
          </nav>
          <MobileMenu />
        </div>
      </header>

      <section className="hero" style={{ "--hero-image": `url("${heroImage}")` }}>
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-kicker">{settings.hero_eyebrow}</span>
            <h1>{settings.hero_title}</h1>
            <p>{settings.hero_description}</p>
            <div className="hero-actions">
              <a className="btn primary" href="#jadwal"><CalendarCheck size={18} /> Lihat Jadwal</a>
              <a className="btn secondary" href={`tel:${settings.phone}`}><Phone size={18} /> Hubungi RS</a>
            </div>
          </div>

          <div className="hero-panel" aria-label="Pencarian layanan">
            <HeroSearchPanel />
            <div className="emergency-strip">
              <Ambulance size={60} />
              <div>
                <span>Gawat Darurat</span>
                <strong>Siaga 24 Jam</strong>
              </div>
              <a href={`tel:${settings.phone}`}>Panggil</a>
            </div>
          </div>
        </div>
      </section>

      <LoadingReveal type="quick" count={4}>
        <section className="quick-actions container">
          {[
            ["Cari Dokter", Stethoscope],
            ["Daftar Online", ClipboardList],
            ["Jadwal Praktik", CalendarCheck],
            ["IGD 24 Jam", Ambulance]
          ].map(([label, Icon]) => (
            <a href="#jadwal" className="quick-card" key={label}>
              <Icon size={50} />
              <span>{label}</span>
            </a>
          ))}
        </section>
      </LoadingReveal>

      <section className="section container" id="layanan">
        <div className="section-head feature-head">
          <span className="pill">Layanan Kesehatan</span>
          <h2>Perawatan lengkap untuk bunda, bayi, dan keluarga.</h2>
        </div>
        <LoadingReveal className="service-grid" count={services.length || 4}>
          <MobileAutoSlider label="Layanan" className="service-mobile-slider">
            {services.map((service) => {
              const Icon = iconMap[service.icon] || HeartPulse;
              const image = serviceImages[service.icon] || serviceImages.pregnant;
              return (
                <article className="service-card" key={service.title}>
                  <div className="service-media">
                    <img src={image} alt={service.title} />
                    <span><Icon size={22} /></span>
                  </div>
                  <div className="service-content">
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <a href="#jadwal">Konsultasi layanan</a>
                  </div>
                </article>
              );
            })}
          </MobileAutoSlider>
        </LoadingReveal>
      </section>

      <section className="section container" id="dokter">
        <div className="section-head feature-head">
          <span className="pill">Cari Dokter</span>
          <h2>Temukan dokter dan jadwal praktik yang tersedia.</h2>
        </div>
        <DoctorSlider doctors={doctors} />
      </section>

      <section className="section container" id="jadwal">
        <div className="appointment-band">
          <div>
            <span className="pill">Buat Janji Temu</span>
            <h2>Reservasi lebih mudah melalui WhatsApp rumah sakit.</h2>
            <p>Tim administrasi akan membantu memilih poli, dokter, dan jadwal kunjungan yang sesuai.</p>
          </div>
          <a className="btn primary" href={whatsappHref}>Booking via WhatsApp</a>
        </div>
        <div className="section-head feature-head schedule-head">
          <span className="pill">Jadwal Praktik</span>
          <h2>Jadwal dokter hari ini.</h2>
        </div>
        <LoadingReveal type="table">
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Dokter</th>
                  <th>Spesialis</th>
                  <th>Hari</th>
                  <th>Jam</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {doctorScheduleRows.map((schedule) => (
                  <tr key={schedule.key}>
                    <td>{schedule.name}</td>
                    <td>{schedule.specialty}</td>
                    <td>{schedule.day}</td>
                    <td>{schedule.time}</td>
                    <td><span className={schedule.status === "Tersedia" ? "badge success" : "badge danger"}>{schedule.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </LoadingReveal>
      </section>

      <section className="section articles" id="artikel">
        <div className="container">
          <div className="section-head feature-head action-head">
            <span className="pill">Artikel Edukasi</span>
            <h2>Informasi kesehatan untuk keluarga.</h2>
            <Link className="btn secondary compact" href="/artikel">More Artikel</Link>
          </div>
          <ArticleGrid articles={articles} />
        </div>
      </section>

      <section className="section container" id="galeri">
        <div className="section-head feature-head action-head">
          <span className="pill">Galeri RSIA</span>
          <h2>Lihat suasana layanan dan fasilitas rumah sakit.</h2>
          <Link className="btn secondary compact" href="/galeri">More Galeri</Link>
        </div>
        <GalleryGrid galleries={(galleries || []).slice(0, 6)} />
      </section>

      <footer className="site-footer" id="kontak">
        <div className="container footer-grid">
          <div className="footer-brand">
            <Image src="/logo.png" width={72} height={72} alt="Logo RSIA Bunda Annisyah" />
            <h2>{settings.site_name}</h2>
            <p>{settings.site_tagline}</p>
            <div className="footer-cert">
              <ShieldCheck size={18} />
              <span>Layanan ibu dan anak yang aman, nyaman, dan terpercaya.</span>
            </div>
            <div className="footer-social">
              {socialLinks.map(({ label, href, Icon }) => (
                <a href={href} target="_blank" rel="noreferrer" aria-label={label} key={label}>
                  <Icon size={18} />
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="footer-col">
            <h3>Kontak</h3>
            <p><MapPin size={17} /> {settings.address}</p>
            <p><Phone size={17} /> {settings.phone}</p>
            <p><UserRoundPlus size={17} /> {settings.whatsapp}</p>
          </div>

          <div className="footer-col">
            <h3>Layanan</h3>
            {services.slice(0, 5).map((service) => (
              <a href="#layanan" key={service.title}>{service.title}</a>
            ))}
          </div>

          <div className="footer-col">
            <h3>Jam Layanan</h3>
            <p>IGD dan farmasi siaga 24 jam.</p>
            <p>Poliklinik mengikuti jadwal dokter yang tersedia.</p>

          </div>

          <div className="footer-map">
            {mapEmbedUrl ? (
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="260"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Peta ${settings.site_name}`}
              />
            ) : (
              <div className="footer-map-empty">
                <MapPin size={28} />
                <strong>Lokasi Google Maps belum diatur</strong>
                <span>{settings.address}</span>
              </div>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <span>© 2026 {settings.site_name}. All Rights Reserved.</span>
          </div>
        </div>
      </footer>

      <a className="whatsapp-livechat" href={whatsappHref} target="_blank" rel="noreferrer" aria-label="Booking via WhatsApp">
        <span>
          <small>Butuh bantuan?</small>
          <strong>Booking via WhatsApp</strong>
        </span>
        <i><MessageCircle size={25} /></i>
      </a>
    </main>
  );
}
