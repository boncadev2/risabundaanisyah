"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedImage } from "@/lib/uploads";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "operator"].includes(user.role)) {
    redirect("/login");
  }
  return user;
}

function text(formData, key, fallback = "") {
  return String(formData.get(key) || fallback).trim();
}

function bool(formData, key) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function number(formData, key, fallback = 0) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function refresh(module, notice = "saved") {
  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/admin?module=${module}&notice=${notice}`);
}

function isRedirectError(error) {
  return typeof error?.digest === "string" && error.digest.startsWith("NEXT_REDIRECT");
}

function logActionError(action, module, error) {
  if (isRedirectError(error)) throw error;
  console.error(`Admin action failed: ${action}`, error);
  redirect(`/admin?module=${module}&notice=failed`);
}

export async function createDoctor(formData) {
  try {
    await requireAdmin();
    const photo = await saveUploadedImage(formData, "photoFile");
    await prisma.doctor.create({
      data: {
        name: text(formData, "name"),
        specialty: text(formData, "specialty"),
        photo,
        bio: text(formData, "bio") || null,
        isActive: bool(formData, "isActive")
      }
    });
    refresh("dokter", "created");
  } catch (error) {
    logActionError("createDoctor", "dokter", error);
  }
}

export async function updateDoctor(formData) {
  try {
    await requireAdmin();
    const photo = await saveUploadedImage(formData, "photoFile", text(formData, "photo"));
    await prisma.doctor.update({
      where: { id: number(formData, "id") },
      data: {
        name: text(formData, "name"),
        specialty: text(formData, "specialty"),
        photo,
        bio: text(formData, "bio") || null,
        isActive: bool(formData, "isActive")
      }
    });
    refresh("dokter", "updated");
  } catch (error) {
    logActionError("updateDoctor", "dokter", error);
  }
}

export async function deleteDoctor(formData) {
  await requireAdmin();
  const id = number(formData, "id");
  await prisma.doctorSchedule.deleteMany({ where: { doctorId: id } });
  await prisma.booking.updateMany({ where: { doctorId: id }, data: { doctorId: null } });
  await prisma.doctor.delete({ where: { id } });
  refresh("dokter", "deleted");
}

export async function createSchedule(formData) {
  await requireAdmin();
  await prisma.doctorSchedule.create({
    data: {
      doctorId: number(formData, "doctorId"),
      day: text(formData, "day"),
      startTime: text(formData, "startTime"),
      endTime: text(formData, "endTime"),
      quota: number(formData, "quota", 20),
      isActive: bool(formData, "isActive")
    }
  });
  refresh("jadwal", "created");
}

export async function updateSchedule(formData) {
  await requireAdmin();
  await prisma.doctorSchedule.update({
    where: { id: number(formData, "id") },
    data: {
      doctorId: number(formData, "doctorId"),
      day: text(formData, "day"),
      startTime: text(formData, "startTime"),
      endTime: text(formData, "endTime"),
      quota: number(formData, "quota", 20),
      isActive: bool(formData, "isActive")
    }
  });
  refresh("jadwal", "updated");
}

export async function deleteSchedule(formData) {
  await requireAdmin();
  await prisma.doctorSchedule.delete({ where: { id: number(formData, "id") } });
  refresh("jadwal", "deleted");
}

export async function createBooking(formData) {
  await requireAdmin();
  const doctorId = number(formData, "doctorId") || null;
  await prisma.booking.create({
    data: {
      code: text(formData, "code", `BK-${Date.now()}`),
      patientName: text(formData, "patientName"),
      phone: text(formData, "phone"),
      service: text(formData, "service"),
      doctorId,
      bookingDate: new Date(text(formData, "bookingDate")),
      status: text(formData, "status", "menunggu"),
      notes: text(formData, "notes") || null
    }
  });
  refresh("booking", "created");
}

export async function updateBooking(formData) {
  await requireAdmin();
  const doctorId = number(formData, "doctorId") || null;
  await prisma.booking.update({
    where: { id: number(formData, "id") },
    data: {
      code: text(formData, "code"),
      patientName: text(formData, "patientName"),
      phone: text(formData, "phone"),
      service: text(formData, "service"),
      doctorId,
      bookingDate: new Date(text(formData, "bookingDate")),
      status: text(formData, "status", "menunggu"),
      notes: text(formData, "notes") || null
    }
  });
  refresh("booking", "updated");
}

export async function deleteBooking(formData) {
  await requireAdmin();
  await prisma.booking.delete({ where: { id: number(formData, "id") } });
  refresh("booking", "deleted");
}

export async function createService(formData) {
  try {
    await requireAdmin();
    const title = text(formData, "title");
    const image = await saveUploadedImage(formData, "imageFile");
    await prisma.service.create({
      data: {
        title,
        slug: text(formData, "slug") || slugify(title),
        description: text(formData, "description"),
        icon: text(formData, "icon") || null,
        image,
        isFeatured: bool(formData, "isFeatured"),
        isActive: bool(formData, "isActive")
      }
    });
    refresh("layanan", "created");
  } catch (error) {
    logActionError("createService", "layanan", error);
  }
}

export async function updateService(formData) {
  try {
    await requireAdmin();
    const title = text(formData, "title");
    const image = await saveUploadedImage(formData, "imageFile", text(formData, "image"));
    await prisma.service.update({
      where: { id: number(formData, "id") },
      data: {
        title,
        slug: text(formData, "slug") || slugify(title),
        description: text(formData, "description"),
        icon: text(formData, "icon") || null,
        image,
        isFeatured: bool(formData, "isFeatured"),
        isActive: bool(formData, "isActive")
      }
    });
    refresh("layanan", "updated");
  } catch (error) {
    logActionError("updateService", "layanan", error);
  }
}

export async function deleteService(formData) {
  await requireAdmin();
  await prisma.service.delete({ where: { id: number(formData, "id") } });
  refresh("layanan", "deleted");
}

export async function createArticle(formData) {
  try {
    await requireAdmin();
    const title = text(formData, "title");
    const status = text(formData, "status", "draft");
    const image = await saveUploadedImage(formData, "imageFile");
    await prisma.article.create({
      data: {
        title,
        slug: text(formData, "slug") || slugify(title),
        category: text(formData, "category"),
        excerpt: text(formData, "excerpt"),
        content: text(formData, "content"),
        image,
        status,
        publishedAt: status === "publish" ? new Date() : null
      }
    });
    refresh("artikel", "created");
  } catch (error) {
    logActionError("createArticle", "artikel", error);
  }
}

export async function updateArticle(formData) {
  try {
    await requireAdmin();
    const title = text(formData, "title");
    const status = text(formData, "status", "draft");
    const image = await saveUploadedImage(formData, "imageFile", text(formData, "image"));
    await prisma.article.update({
      where: { id: number(formData, "id") },
      data: {
        title,
        slug: text(formData, "slug") || slugify(title),
        category: text(formData, "category"),
        excerpt: text(formData, "excerpt"),
        content: text(formData, "content"),
        image,
        status,
        publishedAt: status === "publish" ? new Date() : null
      }
    });
    refresh("artikel", "updated");
  } catch (error) {
    logActionError("updateArticle", "artikel", error);
  }
}

export async function deleteArticle(formData) {
  await requireAdmin();
  await prisma.article.delete({ where: { id: number(formData, "id") } });
  refresh("artikel", "deleted");
}

export async function createGallery(formData) {
  try {
    await requireAdmin();
    const image = await saveUploadedImage(formData, "imageFile");
    if (!image) {
      throw new Error("Foto galeri wajib diupload.");
    }
    await prisma.gallery.create({
      data: {
        title: text(formData, "title"),
        image,
        alt: text(formData, "alt") || null,
        isActive: bool(formData, "isActive")
      }
    });
    refresh("galeri", "created");
  } catch (error) {
    logActionError("createGallery", "galeri", error);
  }
}

export async function updateGallery(formData) {
  try {
    await requireAdmin();
    const image = await saveUploadedImage(formData, "imageFile", text(formData, "image"));
    await prisma.gallery.update({
      where: { id: number(formData, "id") },
      data: {
        title: text(formData, "title"),
        image,
        alt: text(formData, "alt") || null,
        isActive: bool(formData, "isActive")
      }
    });
    refresh("galeri", "updated");
  } catch (error) {
    logActionError("updateGallery", "galeri", error);
  }
}

export async function deleteGallery(formData) {
  await requireAdmin();
  await prisma.gallery.delete({ where: { id: number(formData, "id") } });
  refresh("galeri", "deleted");
}

export async function updateSettings(formData) {
  try {
    await requireAdmin();
    const heroImage = await saveUploadedImage(formData, "heroImageFile", text(formData, "hero_image"));
    const settings = [
      { key: "site_name", label: "Nama Website", group: "identity" },
      { key: "site_tagline", label: "Tagline", group: "identity" },
      { key: "phone", label: "Telepon", group: "contact" },
      { key: "whatsapp", label: "WhatsApp", group: "contact" },
      { key: "facebook_url", label: "Facebook URL", group: "social" },
      { key: "instagram_url", label: "Instagram URL", group: "social" },
      { key: "youtube_url", label: "YouTube URL", group: "social" },
      { key: "address", label: "Alamat", group: "contact", type: "textarea" },
      { key: "hero_eyebrow", label: "Hero Eyebrow", group: "homepage" },
      { key: "hero_title", label: "Hero Title", group: "homepage", type: "textarea" },
      { key: "hero_description", label: "Hero Description", group: "homepage", type: "textarea" },
      { key: "hero_image", label: "Hero Image", group: "homepage" },
      { key: "maps_embed_url", label: "Google Maps Embed URL", group: "contact", type: "textarea" }
    ];
    const valueFor = (key) => (key === "hero_image" ? heroImage : text(formData, key));

    await prisma.$transaction(
      settings.map((setting) =>
        prisma.siteSetting.upsert({
          where: { key: setting.key },
          update: { value: valueFor(setting.key) },
          create: {
            key: setting.key,
            label: setting.label,
            value: valueFor(setting.key),
            group: setting.group,
            type: setting.type || "text"
          }
        })
      )
    );

    refresh("pengaturan", "updated");
  } catch (error) {
    logActionError("updateSettings", "pengaturan", error);
  }
}
