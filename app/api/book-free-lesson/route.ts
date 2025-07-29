// pages/api/book-free-lesson.ts
import { NextResponse } from 'next/server';
import prisma from '@/prisma/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Upewnij się, że ścieżka jest poprawna

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        console.log('❌ Brak autoryzacji: Użytkownik niezalogowany.'); // Log autoryzacji
        return new NextResponse('Brak autoryzacji', { status: 401 });
    }

    try {
        const body = await request.json();
        // Logowanie całego ciała żądania otrzymanego z frontendu
        console.log('➡️ Otrzymano dane od klienta (POST /api/book-free-lesson):', body); 

        const { appointmentDateTime, subject, option, notes, contactInfo, address } = body;

        // Logowanie poszczególnych kluczowych pól z body
        console.log('   - appointmentDateTime:', appointmentDateTime, 'Typ:', typeof appointmentDateTime);
        console.log('   - subject:', subject);
        console.log('   - option:', option);
        console.log('   - contactInfo:', contactInfo, 'Typ:', typeof contactInfo);
        console.log('   - address:', address, 'Typ:', typeof address);


        // Sprawdzenie, czy użytkownik już skorzystał z darmowej lekcji
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { hasUsedFreeLesson: true }
        });

        if (user?.hasUsedFreeLesson) {
            console.warn(`⚠️ Użytkownik ${session.user.id} już skorzystał z darmowej lekcji. Zwracam 403.`);
            return new NextResponse('Już skorzystałeś z darmowej lekcji. Proszę zarezerwować płatne zajęcia.', { status: 403 });
        }

        // Podstawowa walidacja danych
        if (!appointmentDateTime || !subject || !option) {
            console.error('❌ Błąd walidacji: Brak wymaganych danych (appointmentDateTime, subject, option). Zwracam 400.');
            return new NextResponse('Brak wymaganych danych do rezerwacji.', { status: 400 });
        }

        if (option.id === 'ONLINE' && !contactInfo) {
            console.error('❌ Błąd walidacji: Dla lekcji online brak contactInfo. Zwracam 400.');
            return new NextResponse('Dla lekcji online, proszę podać dane kontaktowe.', { status: 400 });
        }
        if (option.id === 'STUDENT_HOME' && !address) {
            console.error('❌ Błąd walidacji: Dla dojazdu do ucznia brak address. Zwracam 400.');
            return new NextResponse('Dla dojazdu do ucznia, proszę podać adres.', { status: 400 });
        }

        // Próba utworzenia obiektu Date z otrzymanego stringa
        const appointmentDate = new Date(appointmentDateTime);
        // Sprawdzenie, czy parsowanie daty zakończyło się sukcesem (czy data jest poprawna)
        if (isNaN(appointmentDate.getTime())) {
            console.error('❌ Błąd parsowania daty: appointmentDateTime nie jest prawidłowym formatem daty.', {
                received: appointmentDateTime,
                parsedResult: appointmentDate
            });
            return new NextResponse('Nieprawidłowy format daty/czasu. Otrzymano: ' + appointmentDateTime, { status: 400 });
        }
        console.log('   - Sparsowana data na serwerze:', appointmentDate);


        const adminId = process.env.ADMINID as string; // Upewnij się, że masz to ustawione
        if (!adminId) {
            console.error('❌ Błąd konfiguracji: Zmienna środowiskowa ADMINID nie jest ustawiona.');
            return new NextResponse('Błąd konfiguracji serwera: ADMINID nie ustawione.', { status: 500 });
        }


        // Sprawdzenie dostępności terminu
        console.log(`🔍 Sprawdzanie dostępności terminu: ${appointmentDate}`);
        const existingAppointment = await prisma.appointment.findFirst({
            where: { date: appointmentDate }
        });

        if (existingAppointment) {
            console.warn(`⚠️ Konflikt: Termin ${appointmentDate} jest już zajęty przez spotkanie ID: ${existingAppointment.id}. Zwracam 409.`);
            return new NextResponse('Wybrany termin jest już niestety zajęty.', { status: 409 });
        }

        // Tworzenie rezerwacji darmowej lekcji
        console.log(`Attempting to create free lesson for user ${session.user.id} at ${appointmentDate}...`);
        await prisma.appointment.create({
            data: {
                studentId: session.user.id,
                teacherId: adminId,
                date: appointmentDate,
                subject: subject as any, 
                type: option.id as any,
                price: 0, 
                notes: notes || '',
                status: 'UPCOMING',
                paymentStatus: 'FREE', 
                contactInfo: contactInfo ? (contactInfo as any) : undefined,
                address: address || '',
            }
        });
        console.log(`✅ Pomyślnie utworzono rezerwację dla użytkownika ${session.user.id} na termin ${appointmentDate}.`);

        // Aktualizacja statusu użytkownika
        await prisma.user.update({
            where: { id: session.user.id },
            data: { hasUsedFreeLesson: true }
        });
        console.log(`✅ Użytkownik ${session.user.id} oznaczony jako ten, który skorzystał z darmowej lekcji.`);

        console.log(`✅ Pomyślnie zarezerwowano darmową lekcję dla użytkownika ${session.user.id}.`);
        return new NextResponse('Rezerwacja darmowej lekcji zakończona sukcesem!', { status: 200 });

    } catch (error: any) {
        // Logowanie pełnego błędu w przypadku niepowodzenia
        console.error("❌ Błąd rezerwacji darmowej lekcji (ogólny catch):", error);
        // Jeśli błąd ma wiadomość, użyj jej; w przeciwnym razie ogólna wiadomość
        return new NextResponse(error.message || 'Wystąpił nieoczekiwany błąd serwera podczas rezerwacji darmowej lekcji.', { status: 500 });
    }
}