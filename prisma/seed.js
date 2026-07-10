const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

function createMariaDbAdapter() {
  const databaseUrl = new URL(process.env.DATABASE_URL);

  return new PrismaMariaDb({
    host: databaseUrl.hostname,
    port: databaseUrl.port ? Number(databaseUrl.port) : 3306,
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.replace("/", "")
  });
}

const prisma = new PrismaClient({
  adapter: createMariaDbAdapter()
});

async function main() {
  const superAdmin = await prisma.role.upsert({
    where: { slug: "super_admin" },
    update: {},
    create: {
      name: "Super Admin",
      slug: "super_admin",
      permissions: {
        create: [
          { name: "Manage Users", slug: "manage_users" },
          { name: "Manage Content", slug: "manage_content" },
          { name: "Manage Booking", slug: "manage_booking" }
        ]
      }
    }
  });

  await prisma.role.upsert({
    where: { slug: "admin" },
    update: {},
    create: { name: "Admin", slug: "admin" }
  });

  await prisma.role.upsert({
    where: { slug: "operator" },
    update: {},
    create: { name: "Operator", slug: "operator" }
  });

  await prisma.user.upsert({
    where: { email: "admin@rsia.test" },
    update: {
      roleId: superAdmin.id,
      isActive: true
    },
    create: {
      name: "Admin RSIA",
      email: "admin@rsia.test",
      password: await bcrypt.hash("password", 10),
      roleId: superAdmin.id
    }
  });

  await prisma.service.createMany({
    data: [
      { title: "Kandungan & Persalinan", slug: "kandungan-persalinan", description: "Konsultasi kehamilan, USG, dan persalinan.", icon: "pregnant", isFeatured: true },
      { title: "Kesehatan Anak", slug: "kesehatan-anak", description: "Pemeriksaan anak, imunisasi, dan tumbuh kembang.", icon: "baby", isFeatured: true },
      { title: "Laboratorium", slug: "laboratorium", description: "Pemeriksaan penunjang medis.", icon: "lab", isFeatured: true },
      { title: "Rawat Inap", slug: "rawat-inap", description: "Kamar nyaman untuk pemulihan pasien.", icon: "bed", isFeatured: true }
    ],
    skipDuplicates: true
  });

  const drAndi = await prisma.doctor.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Dr. Andi Pratama",
      specialty: "Sp. Obstetri & Ginekologi",
      photo: "https://randomuser.me/api/portraits/men/32.jpg",
      bio: "Dokter kandungan untuk konsultasi kehamilan dan persalinan."
    }
  });

  const drSari = await prisma.doctor.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Dr. Sari Amelia",
      specialty: "Sp. Anak",
      photo: "https://randomuser.me/api/portraits/women/44.jpg",
      bio: "Dokter anak untuk imunisasi, tumbuh kembang, dan konsultasi anak."
    }
  });

  const drBudi = await prisma.doctor.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: "Dr. Budi Santoso",
      specialty: "Dokter Umum",
      photo: "https://randomuser.me/api/portraits/men/45.jpg",
      bio: "Dokter umum untuk pemeriksaan keluarga."
    }
  });

  await prisma.doctorSchedule.createMany({
    data: [
      { doctorId: drAndi.id, day: "Senin - Rabu", startTime: "09:00", endTime: "12:00", quota: 20 },
      { doctorId: drSari.id, day: "Selasa - Jumat", startTime: "13:00", endTime: "16:00", quota: 0 },
      { doctorId: drBudi.id, day: "Setiap Hari", startTime: "08:00", endTime: "20:00", quota: 30 }
    ],
    skipDuplicates: true
  });

  await prisma.article.createMany({
    data: [
      {
        title: "Persiapan kontrol kehamilan agar kunjungan lebih nyaman",
        slug: "persiapan-kontrol-kehamilan",
        category: "Kehamilan",
        excerpt: "Catat keluhan, obat yang dikonsumsi, dan pertanyaan penting sebelum bertemu dokter.",
        content: "Kontrol kehamilan menjadi lebih efektif jika bunda membawa catatan keluhan, riwayat obat, dan pertanyaan yang ingin dikonsultasikan.",
        image: "https://images.unsplash.com/photo-1580281658629-0d1f2c6b0f78?auto=format&fit=crop&w=900&q=80",
        status: "publish",
        publishedAt: new Date()
      },
      {
        title: "Tanda anak perlu segera diperiksa ke dokter",
        slug: "tanda-anak-perlu-diperiksa",
        category: "Anak",
        excerpt: "Demam tinggi, sulit minum, atau tampak lemas perlu diperhatikan sejak dini.",
        content: "Orang tua perlu memperhatikan tanda bahaya seperti demam tinggi, napas cepat, sulit minum, atau anak tampak sangat lemas.",
        image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=900&q=80",
        status: "publish",
        publishedAt: new Date()
      }
    ],
    skipDuplicates: true
  });

  await prisma.gallery.createMany({
    data: [
      { title: "Ruang Pemeriksaan", image: "https://images.unsplash.com/photo-1580281658629-0d1f2c6b0f78?auto=format&fit=crop&w=900&q=80", alt: "Ruang pemeriksaan" },
      { title: "Koridor Rumah Sakit", image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=900&q=80", alt: "Koridor rumah sakit" }
    ],
    skipDuplicates: true
  });

  await prisma.booking.createMany({
    data: [
      { code: "BK-1024", patientName: "Nur Aini", phone: "081234567890", service: "Poli Anak", doctorId: drSari.id, bookingDate: new Date(), status: "terkonfirmasi" },
      { code: "BK-1025", patientName: "Rizki Putra", phone: "081234567891", service: "USG Kehamilan", doctorId: drAndi.id, bookingDate: new Date(), status: "menunggu" }
    ],
    skipDuplicates: true
  });

  await prisma.siteSetting.createMany({
    data: [
      { key: "site_name", label: "Nama Website", value: "RSIA Bunda Annisyah", group: "identity" },
      { key: "site_tagline", label: "Tagline", value: "Mother & Child Hospital", group: "identity" },
      { key: "phone", label: "Telepon", value: "(0761) 123456", group: "contact" },
      { key: "whatsapp", label: "WhatsApp", value: "+62 811-8951-181", group: "contact" },
      { key: "facebook_url", label: "Facebook URL", value: "https://facebook.com/rsiabundaanisyah", group: "social" },
      { key: "instagram_url", label: "Instagram URL", value: "https://instagram.com/rsiabundaanisyah", group: "social" },
      { key: "youtube_url", label: "YouTube URL", value: "https://youtube.com/@rsiabundaanisyah", group: "social" },
      { key: "address", label: "Alamat", value: "Jl. HR. Soebrantas, Pekanbaru", group: "contact", type: "textarea" },
      { key: "hero_eyebrow", label: "Hero Eyebrow", value: "Pelayanan ibu dan anak terpercaya", group: "homepage" },
      { key: "hero_title", label: "Hero Title", value: "Kesehatan bunda dan buah hati, kami dampingi dengan hati.", group: "homepage", type: "textarea" },
      { key: "hero_description", label: "Hero Description", value: "Website Next.js ini siap dibuat dinamis dengan database MySQL untuk dokter, jadwal, booking, layanan, artikel, galeri, user, dan role akses.", group: "homepage", type: "textarea" },
      { key: "hero_image", label: "Hero Image", value: "/uploads/hero-rsia-bunda-annisyah.png", group: "homepage" },
      { key: "maps_embed_url", label: "Google Maps Embed URL", value: "", group: "contact", type: "textarea" }
    ],
    skipDuplicates: true
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
