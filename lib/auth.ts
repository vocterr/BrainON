// auth.ts
import { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import prisma from "@/prisma/prisma";

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'email', type: 'text' },
                password: { label: 'password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Nieprawidłowe dane logowania');
                }
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });
                if (!user || !user.hashedPassword) {
                    throw new Error('Nieprawidłowe dane logowania');
                }
                const isCorrectPassword = await bcrypt.compare(
                    credentials.password,
                    user.hashedPassword
                );
                if (!isCorrectPassword) {
                    throw new Error('Nieprawidłowe dane logowania');
                }
                // WAŻNE: Zwracany obiekt 'user' z authorize powinien zawierać ID
                // NextAuth.js automatycznie przekazuje go do JWT callback
                return user; // Prisma user model powinien mieć id, role, hasUsedFreeLesson
            }
        })
    ],
    debug: process.env.NODE_ENV === 'development',
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async jwt({ token, user }) {
            // 'user' jest dostępne tylko przy pierwszym logowaniu lub przy odświeżeniu sesji
            // i pochodzi z authorize() lub adaptera.
            if (user) {
                token.id = user.id;
                // Upewnij się, że 'user.role' jest bezpiecznie przypisywane, np. z kontrolą istnienia
                token.role = (user as any).role || null; // Rzutowanie na 'any' tymczasowo, jeśli 'user' nie ma 'role' w domyślnych typach NextAuth
                token.hasUsedFreeLesson = (user as any).hasUsedFreeLesson || false; // Podobnie dla hasUsedFreeLesson
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                // 'token.role' powinno być już string | null dzięki JWT type
                session.user.role = token.role;

                // === KLUCZOWE: POBIERANIE hasUsedFreeLesson Z BAZY DANYCH ===
                // To jest najważniejsza zmiana dla aktualizacji UI
                if (token.id) { // Upewnij się, że token.id istnieje
                    try {
                        const userInDb = await prisma.user.findUnique({
                            where: { id: token.id as string },
                            select: { hasUsedFreeLesson: true } // Wybierz tylko to pole
                        });
                        // Przypisz wartość z bazy danych do sesji.
                        // Jeśli userInDb?.hasUsedFreeLesson jest null/undefined, ustaw na false.
                        session.user.hasUsedFreeLesson = userInDb?.hasUsedFreeLesson || false;
                    } catch (error) {
                        console.error("Błąd podczas pobierania hasUsedFreeLesson:", error);
                        // Możesz zdecydować, co zrobić w przypadku błędu, np. pozostawić domyślną wartość
                        session.user.hasUsedFreeLesson = false; // Domyślna wartość w przypadku błędu
                    }
                } else {
                    session.user.hasUsedFreeLesson = false; // Domyślna wartość jeśli brak ID w tokenie
                }
                // ============================================================
            }
            return session;
        },
    },
};