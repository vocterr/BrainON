// Plik: app/api/book-on-site/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/prisma/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
    // 1. Sprawdzamy, czy użytkownik jest zalogowany
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse('Brak autoryzacji', { status: 401 });
    }

    const body = await request.json();
    const { appointmentDateTime, subject, option, price, notes } = body;

    // 2. Walidacja danych
    if (!appointmentDateTime || !subject || !option || !price) {
        return new NextResponse('Brak wymaganych danych.', { status: 400 });
    }

    // 3. Sprawdzamy, czy wybrana opcja jest stacjonarna
    if (option.id !== 'TEACHER_HOME' && option.id !== 'STUDENT_HOME') {
        return new NextResponse('Ta metoda płatności jest dostępna tylko dla zajęć stacjonarnych.', { status: 400 });
    }

    const adminId = process.env.ADMINID as string;
    if (!adminId) {
        console.error("Brak ADMINID w zmiennych środowiskowych.");
        return new NextResponse('Błąd konfiguracji serwera.', { status: 500 });
    }

    try {
        // 4. Tworzymy rezerwację w bazie z statusem UNPAID
        const newAppointment = await prisma.appointment.create({
            data: {
                studentId: session.user.id,
                teacherId: adminId, 
                date: new Date(appointmentDateTime),
                subject: subject,
                type: option.id,
                price: price, // Zapisujemy w groszach
                notes: notes,
                status: 'UPCOMING',
                paymentStatus: 'UNPAID' // Kluczowa zmiana!
            }
        });
        
        console.log("✅ Pomyślnie zapisano rezerwację (płatność na miejscu).", newAppointment.id);
        return NextResponse.json({ success: true, appointmentId: newAppointment.id });

    } catch (dbError) {
        console.error("Błąd zapisu do bazy danych (płatność na miejscu):", dbError);
        return new NextResponse('Błąd serwera podczas zapisu rezerwacji.', { status: 500 });
    }
}