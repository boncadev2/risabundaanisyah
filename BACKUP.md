# Backup Database

Backup MySQL dijalankan setiap hari pukul 02.00 melalui `launchd` pada macOS atau `cron` pada Linux. Berkas disimpan sebagai SQL terkompresi di folder `backups/` dan otomatis dihapus setelah 14 hari.

- Jalankan manual: `npm run backup:database`
- Pasang/perbarui jadwal: `npm run backup:install`
- Ubah jadwal dengan environment `BACKUP_CRON`
- Ubah retensi dengan `BACKUP_RETENTION_DAYS`
- Ubah lokasi dengan `BACKUP_DIR`

Simpan salinan backup di lokasi lain secara berkala. Folder lokal yang rusak atau hilang tidak dapat melindungi backup yang berada pada disk yang sama.
