// app/layout.tsx

import { Metadata } from 'next';
import { Inter, Chewy } from "next/font/google";
import "./globals.css";
import Topbar from "@/components/Topbar/Topbar";
import Providers from "./providers";
import CallNotification from "@/components/Call/CallNotification";

const chewy = Chewy({subsets: ["latin"], weight: ["400"]});

// 👇 TO JEST TWÓJ NOWY OBIEKT SEO!
export const metadata: Metadata = {
  title: {
    default: 'Korki360 - Korepetycje z Matematyki i INF.02', // Domyślny tytuł strony
    template: '%s | Korki360', // Szablon dla podstron (np. "Kontakt | Korki360")
  },
  description: 'Profesjonalne korepetycje z matematyki na każdym poziomie oraz przygotowanie do egzaminu zawodowego INF.02. Pomoc w zadaniach, przygotowanie do matury i egzaminu ósmoklasisty.',
  keywords: ['korepetycje', 'matematyka', 'korki', 'korki360', 'inf.02', 'egzamin inf.02', 'matura z matematyki', 'nauczyciel', 'pomoc w nauce', 'inf02', 'informatyka', 'korepetycje matematyka'],
  authors: [{ name: 'Korki360' }],
  creator: 'Korki360',
};


// W komponencie RootLayout NIE POTRZEBUJESZ JUŻ "use client" ani useEffect
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="h-full bg-slate-900">
      {/* ⛔️ USUŃ CAŁĄ SEKCJĘ <head> STĄD! Next.js doda ją automatycznie z obiektu metadata. */}
      
      <body className={`${chewy.className} font-chewy bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900`}>
        <Providers>
          <Topbar />
          {/* Tag <main> jest ważny dla semantyki i SEO - masz go, super! */}
          <main>{children}</main> 
          <CallNotification />
        </Providers>
      </body>
    </html>
  );
}