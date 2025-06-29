import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Funkcja do obsługi żądań GET
export async function GET(request: Request) {
    try {
        // 1. Sprawdzamy sesję, aby upewnić się, że użytkownik jest zalogowany
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
        }

        // 3. Pobieramy wszystkie terminy z bazy danych dla zalogowanego użytkownika
        const appointments = await prisma.appointment.findMany({
            // Sortujemy wyniki od najnowszych
            orderBy: {
                date: 'desc',
            },
            where: {
                // Filtrujemy po ID studenta z sesji
                studentId: session.user.id
            },
            // Dołączamy dane ucznia do każdego terminu, chociaż tutaj filtrujemy po jego ID
            // to może być przydatne w innych kontekstach. W tym przypadku nie jest konieczne.
            include: {
                student: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // 4. Zwracamy listę terminów jako odpowiedź JSON
        return NextResponse.json(appointments);

    } catch (error) {
        // Obsługa nieoczekiwanych błędów serwera
        console.error("Błąd podczas pobierania terminów:", error);
        return NextResponse.json({ error: 'Wystąpił wewnętrzny błąd serwera' }, { status: 500 });
    }
}