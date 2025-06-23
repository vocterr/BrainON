"use client";

import { SessionProvider } from "next-auth/react";

// Ten komponent opakowuje naszą aplikację w dostawcę sesji
// od strony klienta, co jest niezbędne do działania hooka useSession.
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
