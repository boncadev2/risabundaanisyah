# RSIA Bunda Annisyah Next.js

Versi Next.js untuk website publik dan admin panel RSIA Bunda Annisyah.

## Jalankan Demo

```bash
npm install
npm run dev
```

Buka:

- Website: `http://localhost:3000`
- Login admin: `http://localhost:3000/login`
- Admin panel: `http://localhost:3000/admin`

Akun demo:

- Email: `admin@rsia.test`
- Password: `password`

## Mode Database MySQL

1. Buat database MySQL: `rsia_bunda_annisyah`
2. Copy `.env.example` menjadi `.env`
3. Ubah `DATABASE_URL`, `JWT_SECRET`, dan set `USE_PRISMA="true"`
4. Install Prisma dan adapter MySQL/MariaDB:

```bash
npm install prisma @prisma/client @prisma/adapter-mariadb
npm run prisma:migrate
npm run prisma:seed
```

Schema database ada di `prisma/schema.prisma`.

Catatan: proyek ini memakai Prisma v7, jadi koneksi MySQL aplikasi dibuat melalui
`@prisma/adapter-mariadb` di `lib/prisma.js`.

## Modul Admin

Admin panel sudah memakai server actions untuk CRUD:

- Dokter
- Jadwal
- Booking
- Layanan
- Artikel
- Galeri
- Pengaturan website
