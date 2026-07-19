export const ROLE_PERMISSIONS = {
  super_admin: ["manage_users", "manage_content", "manage_booking", "view_statistics", "manage_settings", "view_security"],
  admin: ["manage_content", "manage_booking", "view_statistics", "view_security"],
  operator: ["manage_booking", "view_security"]
};

export function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

export function canAccessModule(role, module) {
  const permissionByModule = {
    dashboard: null,
    dokter: "manage_content",
    jadwal: "manage_content",
    booking: "manage_booking",
    layanan: "manage_content",
    artikel: "manage_content",
    galeri: "manage_content",
    statistik: "view_statistics",
    keamanan: "view_security",
    pengguna: "manage_users",
    pengaturan: "manage_settings"
  };
  const permission = permissionByModule[module];
  return permission === null || hasPermission(role, permission);
}
