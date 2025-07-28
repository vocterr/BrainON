// Plik: /api/admin/route.ts

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
                    // Nadchodzące
                    { status: 'UPCOMING' },
                    // ZMIANA: Ukończone lub nieukończone z ostatnich 30 dni
                    { 
                        status: { in: ['COMPLETED', 'NOT_COMPLETED'] }, 
                        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
                    },
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

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
        }

        const body = await request.json();
        const { appointmentId, status } = body;

        if (!appointmentId || !status) {
            return NextResponse.json({ error: 'Brakujące dane: appointmentId lub status' }, { status: 400 });
        }

        // ZMIANA: Walidacja nowego statusu
        if (status !== 'COMPLETED' && status !== 'NOT_COMPLETED') {
            return NextResponse.json({ error: 'Nieprawidłowy status. Dozwolone: COMPLETED, NOT_COMPLETED.' }, { status: 400 });
        }

        const updatedAppointment = await prisma.appointment.update({
            where: {
                id: appointmentId,
            },
            data: {
                status: status,
            },
        });

        return NextResponse.json(updatedAppointment);

    } catch (error) {
        console.error("Błąd podczas aktualizacji statusu terminu:", error);
        return NextResponse.json({ error: 'Wystąpił wewnętrzny błąd serwera' }, { status: 500 });
    }
}
