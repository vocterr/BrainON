import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "../../../prisma/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name, password } = body;
        if (!email || !name || !password) {
            return new NextResponse('Brakuje wymaganych danych', { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (existingUser) {
            // Jeśli użytkownik istnieje, zwracamy błąd "Conflict"
            return new NextResponse('Użytkownik o tym adresie e-mail już istnieje', { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                hashedPassword
            }
        });

        return NextResponse.json(user, {status: 201});
    }
    catch (error) {
        console.error("BLĄD REJESTRACJI", error);
        return new NextResponse("Wystąpił wewnętrzny błąd serwera", {status: 500});
    }
}