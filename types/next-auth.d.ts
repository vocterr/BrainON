// types/next-auth.d.ts
import NextAuth, { DefaultSession, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string; // Dodajemy pole 'id'
      role?: string | null;
      hasUsedFreeLesson?: boolean
    } & DefaultSession['user'];
  }
  interface User {
      role?: string | null;
  }
}
declare module 'next-auth/jwt' {
  interface JWT {
    id: string; // Dodajemy pole 'id'
    role?: string | null;
  }
}