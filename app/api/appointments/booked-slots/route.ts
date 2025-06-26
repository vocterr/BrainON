// Plik: app/api/appointments/booked-slots/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/prisma/prisma';

// Definiujemy typ, aby pasował do oczekiwań frontendu
type BookedSlots = {
  [date: string]: string[];
}

export async function GET() {
  try {
    // 1. Pobieramy z bazy wszystkie rezerwacje, które mają status 'UPCOMING'
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        status: 'UPCOMING',
      },
      select: {
        date: true, // Interesuje nas tylko pole z datą i godziną
      },
    });

    // 2. Przetwarzamy dane do formatu, którego oczekuje kalendarz
    const bookedSlots = upcomingAppointments.reduce((acc, appointment) => {
      // Ustawiamy strefę czasową na Polskę, aby uniknąć błędów
      const localDate = new Date(appointment.date.toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }));

      // Formatujemy datę na 'YYYY-MM-DD'
      const dateString = localDate.toISOString().split('T')[0];

      // Formatujemy godzinę na 'HH:MM'
      const timeString = localDate.toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      // Jeśli dla danej daty nie ma jeszcze tablicy, tworzymy ją
      if (!acc[dateString]) {
        acc[dateString] = [];
      }
      // Dodajemy zajętą godzinę do tablicy
      acc[dateString].push(timeString);

      return acc;
    }, {} as BookedSlots);

    // 3. Zwracamy przetworzone dane jako JSON
    return NextResponse.json(bookedSlots);

  } catch (error) {
    console.error("Błąd podczas pobierania zajętych terminów:", error);
    return new NextResponse('Błąd serwera', { status: 500 });
  }
}