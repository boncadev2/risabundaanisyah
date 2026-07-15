"use client";

import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

export default function AdminConfirmForm({ action, children, className = "", confirmMessage = "Simpan perubahan data ini?", encType = "multipart/form-data", ...props }) {
  const formRef = useRef(null);
  const confirmedRef = useRef(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isConfirmOpen && !isSubmitting) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") setIsConfirmOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isConfirmOpen, isSubmitting]);

  function handleSubmit(event) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      setIsSubmitting(true);
      return;
    }

    event.preventDefault();
    setIsConfirmOpen(true);
  }

  function confirmSubmit() {
    confirmedRef.current = true;
    setIsConfirmOpen(false);
    window.requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  function loadingMessage() {
    const message = confirmMessage.toLowerCase();
    if (message.includes("hapus")) return "Menghapus data...";
    if (message.includes("tambah")) return "Menambahkan data...";
    if (message.includes("logout")) return "Keluar dari admin...";
    return "Menyimpan perubahan...";
  }

  return (
    <>
      <form ref={formRef} action={action} className={className} encType={encType} onSubmit={handleSubmit} {...props}>
        {children}
      </form>

      {isMounted && isConfirmOpen ? createPortal(
        <div className="admin-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title" onMouseDown={() => setIsConfirmOpen(false)}>
          <div className="admin-confirm-card" onMouseDown={(event) => event.stopPropagation()}>
            <button className="admin-confirm-close" type="button" aria-label="Tutup konfirmasi" onClick={() => setIsConfirmOpen(false)}>
              <X size={18} />
            </button>
            <div className="admin-confirm-icon">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 id="admin-confirm-title">Konfirmasi Aksi</h2>
              <p>{confirmMessage}</p>
            </div>
            <div className="admin-confirm-actions">
              <button className="admin-confirm-cancel" type="button" onClick={() => setIsConfirmOpen(false)}>
                Batal
              </button>
              <button className="admin-confirm-submit" type="button" onClick={confirmSubmit}>
                <CheckCircle2 size={17} /> Ya, lanjutkan
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}

      {isMounted && isSubmitting ? createPortal(
        <div className="admin-loading-overlay" role="status" aria-live="polite">
          <div className="admin-loading-card">
            <i />
            <strong>{loadingMessage()}</strong>
            <span>Mohon tunggu sebentar.</span>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
