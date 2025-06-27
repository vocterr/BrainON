// Plik: app/api/book-on-site/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/prisma/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse('Brak autoryzacji', { status: 401 });
    }

    try {
        const body = await request.json();
        const { appointmentDateTime, subject, option, price, notes } = body;

        if (!appointmentDateTime || !subject || !option || !price) {
            return new NextResponse('Brak wymaganych danych.', { status: 400 });
        }

        if (option.id !== 'TEACHER_HOME' && option.id !== 'STUDENT_HOME') {
            return new NextResponse('Ta metoda płatności jest dostępna tylko dla zajęć stacjonarnych.', { status: 400 });
        }

        const adminId = process.env.ADMINID as string;
        if (!adminId) {
            console.error("Brak ADMINID w zmiennych środowiskowych.");
            return new NextResponse('Błąd konfiguracji serwera.', { status: 500 });
        }

        const appointmentDate = new Date(appointmentDateTime);

        // ==================================================================
        // KROK 1: Sprawdzamy, czy termin nie jest już zajęty
        // ==================================================================
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                date: appointmentDate,
            }
        });

        if (existingAppointment) {
            // Jeśli termin jest zajęty, zwracamy czytelny błąd
            return new NextResponse('Wybrany termin jest już niestety zajęty. Proszę wybrać inny.', { status: 409 }); // 409 Conflict
        }

        // ==================================================================
        // KROK 2: Jeśli termin jest wolny, tworzymy rezerwację
        // ==================================================================
        const newAppointment = await prisma.appointment.create({
            data: {
                studentId: session.user.id,
                teacherId: adminId, 
                date: appointmentDate,
                subject: subject,
                type: option.id,
                price: price,
                notes: notes,
                status: 'UPCOMING',
                paymentStatus: 'UNPAID'
            }
        });
        
        console.log("✅ Pomyślnie zapisano rezerwację (płatność na miejscu).", newAppointment.id);
        return NextResponse.json({ success: true, appointmentId: newAppointment.id });

    } catch (dbError) {
        console.error("Błąd zapisu do bazy danych (płatność na miejscu):", dbError);
        return new NextResponse('Błąd serwera podczas zapisu rezerwacji.', { status: 500 });
    }
}