// app/api/auth/[...nextauth]/route.ts

import NextAuth, { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import prisma from "@/prisma/prisma";
import { authOptions } from "@/lib/auth";


const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
