// app/api/auth/[...nextauth]/route.ts

import NextAuth, { AuthOptions } from "next-auth";
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
                return user;
            }
        })
    ],
    debug: process.env.NODE_ENV === 'development',
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,

    // ===== KLUCZOWA POPRAWKA JEST TUTAJ =====
    callbacks: {
        // Ten callback jest wywoływany przy tworzeniu tokenu JWT
        async jwt({ token, user }) {
            // Przy pierwszym logowaniu (gdy obiekt 'user' jest dostępny),
            // dodajemy ID i ROLĘ do tokena.
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        // Ten callback jest wywoływany przy tworzeniu obiektu sesji
        async session({ session, token }) {
            // Przekazujemy dane z tokena (który ma już ID i rolę)
            // do obiektu sesji, który jest dostępny po stronie klienta.
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string | null;
            }
            return session;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
