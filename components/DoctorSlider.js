"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Search, SlidersHorizontal, Stethoscope, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function getDoctorSchedules(doctor) {
  if (Array.isArray(doctor.schedules) && doctor.schedules.length) {
    return doctor.schedules;
  }

  return [{
    day: doctor.schedule || "Belum diatur",
    time: doctor.time || "-",
    status: doctor.status || "Penuh"
  }];
}

export default function DoctorSlider({ doctors }) {
  const trackRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("Semua");
  const [activeDoctor, setActiveDoctor] = useState(null);

  const specialties = useMemo(() => {
    return ["Semua", ...Array.from(new Set(doctors.map((doctor) => doctor.specialty)))];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const scheduleText = getDoctorSchedules(doctor)
        .map((schedule) => `${schedule.day} ${schedule.time} ${schedule.status}`)
        .join(" ");
      const haystack = [
        doctor.name,
        doctor.specialty,
        scheduleText,
        doctor.status
      ].join(" ").toLowerCase();

      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesSpecialty = specialty === "Semua" || doctor.specialty === specialty;

      return matchesQuery && matchesSpecialty;
    });
  }, [doctors, query, specialty]);

  function slide(direction) {
    const track = trackRef.current;
    if (!track) return;

    const card = track.querySelector(".doctor-card");
    const step = card ? card.getBoundingClientRect().width + 18 : track.clientWidth;

    const isAtEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;

    if (direction > 0 && isAtEnd) {
      track.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }

    track.scrollBy({
      left: direction * step,
      behavior: "smooth"
    });
  }

  useEffect(() => {
    const loadingTimer = window.setTimeout(() => setIsLoading(false), 650);
    return () => window.clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    if (isLoading || filteredDoctors.length <= 1) return undefined;

    const autoSlide = window.setInterval(() => {
      slide(1);
    }, 3600);

    return () => window.clearInterval(autoSlide);
  }, [isLoading, filteredDoctors.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (track) track.scrollTo({ left: 0, behavior: "smooth" });
  }, [query, specialty]);

  useEffect(() => {
    function handleHeroSearch(event) {
      const nextQuery = event.detail?.query || "";
      setQuery(nextQuery);
      setSpecialty("Semua");
      setIsLoading(false);
    }

    window.addEventListener("doctor-search", handleHeroSearch);
    return () => window.removeEventListener("doctor-search", handleHeroSearch);
  }, []);

  useEffect(() => {
    if (!activeDoctor) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") setActiveDoctor(null);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeDoctor]);

  const hasActiveFilter = query.trim() || specialty !== "Semua";

  return (
    <div className="doctor-finder">
      <div className="doctor-filter-panel">
        <label className="doctor-search-field">
          <Search size={20} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama dokter, spesialis, hari, atau status"
          />
          {query ? (
            <button type="button" aria-label="Hapus pencarian dokter" onClick={() => setQuery("")}>
              <X size={18} />
            </button>
          ) : null}
        </label>

        <div className="doctor-specialty-row" aria-label="Filter spesialis dokter">
          <span><SlidersHorizontal size={17} /> Spesialis</span>
          <div>
            {specialties.map((item) => (
              <button
                type="button"
                className={item === specialty ? "active" : ""}
                onClick={() => setSpecialty(item)}
                key={item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="doctor-result-meta" aria-live="polite">
          <strong>{filteredDoctors.length}</strong> dokter ditemukan
          {hasActiveFilter ? (
            <button type="button" onClick={() => {
              setQuery("");
              setSpecialty("Semua");
            }}>
              Reset
            </button>
          ) : null}
        </div>
      </div>

      <div className="doctor-slider">
        <button className="slider-btn left" type="button" aria-label="Dokter sebelumnya" onClick={() => slide(-1)}>
          <ChevronLeft size={24} />
        </button>

        {isLoading ? (
          <div className="doctor-grid doctor-loading" aria-label="Memuat data dokter">
            {[0, 1, 2].map((item) => (
              <article className="doctor-card doctor-skeleton" key={item}>
                <i />
                <span />
                <h3 />
                <p />
              </article>
            ))}
          </div>
        ) : filteredDoctors.length ? (
          <div className="doctor-grid doctor-ready" ref={trackRef}>
            {filteredDoctors.map((doctor, index) => (
              <article className="doctor-card" style={{ "--index": index }} key={doctor.name}>
                <button className="doctor-photo-btn" type="button" onClick={() => setActiveDoctor(doctor)} aria-label={`Lihat profil ${doctor.name}`}>
                  <img src={doctor.image} alt={doctor.name} />
                </button>
                <span>{doctor.specialty}</span>
                <h3>{doctor.name}</h3>
                <b className={doctor.status === "Tersedia" ? "doctor-status available" : "doctor-status full"}>
                  {doctor.status}
                </b>
                <button className="doctor-profile-cta" type="button" onClick={() => setActiveDoctor(doctor)}>
                  Lihat Jadwal
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="doctor-empty">
            <Search size={30} />
            <h3>Dokter belum ditemukan</h3>
            <p>Coba gunakan nama, spesialis, atau hari praktik lain.</p>
            <button type="button" onClick={() => {
              setQuery("");
              setSpecialty("Semua");
            }}>
              Tampilkan semua dokter
            </button>
          </div>
        )}

        <button className="slider-btn right" type="button" aria-label="Dokter berikutnya" onClick={() => slide(1)}>
          <ChevronRight size={24} />
        </button>
      </div>

      {activeDoctor ? (
        <div className="doctor-modal" role="dialog" aria-modal="true" aria-labelledby="doctor-modal-title" onMouseDown={() => setActiveDoctor(null)}>
          <article className="doctor-modal-card" onMouseDown={(event) => event.stopPropagation()}>
            <button className="doctor-modal-close" type="button" aria-label="Tutup profil dokter" onClick={() => setActiveDoctor(null)}>
              <X size={20} />
            </button>
            <div className="doctor-modal-hero">
              <img src={activeDoctor.image} alt={activeDoctor.name} />
              <div>
                <span><Stethoscope size={17} /> {activeDoctor.specialty}</span>
                <h3 id="doctor-modal-title">{activeDoctor.name}</h3>
                <b className={activeDoctor.status === "Tersedia" ? "doctor-status available" : "doctor-status full"}>
                  {activeDoctor.status}
                </b>
              </div>
            </div>
            <div className="doctor-modal-body">
              <section>
                <h4>Profil Dokter</h4>
                <p>{activeDoctor.bio || "Profil dokter akan segera dilengkapi oleh admin rumah sakit."}</p>
              </section>
              <section>
                <h4>Jadwal Praktik</h4>
                <div className="doctor-modal-schedules">
                  {getDoctorSchedules(activeDoctor).map((schedule) => (
                    <div key={`${schedule.day}-${schedule.time}`}>
                      <CalendarDays size={18} />
                      <span>{schedule.day}</span>
                      <strong>{schedule.time}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <a className="doctor-modal-cta" href="#jadwal" onClick={() => setActiveDoctor(null)}>
              Buat janji temu
            </a>
          </article>
        </div>
      ) : null}
    </div>
  );
}
