import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Funkcja do obsługi żądań GET
export async function GET(request: Request) {
    try {
        // 1. Sprawdzamy sesję, aby upewnić się, że użytkownik jest zalogowany
        const session = await getServerSession(authOptions);


        // 3. Pobieramy wszystkie terminy z bazy danych
        const appointments = await prisma.appointment.findMany({
            // Sortujemy wyniki od najnowszych
            orderBy: {
                date: 'desc',
            },
            where: {
                studentId: session?.user.id
            },
            // Dołączamy dane ucznia do każdego terminu, aby wyświetlić jego imię i email
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

// W przyszłości możesz tu dodać funkcję POST do tworzenia nowych terminów
// export async function POST(request: Request) { ... }
