"use client";

import { Inter, Chewy } from "next/font/google";
import "./globals.css";
import Topbar from "@/components/Topbar/Topbar";
import Providers from "./providers"; // KROK 1: Importujemy nasz komponent-opakowanie
import CallNotification from "@/components/Call/CallNotification";
import { useEffect } from "react";

const chewy = Chewy({subsets: ["latin"], weight: ["400"]});




export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Cleanup function that runs when component unmounts
    return () => {
        if (process.env.NODE_ENV === 'development') {
            // Give time for cleanup in StrictMode
            setTimeout(() => {
                console.log("StrictMode cleanup completed");
            }, 100);
        }
    };
}, []);
  return (
    <html lang="pl" className="h-full bg-slate-900">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Chewy&family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      {/* POPRAWKA: Usunęliśmy stąd font i gradient, aby były tylko w body */}
      <body className={`${chewy.className} font-chewy bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900`}>
        {/* KROK 2: Owijamy całą aplikację w nasz komponent <Providers>,
            który w środku ma "use client" i <SessionProvider> */}
        <Providers>
          <Topbar />
          {/* Tag <main> jest ważny dla semantyki i SEO */}
          <main>{children}</main> 
          <CallNotification />
        </Providers>
      </body>
    </html>
  );
}
