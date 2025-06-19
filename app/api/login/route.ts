import NextAuth, { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import prisma from "@/prisma/prisma";

// Definiujemy opcje konfiguracji dla Next-Auth
export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),

    providers: [
        // 1. Dostawca Google (OAuth)
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),

        // 2. Dostawca logowania przez email/hasło
        // Ta sekcja w pełni zastępuje potrzebę tworzenia własnego API do logowania.
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

                // Jeśli wszystko się zgadza, Next-Auth automatycznie stworzy sesję dla tego użytkownika.
                return user;
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
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role;
            }
            return session;
        },
    },
};

// Tworzymy i eksportujemy handler Next-Auth.
// Usunęliśmy stąd Twoją niestandardową funkcję POST.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
