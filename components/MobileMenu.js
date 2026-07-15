"use client";

import Link from "next/link";
import { Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

const menuItems = [
  { label: "Cari Dokter", href: "#dokter" },
  { label: "Layanan Kesehatan", href: "#layanan" },
  { label: "Dokter", href: "#dokter" },
  { label: "Buat Janji", href: "#jadwal" },
  { label: "Artikel", href: "#artikel" },
  { label: "Kontak", href: "#kontak" }
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="mobile-menu">
      <button
        className="mobile-menu-toggle"
        type="button"
        aria-label={isOpen ? "Tutup menu" : "Buka menu"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {isOpen && (
        <div className="mobile-menu-panel">
          <nav aria-label="Menu mobile">
            {menuItems.map((item) => (
              <a href={item.href} key={item.label} onClick={closeMenu}>
                {item.label}
              </a>
            ))}
            <Link href="/admin" className="mobile-admin-link" onClick={closeMenu}>
              <ShieldCheck size={17} /> Admin
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
