"use client";

import { HeartPulse, MapPin, Search, Stethoscope } from "lucide-react";
import { useState } from "react";

const tabs = ["Semua", "Dokter", "Layanan"];

export default function HeroSearchPanel() {
  const [activeTab, setActiveTab] = useState("Semua");
  const [query, setQuery] = useState("");

  function submitSearch(event) {
    event.preventDefault();

    if (activeTab === "Layanan") {
      document.getElementById("layanan")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    window.dispatchEvent(new CustomEvent("doctor-search", {
      detail: { query: query.trim() }
    }));
    document.getElementById("dokter")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <div className="finder-tabs">
        {tabs.map((tab) => (
          <button
            type="button"
            className={tab === activeTab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
            key={tab}
          >
            {tab}
          </button>
        ))}
      </div>
      <form className="hero-search" onSubmit={submitSearch}>
        <Search size={20} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari dokter, layanan, atau jadwal praktik"
        />
        <button type="submit">Cari</button>
      </form>
      <div className="hero-panel-actions">
        <a href="#dokter"><Stethoscope size={19} /> Cari Dokter</a>
        <a href="#layanan"><HeartPulse size={19} /> Layanan Unggulan</a>
        <a href="#kontak"><MapPin size={19} /> Lokasi RS</a>
      </div>
    </>
  );
}
