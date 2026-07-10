export const services = [
  {
    title: "Kandungan & Persalinan",
    description: "Konsultasi kehamilan, USG, persalinan normal, dan tindakan oleh tim medis.",
    icon: "pregnant"
  },
  {
    title: "Kesehatan Anak",
    description: "Pemeriksaan anak, imunisasi, tumbuh kembang, dan konsultasi keluhan harian.",
    icon: "baby"
  },
  {
    title: "Laboratorium",
    description: "Pemeriksaan penunjang dengan proses ringkas dan hasil yang mudah dikonsultasikan.",
    icon: "lab"
  },
  {
    title: "Rawat Inap",
    description: "Kamar nyaman dengan pendampingan perawat untuk pemulihan bunda dan buah hati.",
    icon: "bed"
  }
];

export const doctors = [
  {
    name: "Dr. Andi Pratama",
    specialty: "Sp. Obstetri & Ginekologi",
    bio: "Berpengalaman mendampingi pemeriksaan kehamilan, konsultasi persalinan, dan kesehatan reproduksi perempuan dengan pendekatan komunikatif.",
    schedule: "Senin - Rabu",
    time: "09:00 - 12:00",
    status: "Tersedia",
    image: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    name: "Dr. Sari Amelia",
    specialty: "Sp. Anak",
    bio: "Fokus pada layanan kesehatan anak, imunisasi, tumbuh kembang, dan konsultasi keluhan harian bayi hingga anak.",
    schedule: "Selasa - Jumat",
    time: "13:00 - 16:00",
    status: "Penuh",
    image: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    name: "Dr. Budi Santoso",
    specialty: "Dokter Umum",
    bio: "Melayani pemeriksaan umum keluarga, keluhan harian, skrining awal, dan rujukan lanjutan bila diperlukan.",
    schedule: "Setiap Hari",
    time: "08:00 - 20:00",
    status: "Tersedia",
    image: "https://randomuser.me/api/portraits/men/45.jpg"
  }
];

export const articles = [
  {
    title: "Persiapan kontrol kehamilan agar kunjungan lebih nyaman",
    category: "Kehamilan",
    description: "Catat keluhan, obat yang dikonsumsi, dan pertanyaan penting sebelum bertemu dokter.",
    image: "https://images.unsplash.com/photo-1580281658629-0d1f2c6b0f78?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Tanda anak perlu segera diperiksa ke dokter",
    category: "Anak",
    description: "Demam tinggi, sulit minum, atau tampak lemas perlu diperhatikan sejak dini.",
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Kapan keluarga perlu pemeriksaan laboratorium?",
    category: "Laboratorium",
    description: "Pemeriksaan penunjang membantu dokter menilai kondisi secara lebih akurat.",
    image: "https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=900&q=80"
  }
];

export const bookings = [
  { code: "BK-1024", patient: "Nur Aini", service: "Poli Anak", doctor: "Dr. Sari Amelia", date: "08 Jul 2026", status: "Terkonfirmasi" },
  { code: "BK-1025", patient: "Rizki Putra", service: "USG Kehamilan", doctor: "Dr. Andi Pratama", date: "08 Jul 2026", status: "Menunggu" },
  { code: "BK-1026", patient: "Maya Safitri", service: "Dokter Umum", doctor: "Dr. Budi Santoso", date: "08 Jul 2026", status: "Terkonfirmasi" }
];
