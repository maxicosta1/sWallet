import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "sCode Finance OS",
  description: "SaaS interno de finanzas y operaciones para sCode Digital Solutions"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body>{children}</body>
    </html>
  );
}
