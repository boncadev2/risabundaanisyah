"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, sessionCookieName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteUploadedImage, saveUploadedImage } from "@/lib/uploads";
import { hasPermission } from "@/lib/rbac";

async function requireAdmin(permission = null) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "operator"].includes(user.role) || (permission && !hasPermission(user.role, permission))) {
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

export async function changePassword(formData) {
  const user = await requireAdmin("view_security");
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (newPassword.length < 10 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    redirect("/admin?module=keamanan&notice=password_weak");
  }
  if (newPassword !== confirmPassword) redirect("/admin?module=keamanan&notice=password_mismatch");

  const databaseUser = await prisma.user.findUnique({ where: { id: Number(user.id) } });
  if (!databaseUser || !(await bcrypt.compare(currentPassword, databaseUser.password))) {
    redirect("/admin?module=keamanan&notice=password_invalid");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: databaseUser.id },
      data: { password: await bcrypt.hash(newPassword, 12), sessionVersion: { increment: 1 } }
    }),
    prisma.auditLog.create({
      data: { userId: databaseUser.id, userEmail: databaseUser.email, action: "PASSWORD_CHANGED", details: "Password admin diperbarui" }
    })
  ]);

  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName());
  redirect("/login?notice=password_changed");
}

export async function createAdminUser(formData) {
  try {
    const actor = await requireAdmin("manage_users");
    const name = text(formData, "name");
    const email = text(formData, "email").toLowerCase();
    const password = String(formData.get("password") || "");
    const roleSlug = text(formData, "role");

    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !["super_admin", "admin", "operator"].includes(roleSlug)) {
      redirect("/admin?module=pengguna&notice=failed");
    }
    if (password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      redirect("/admin?module=pengguna&notice=password_weak");
    }

    const role = await prisma.role.findUnique({ where: { slug: roleSlug } });
    if (!role) redirect("/admin?module=pengguna&notice=failed");

    const created = await prisma.user.create({
      data: { name, email, password: await bcrypt.hash(password, 12), roleId: role.id, isActive: true }
    });
    await prisma.auditLog.create({
      data: { userId: Number(actor.id), userEmail: actor.email, action: "ADMIN_CREATED", details: `Membuat akun ${created.email} (${roleSlug})` }
    });
    refresh("pengguna", "created");
  } catch (error) {
    logActionError("createAdminUser", "pengguna", error);
  }
}

export async function updateAdminUser(formData) {
  try {
    const actor = await requireAdmin("manage_users");
    const id = number(formData, "id");
    const target = await prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!target) redirect("/admin?module=pengguna&notice=failed");

    const roleSlug = text(formData, "role");
    const requestedActive = bool(formData, "isActive");
    const newPassword = String(formData.get("newPassword") || "");
    if (!["super_admin", "admin", "operator"].includes(roleSlug)) redirect("/admin?module=pengguna&notice=failed");
    if (newPassword && (newPassword.length < 10 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword))) {
      redirect("/admin?module=pengguna&notice=password_weak");
    }
    if (id === Number(actor.id) && (!requestedActive || roleSlug !== actor.role)) {
      redirect("/admin?module=pengguna&notice=self_protected");
    }

    if (target.role.slug === "super_admin" && (!requestedActive || roleSlug !== "super_admin")) {
      const activeSuperAdmins = await prisma.user.count({ where: { isActive: true, role: { slug: "super_admin" } } });
      if (activeSuperAdmins <= 1) redirect("/admin?module=pengguna&notice=last_super_admin");
    }

    const role = await prisma.role.findUnique({ where: { slug: roleSlug } });
    const email = text(formData, "email").toLowerCase();
    await prisma.user.update({
      where: { id },
      data: {
        name: text(formData, "name"),
        email,
        roleId: role.id,
        isActive: requestedActive,
        ...(newPassword ? { password: await bcrypt.hash(newPassword, 12) } : {}),
        sessionVersion: { increment: 1 }
      }
    });
    await prisma.auditLog.create({
      data: {
        userId: Number(actor.id),
        userEmail: actor.email,
        action: newPassword ? "ADMIN_PASSWORD_RESET" : "ADMIN_UPDATED",
        details: newPassword ? `Mengganti password akun ${email}` : `Memperbarui akun ${email} (${roleSlug}, ${requestedActive ? "aktif" : "nonaktif"})`
      }
    });
    refresh("pengguna", "updated");
  } catch (error) {
    logActionError("updateAdminUser", "pengguna", error);
  }
}

export async function createDoctor(formData) {
  try {
    await requireAdmin("manage_content");
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
    await requireAdmin("manage_content");
    const oldPhoto = text(formData, "photo");
    const photo = await saveUploadedImage(formData, "photoFile", oldPhoto);
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
    if (photo !== oldPhoto) await deleteUploadedImage(oldPhoto);
    refresh("dokter", "updated");
  } catch (error) {
    logActionError("updateDoctor", "dokter", error);
  }
}

export async function deleteDoctor(formData) {
  await requireAdmin("manage_content");
  const id = number(formData, "id");
  const doctor = await prisma.doctor.findUnique({ where: { id }, select: { photo: true } });
  await prisma.doctorSchedule.deleteMany({ where: { doctorId: id } });
  await prisma.booking.updateMany({ where: { doctorId: id }, data: { doctorId: null } });
  await prisma.doctor.delete({ where: { id } });
  await deleteUploadedImage(doctor?.photo);
  refresh("dokter", "deleted");
}

export async function createSchedule(formData) {
  await requireAdmin("manage_content");
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
  await requireAdmin("manage_content");
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
  await requireAdmin("manage_content");
  await prisma.doctorSchedule.delete({ where: { id: number(formData, "id") } });
  refresh("jadwal", "deleted");
}

export async function createBooking(formData) {
  await requireAdmin("manage_booking");
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
  await requireAdmin("manage_booking");
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
  await requireAdmin("manage_booking");
  await prisma.booking.delete({ where: { id: number(formData, "id") } });
  refresh("booking", "deleted");
}

export async function createService(formData) {
  try {
    await requireAdmin("manage_content");
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
    await requireAdmin("manage_content");
    const title = text(formData, "title");
    const oldImage = text(formData, "image");
    const image = await saveUploadedImage(formData, "imageFile", oldImage);
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
    if (image !== oldImage) await deleteUploadedImage(oldImage);
    refresh("layanan", "updated");
  } catch (error) {
    logActionError("updateService", "layanan", error);
  }
}

export async function deleteService(formData) {
  await requireAdmin("manage_content");
  const id = number(formData, "id");
  const service = await prisma.service.findUnique({ where: { id }, select: { image: true } });
  await prisma.service.delete({ where: { id } });
  await deleteUploadedImage(service?.image);
  refresh("layanan", "deleted");
}

export async function createArticle(formData) {
  try {
    await requireAdmin("manage_content");
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
    await requireAdmin("manage_content");
    const title = text(formData, "title");
    const status = text(formData, "status", "draft");
    const oldImage = text(formData, "image");
    const image = await saveUploadedImage(formData, "imageFile", oldImage);
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
    if (image !== oldImage) await deleteUploadedImage(oldImage);
    refresh("artikel", "updated");
  } catch (error) {
    logActionError("updateArticle", "artikel", error);
  }
}

export async function deleteArticle(formData) {
  await requireAdmin("manage_content");
  const id = number(formData, "id");
  const article = await prisma.article.findUnique({ where: { id }, select: { image: true } });
  await prisma.article.delete({ where: { id } });
  await deleteUploadedImage(article?.image);
  refresh("artikel", "deleted");
}

export async function createGallery(formData) {
  try {
    await requireAdmin("manage_content");
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
    await requireAdmin("manage_content");
    const oldImage = text(formData, "image");
    const image = await saveUploadedImage(formData, "imageFile", oldImage);
    await prisma.gallery.update({
      where: { id: number(formData, "id") },
      data: {
        title: text(formData, "title"),
        image,
        alt: text(formData, "alt") || null,
        isActive: bool(formData, "isActive")
      }
    });
    if (image !== oldImage) await deleteUploadedImage(oldImage);
    refresh("galeri", "updated");
  } catch (error) {
    logActionError("updateGallery", "galeri", error);
  }
}

export async function deleteGallery(formData) {
  await requireAdmin("manage_content");
  const id = number(formData, "id");
  const gallery = await prisma.gallery.findUnique({ where: { id }, select: { image: true } });
  await prisma.gallery.delete({ where: { id } });
  await deleteUploadedImage(gallery?.image);
  refresh("galeri", "deleted");
}

export async function updateSettings(formData) {
  try {
    await requireAdmin("manage_settings");
    const oldHeroImage = text(formData, "hero_image");
    const heroImage = await saveUploadedImage(formData, "heroImageFile", oldHeroImage);
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

    if (heroImage !== oldHeroImage) await deleteUploadedImage(oldHeroImage);

    refresh("pengaturan", "updated");
  } catch (error) {
    logActionError("updateSettings", "pengaturan", error);
  }
}
