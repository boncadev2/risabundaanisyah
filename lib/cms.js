import { articles as demoArticles, bookings as demoBookings, doctors as demoDoctors, services as demoServices } from "@/lib/data";
import { imageUrl } from "@/lib/images";

const defaultSettings = {
  site_name: "RSIA Bunda Annisyah",
  site_tagline: "Mother & Child Hospital",
  phone: "(0761) 123456",
  whatsapp: "+62 811-8951-181",
  address: "Jl. HR. Soebrantas, Pekanbaru",
  hero_eyebrow: "Pelayanan ibu dan anak terpercaya",
  hero_title: "Kesehatan bunda dan buah hati, kami dampingi dengan hati.",
  hero_description: "Website Next.js ini siap dibuat dinamis dengan database MySQL untuk dokter, jadwal, booking, layanan, artikel, galeri, user, dan role akses.",
  hero_image: "/uploads/hero-rsia-bunda-annisyah.png",
  maps_embed_url: "",
  facebook_url: "https://facebook.com/rsiabundaanisyah",
  instagram_url: "https://instagram.com/rsiabundaanisyah",
  youtube_url: "https://youtube.com/@rsiabundaanisyah"
};

function mapSettings(rows = []) {
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, { ...defaultSettings });
}

export async function getPublicData() {
  if (process.env.USE_PRISMA !== "true") {
    return {
      services: demoServices,
      doctors: demoDoctors,
      articles: demoArticles.map((article, index) => ({
        ...article,
        slug: `artikel-${index + 1}`
      })),
      galleries: [],
      settings: defaultSettings
    };
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const [services, doctors, articles, galleries, settings] = await Promise.all([
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { id: "asc" }
      }),
      prisma.doctor.findMany({
        where: { isActive: true },
        include: { schedules: { where: { isActive: true }, orderBy: { id: "asc" } } },
        orderBy: { id: "asc" }
      }),
      prisma.article.findMany({
        where: { status: "publish" },
        orderBy: { publishedAt: "desc" },
        take: 3
      }),
      prisma.gallery.findMany({
        where: { isActive: true },
        orderBy: { id: "desc" },
        take: 6
      }),
      prisma.siteSetting.findMany({ orderBy: { id: "asc" } })
    ]);

    return {
      settings: mapSettings(settings),
      services: services.map((service) => ({
        title: service.title,
        description: service.description,
        icon: service.icon || "lab"
      })),
      doctors: doctors.map((doctor) => {
        const schedules = doctor.schedules.map((schedule) => ({
          day: schedule.day,
          time: `${schedule.startTime} - ${schedule.endTime}`,
          quota: schedule.quota,
          status: schedule.quota > 0 ? "Tersedia" : "Penuh"
        }));
        const firstSchedule = schedules[0];

        return {
          name: doctor.name,
          specialty: doctor.specialty,
          bio: doctor.bio || "Dokter RSIA Bunda Annisyah yang siap membantu konsultasi dan pemeriksaan sesuai kebutuhan pasien.",
          schedules,
          schedule: firstSchedule?.day || "Belum diatur",
          time: firstSchedule?.time || "-",
          status: schedules.some((schedule) => schedule.quota > 0) ? "Tersedia" : "Penuh",
          image: imageUrl(doctor.photo, "https://randomuser.me/api/portraits/lego/1.jpg")
        };
      }),
      articles: articles.map((article) => ({
        title: article.title,
        slug: article.slug,
        category: article.category,
        description: article.excerpt,
        image: imageUrl(article.image, "https://images.unsplash.com/photo-1580281658629-0d1f2c6b0f78?auto=format&fit=crop&w=900&q=80")
      })),
      galleries: galleries.map((gallery) => ({
        title: gallery.title,
        image: imageUrl(gallery.image),
        alt: gallery.alt || gallery.title
      }))
    };
  } catch (error) {
    console.error("Failed to load public data from Prisma", error);
    return {
      services: demoServices,
      doctors: demoDoctors,
      articles: demoArticles.map((article, index) => ({
        ...article,
        slug: `artikel-${index + 1}`
      })),
      galleries: [],
      settings: defaultSettings
    };
  }
}

export async function getArticlePageData() {
  if (process.env.USE_PRISMA !== "true") {
    return {
      articles: demoArticles.map((article, index) => ({
        ...article,
        slug: `artikel-${index + 1}`
      })),
      settings: defaultSettings
    };
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const [articles, settings] = await Promise.all([
      prisma.article.findMany({
        where: { status: "publish" },
        orderBy: { publishedAt: "desc" }
      }),
      prisma.siteSetting.findMany({ orderBy: { id: "asc" } })
    ]);

    return {
      settings: mapSettings(settings),
      articles: articles.map((article) => ({
        title: article.title,
        slug: article.slug,
        category: article.category,
        description: article.excerpt,
        content: article.content,
        image: imageUrl(article.image, "https://images.unsplash.com/photo-1580281658629-0d1f2c6b0f78?auto=format&fit=crop&w=900&q=80")
      }))
    };
  } catch (error) {
    console.error("Failed to load article page data from Prisma", error);
    return {
      articles: demoArticles.map((article, index) => ({
        ...article,
        slug: `artikel-${index + 1}`
      })),
      settings: defaultSettings
    };
  }
}

export async function getArticleDetail(slug) {
  if (process.env.USE_PRISMA !== "true") {
    const articles = demoArticles.map((article, index) => ({
      ...article,
      slug: `artikel-${index + 1}`,
      content: article.description
    }));

    return {
      article: articles.find((article) => article.slug === slug) || null,
      settings: defaultSettings
    };
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const [article, settings] = await Promise.all([
      prisma.article.findFirst({
        where: {
          slug,
          status: "publish"
        }
      }),
      prisma.siteSetting.findMany({ orderBy: { id: "asc" } })
    ]);

    return {
      settings: mapSettings(settings),
      article: article
        ? {
            title: article.title,
            slug: article.slug,
            category: article.category,
            description: article.excerpt,
            content: article.content,
            image: imageUrl(article.image, "https://images.unsplash.com/photo-1580281658629-0d1f2c6b0f78?auto=format&fit=crop&w=1200&q=80")
          }
        : null
    };
  } catch (error) {
    console.error("Failed to load article detail from Prisma", error);
    return {
      article: null,
      settings: defaultSettings
    };
  }
}

export async function getGalleryPageData() {
  if (process.env.USE_PRISMA !== "true") {
    return {
      galleries: [],
      settings: defaultSettings
    };
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const [galleries, settings] = await Promise.all([
      prisma.gallery.findMany({
        where: { isActive: true },
        orderBy: { id: "desc" }
      }),
      prisma.siteSetting.findMany({ orderBy: { id: "asc" } })
    ]);

    return {
      settings: mapSettings(settings),
      galleries: galleries.map((gallery) => ({
        title: gallery.title,
        image: imageUrl(gallery.image),
        alt: gallery.alt || gallery.title
      }))
    };
  } catch (error) {
    console.error("Failed to load gallery page data from Prisma", error);
    return {
      galleries: [],
      settings: defaultSettings
    };
  }
}

export async function getAdminData() {
  if (process.env.USE_PRISMA !== "true") {
    return {
      services: demoServices,
      doctors: demoDoctors,
      articles: demoArticles,
      bookings: demoBookings,
      schedules: [],
      galleries: [],
      settings: defaultSettings,
      settingRows: []
    };
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const [services, doctors, articles, bookings, schedules, galleries, settingRows] = await Promise.all([
      prisma.service.findMany({ orderBy: { id: "asc" } }),
      prisma.doctor.findMany({ orderBy: { id: "asc" } }),
      prisma.article.findMany({ orderBy: { id: "desc" } }),
      prisma.booking.findMany({
        include: { doctor: true },
        orderBy: { id: "desc" }
      }),
      prisma.doctorSchedule.findMany({
        include: { doctor: true },
        orderBy: { id: "asc" }
      }),
      prisma.gallery.findMany({ orderBy: { id: "desc" } }),
      prisma.siteSetting.findMany({ orderBy: [{ group: "asc" }, { id: "asc" }] })
    ]);

    return {
      settings: mapSettings(settingRows),
      settingRows,
      services: services.map((service) => ({
        id: service.id,
        title: service.title,
        slug: service.slug,
        description: service.description,
        icon: service.icon || "lab",
        image: imageUrl(service.image),
        imageFile: service.image || "",
        isFeatured: service.isFeatured,
        isActive: service.isActive
      })),
      doctors: doctors.map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty,
        bio: doctor.bio || "",
        status: doctor.isActive ? "Tersedia" : "Penuh",
        image: imageUrl(doctor.photo, "https://randomuser.me/api/portraits/lego/1.jpg"),
        photo: doctor.photo || "",
        isActive: doctor.isActive
      })),
      articles: articles.map((article) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        category: article.category,
        description: article.excerpt,
        excerpt: article.excerpt,
        content: article.content,
        status: article.status,
        image: imageUrl(article.image, "https://images.unsplash.com/photo-1580281658629-0d1f2c6b0f78?auto=format&fit=crop&w=900&q=80"),
        imageFile: article.image || ""
      })),
      bookings: bookings.map((booking) => ({
        id: booking.id,
        code: booking.code,
        patient: booking.patientName,
        phone: booking.phone,
        service: booking.service,
        doctorId: booking.doctorId || "",
        doctor: booking.doctor?.name || "-",
        bookingDateInput: booking.bookingDate.toISOString().slice(0, 16),
        date: booking.bookingDate.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }),
        status: booking.status === "menunggu" ? "Menunggu" : "Terkonfirmasi",
        rawStatus: booking.status,
        notes: booking.notes || ""
      })),
      schedules: schedules.map((schedule) => ({
        id: schedule.id,
        doctorId: schedule.doctorId,
        doctor: schedule.doctor?.name || "-",
        specialty: schedule.doctor?.specialty || "-",
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        time: `${schedule.startTime} - ${schedule.endTime}`,
        quota: schedule.quota,
        status: schedule.isActive ? "Aktif" : "Nonaktif",
        isActive: schedule.isActive
      })),
      galleries: galleries.map((gallery) => ({
        id: gallery.id,
        title: gallery.title,
        image: imageUrl(gallery.image),
        imageFile: gallery.image,
        alt: gallery.alt || gallery.title,
        status: gallery.isActive ? "Aktif" : "Nonaktif",
        isActive: gallery.isActive
      }))
    };
  } catch (error) {
    console.error("Failed to load admin data from Prisma", error);
    return {
      services: demoServices,
      doctors: demoDoctors,
      articles: demoArticles,
      bookings: demoBookings,
      schedules: [],
      galleries: [],
      settings: defaultSettings,
      settingRows: []
    };
  }
}

export async function getVisitorStats(filters = {}) {
  const empty = { totalViews: 0, uniqueVisitors: 0, todayViews: 0, topPages: [], daily: [], devices: [], sources: [], monthly: [], recentVisits: [], from: "", to: "" };
  if (process.env.USE_PRISMA !== "true") return empty;

  try {
    const { prisma } = await import("@/lib/prisma");
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const defaultFrom = new Date(today);
    defaultFrom.setDate(defaultFrom.getDate() - 29);
    const from = parseAnalyticsDate(filters.from, defaultFrom);
    const toDay = parseAnalyticsDate(filters.to, today);
    const to = new Date(toDay);
    to.setHours(23, 59, 59, 999);
    const where = { createdAt: { gte: from, lte: to } };
    const monthStart = new Date(today.getFullYear(), today.getMonth() - 11, 1);

    const [events, todayViews, monthlyEvents] = await Promise.all([
      prisma.visitorEvent.findMany({ where, select: { visitorId: true, path: true, referrer: true, userAgent: true, ipAddress: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
      prisma.visitorEvent.count({ where: { createdAt: { gte: today } } }),
      prisma.visitorEvent.findMany({ where: { createdAt: { gte: monthStart } }, select: { createdAt: true } })
    ]);

    const dayCount = Math.min(Math.max(Math.floor((toDay - from) / 86400000) + 1, 1), 31);
    const chartStart = new Date(toDay);
    chartStart.setDate(chartStart.getDate() - dayCount + 1);
    const daily = Array.from({ length: dayCount }, (_, index) => {
      const date = new Date(chartStart);
      date.setDate(chartStart.getDate() + index);
      const key = localDateKey(date);
      return {
        key,
        label: date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        views: events.filter((event) => localDateKey(event.createdAt) === key).length
      };
    });

    const countBy = (values) => values.reduce((result, value) => result.set(value, (result.get(value) || 0) + 1), new Map());
    const topPages = [...countBy(events.map((event) => event.path)).entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([path, views]) => ({ path, views }));
    const devices = [...countBy(events.map((event) => deviceName(event.userAgent))).entries()].sort((a, b) => b[1] - a[1]).map(([name, views]) => ({ name, views }));
    const sources = [...countBy(events.map((event) => sourceName(event.referrer))).entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, views]) => ({ name, views }));
    const monthly = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - 11 + index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return { key, label: date.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }), views: monthlyEvents.filter((event) => localDateKey(event.createdAt).startsWith(key)).length };
    });

    return {
      totalViews: events.length,
      uniqueVisitors: new Set(events.map((event) => event.visitorId)).size,
      todayViews,
      topPages,
      daily,
      devices,
      sources,
      monthly,
      recentVisits: events.slice(0, 100).map((event) => ({
        id: `${event.visitorId}-${event.createdAt.getTime()}`,
        date: event.createdAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }),
        ipAddress: event.ipAddress || "-",
        path: event.path,
        device: deviceName(event.userAgent),
        os: osName(event.userAgent),
        browser: browserName(event.userAgent)
      })),
      from: localDateKey(from),
      to: localDateKey(toDay)
    };
  } catch (error) {
    console.error("Failed to load visitor statistics", error);
    return empty;
  }
}

function parseAnalyticsDate(value, fallback) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return new Date(fallback);
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date(fallback) : date;
}

function localDateKey(date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function deviceName(userAgent = "") {
  if (/ipad|tablet|playbook|silk/i.test(userAgent)) return "Tablet";
  if (/mobile|iphone|ipod|android/i.test(userAgent)) return "HP";
  return "Desktop";
}

function osName(userAgent = "") {
  if (/windows nt 10/i.test(userAgent)) return "Windows";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS/iPadOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/mac os x|macintosh/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Lainnya";
}

function browserName(userAgent = "") {
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/opr\//i.test(userAgent)) return "Opera";
  if (/chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)) return "Chrome";
  if (/firefox\//i.test(userAgent)) return "Firefox";
  if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) return "Safari";
  return "Lainnya";
}

function sourceName(referrer = "") {
  if (!referrer) return "Langsung";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (/google\./i.test(host)) return "Google";
    if (/facebook|instagram|t\.co|twitter|youtube|whatsapp/i.test(host)) return host;
    return host || "Lainnya";
  } catch {
    return "Lainnya";
  }
}

export async function getSecurityData() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const [auditLogs, failedToday] = await Promise.all([
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
      prisma.loginAttempt.count({
        where: { success: false, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
      })
    ]);

    return {
      failedToday,
      auditLogs: auditLogs.map((log) => ({
        id: log.id,
        email: log.userEmail || "Tidak dikenal",
        action: log.action,
        details: log.details || "-",
        ipAddress: log.ipAddress || "-",
        date: log.createdAt.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
      }))
    };
  } catch (error) {
    console.error("Failed to load security data", error);
    return { failedToday: 0, auditLogs: [] };
  }
}

export async function getAdminUsersData() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const [users, roles, loginAttempts] = await Promise.all([
      prisma.user.findMany({ include: { role: true }, orderBy: { id: "asc" } }),
      prisma.role.findMany({ where: { slug: { in: ["super_admin", "admin", "operator"] } }, orderBy: { id: "asc" } }),
      prisma.loginAttempt.findMany({ orderBy: { createdAt: "desc" }, take: 50 })
    ]);

    return {
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.slug,
        roleName: user.role.name,
        isActive: user.isActive,
        status: user.isActive ? "Aktif" : "Nonaktif",
        createdAt: user.createdAt.toLocaleDateString("id-ID", { dateStyle: "medium" })
      })),
      roles: roles.map((role) => ({ slug: role.slug, name: role.name })),
      loginAttempts: loginAttempts.map((attempt) => ({
        id: attempt.id,
        email: attempt.email,
        ipAddress: attempt.ipAddress,
        success: attempt.success,
        reason: attempt.reason,
        date: attempt.createdAt.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
      }))
    };
  } catch (error) {
    console.error("Failed to load admin users", error);
    return { users: [], roles: [], loginAttempts: [] };
  }
}
