// Plik: /api/admin/route.ts
// Ten kod jest już prawidłowy - zwraca notes i contactInfo.

import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
        }

        const appointments = await prisma.appointment.findMany({
            where: {
                OR: [
                    { status: 'UPCOMING', date: { gte: new Date() } },
                    { status: 'COMPLETED', date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
                ],
            },
            orderBy: { date: 'asc' },
            include: {
                student: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return NextResponse.json(appointments);

    } catch (error) {
        console.error("Błąd podczas pobierania terminów dla admina:", error);
        return NextResponse.json({ error: 'Wystąpił wewnętrzny błąd serwera' }, { status: 500 });
    }
}