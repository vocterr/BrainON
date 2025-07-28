// Plik: app/api/cancel-appointment/route.ts

import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil' // Use a specific API version
});

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // 1. Weryfikacja, czy użytkownik jest zalogowany
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
        }

        const { appointmentId } = await request.json();

        if (!appointmentId) {
            return NextResponse.json({ error: 'Brak ID terminu' }, { status: 400 });
        }

        // 2. Znajdź termin, upewniając się, że należy do zalogowanego użytkownika
        const appointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId,
                studentId: session.user.id,
            },
        });

        if (!appointment) {
            return NextResponse.json({ error: 'Nie znaleziono terminu lub brak uprawnień' }, { status: 404 });
        }

        if (appointment.status !== 'UPCOMING') {
            return NextResponse.json({ error: 'Można anulować tylko nadchodzące terminy' }, { status: 400 });
        }

        // 3. Sprawdzenie zasady 24 godzin
        const now = new Date();
        const appointmentDate = new Date(appointment.date);
        const timeDifference = appointmentDate.getTime() - now.getTime();
        const hoursDifference = timeDifference / (1000 * 60 * 60);

        if (hoursDifference < 24) {
            return NextResponse.json({ error: 'Nie można anulować terminu na mniej niż 24 godziny przed jego rozpoczęciem' }, { status: 400 });
        }

        // 4. Logika zwrotu płatności Stripe
        if (appointment.paymentStatus === 'PAID' && appointment.paymentIntentId) {
            try {
                // Utwórz zwrot dla danej intencji płatności
                await stripe.refunds.create({
                    payment_intent: appointment.paymentIntentId,
                });
            } catch (stripeError: any) {
                console.error("Błąd podczas zwrotu płatności Stripe:", stripeError);
                // Nawet jeśli zwrot się nie powiedzie, możemy kontynuować z anulowaniem,
                // ale warto to zalogować do ręcznej weryfikacji.
                return NextResponse.json({ error: `Wystąpił błąd podczas przetwarzania zwrotu: ${stripeError.message}` }, { status: 500 });
            }
        }

        // 5. Zaktualizuj status terminu w bazie danych
        const cancelledAppointment = await prisma.appointment.update({
            where: {
                id: appointmentId,
            },
            data: {
                status: 'CANCELLED',
            },
        });

        return NextResponse.json(cancelledAppointment);

    } catch (error) {
        console.error("Błąd podczas anulowania terminu:", error);
        return NextResponse.json({ error: 'Wystąpił wewnętrzny błąd serwera' }, { status: 500 });
    }
}
