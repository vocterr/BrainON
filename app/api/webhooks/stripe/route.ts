 import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import prisma from '@/prisma/prisma';

// Inicjalizujemy Stripe z naszym tajnym kluczem
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil',
});

export async function POST(request: Request) {
    // Odczytujemy ciało żądania i sygnaturę z nagłówków
    const body = await request.text();
    // POPRAWKA: Dodajemy 'await', aby poczekać na rozwiązanie obietnicy
    const signature = (await headers()).get('Stripe-Signature') as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    // Weryfikujemy, czy żądanie na pewno pochodzi od Stripe
    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Obsługujemy zdarzenie `checkout.session.completed`
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        if (!metadata) {
            return new NextResponse('Brak metadanych w sesji.', { status: 400 });
        }
        
        // Wyciągamy dane, które zapisaliśmy w metadanych podczas tworzenia sesji
        const { studentId, date, subject, type, price, notes } = metadata;
        
        // W przyszłości możesz tu znaleźć ID admina dynamicznie, teraz na stałe
        const adminId = process.env.ADMINID as string;

        try {
            // Tworzymy nowy termin w bazie danych
            await prisma.appointment.create({
                data: {
                    studentId: studentId,
                    teacherId: adminId, 
                    date: new Date(date),
                    subject: subject as any,
                    type: type as any,
                    price: parseInt(price),
                    notes: notes,
                    status: 'UPCOMING',
                }
            });
            console.log("✅ Pomyślnie zapisano rezerwację w bazie danych.");
        } catch (dbError) {
            console.error("Błąd zapisu do bazy danych:", dbError);
            return new NextResponse('Błąd serwera podczas zapisu rezerwacji.', { status: 500 });
        }
    }

    // Zawsze zwracamy sukces (200 OK) do Stripe, aby potwierdzić odbiór
    return new NextResponse(null, { status: 200 });
}
