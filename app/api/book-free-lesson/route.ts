// pages/api/book-free-lesson.ts
import { NextResponse } from 'next/server';
import prisma from '@/prisma/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Upewnij się, że ścieżka jest poprawna

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse('Brak autoryzacji', { status: 401 });
    }

    try {
        const body = await request.json();
        const { appointmentDateTime, subject, option, notes, contactInfo, address } = body;

        // Sprawdzenie, czy użytkownik już skorzystał z darmowej lekcji
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { hasUsedFreeLesson: true }
        });

        if (user?.hasUsedFreeLesson) {
            return new NextResponse('Już skorzystałeś z darmowej lekcji. Proszę zarezerwować płatne zajęcia.', { status: 403 });
        }

        // Podstawowa walidacja danych (tak jak w checkout_sessions.ts)
        if (!appointmentDateTime || !subject || !option) {
            return new NextResponse('Brak wymaganych danych do rezerwacji.', { status: 400 });
        }

        if (option.id === 'ONLINE' && !contactInfo) {
            return new NextResponse('Dla lekcji online, proszę podać dane kontaktowe.', { status: 400 });
        }
        if (option.id === 'STUDENT_HOME' && !address) {
            return new NextResponse('Dla dojazdu do ucznia, proszę podać adres.', { status: 400 });
        }

        const appointmentDate = new Date(appointmentDateTime);
        const adminId = process.env.ADMINID as string; // Upewnij się, że masz to ustawione

        // Sprawdzenie dostępności terminu
        const existingAppointment = await prisma.appointment.findFirst({
            where: { date: appointmentDate }
        });

        if (existingAppointment) {
            return new NextResponse('Wybrany termin jest już niestety zajęty.', { status: 409 });
        }

        // Tworzenie rezerwacji darmowej lekcji
        await prisma.appointment.create({
            data: {
                studentId: session.user.id,
                teacherId: adminId,
                date: appointmentDate,
                subject: subject as any, 
                type: option.id as any,
                price: 0, // Cena zawsze 0 dla darmowej lekcji
                notes: notes || '',
                status: 'UPCOMING',
                paymentStatus: 'FREE', // Nowy status płatności dla darmowych lekcji
                contactInfo: contactInfo ? (contactInfo as any) : undefined,
                address: address || '',
            }
        });

        // Aktualizacja statusu użytkownika
        await prisma.user.update({
            where: { id: session.user.id },
            data: { hasUsedFreeLesson: true }
        });

        console.log(`✅ Pomyślnie zarezerwowano darmową lekcję dla użytkownika ${session.user.id}.`);
        return new NextResponse('Rezerwacja darmowej lekcji zakończona sukcesem!', { status: 200 });

    } catch (error: any) {
        console.error("Błąd rezerwacji darmowej lekcji:", error);
        return new NextResponse(error.message || 'Błąd serwera', { status: 500 });
    }
}