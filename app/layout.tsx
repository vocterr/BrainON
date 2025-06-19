"use client";

import "./globals.css";
import { Chewy } from "next/font/google"
import Topbar from "@/components/Topbar/Topbar";
import { SessionProvider } from "next-auth/react";
import CallNotification from "@/components/Call/CallNotification";

const chewy = Chewy({ subsets: ['latin'], weight: ['400'], variable: '--font-chewy' });


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full  font-chewy bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <SessionProvider>
      <body
        className={` ${chewy.variable} antialiased`}
      >
        <Topbar/>
        {children}
        <CallNotification/>
      </body>
      </SessionProvider>
    </html>
  );
}
