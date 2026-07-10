import "./globals.css";

export const metadata = {
  title: "RSIA Bunda Annisyah",
  description: "Website dan admin panel RSIA Bunda Annisyah berbasis Next.js"
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
