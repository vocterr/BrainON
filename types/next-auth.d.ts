// types/next-auth.d.ts
import { DefaultSession } from 'next-auth'; // Wystarczy DefaultSession
import { JWT as NextAuthJWT } from 'next-auth/jwt'; // Alias, aby uniknąć konfliktu z globalnym JWT

declare module 'next-auth' {
  // Rozszerzamy wbudowany interfejs 'User'.
  // Dodajemy tutaj wszystkie niestandardowe pola, które posiada Twój model User,
  // włączając 'hasUsedFreeLesson' jako opcjonalne.
  interface User {
    id: string; // ID użytkownika (zakładamy, że zawsze jest stringiem po zalogowaniu)
    role?: string | null; // Rola, może być stringiem, nullem lub undefined
    hasUsedFreeLesson?: boolean; // WAŻNE: Dodaj jako OPCJONALNE boolean
  }

  // Rozszerzamy typ 'Session', aby jego właściwość 'user' używała naszego rozszerzonego typu 'User'.
  interface Session extends DefaultSession {
    user?: User; // Zmieniamy typ 'user' na nasz rozszerzony 'User'
  }
}

declare module 'next-auth/jwt' {
  // Rozszerzamy wbudowany interfejs 'JWT'.
  // Dodajemy tutaj wszystkie niestandardowe pola, które są przechowywane w tokenie JWT.
  interface JWT extends NextAuthJWT {
    id: string; // ID użytkownika w tokenie
    role?: string | null; // Rola w tokenie
    hasUsedFreeLesson?: boolean; // WAŻNE: Dodaj jako OPCJONALNE boolean w JWT
  }
}