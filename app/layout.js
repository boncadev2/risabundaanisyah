import "./globals.css";
import VisitorTracker from "@/components/VisitorTracker";

export const metadata = {
  title: "RSIA Bunda Annisyah",
  description: "Website dan admin panel RSIA Bunda Annisyah berbasis Next.js",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/logo.png"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <VisitorTracker />
        {children}
      </body>
    </html>
  );
}
