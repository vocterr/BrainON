import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/prisma/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
});

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

        const appointmentDate = new Date(appointmentDateTime);
        
        // Sprawdzamy, czy termin nie jest już zajęty
        const existingAppointment = await prisma.appointment.findFirst({
            where: { date: appointmentDate }
        });

        if (existingAppointment) {
            return new NextResponse('Wybrany termin jest już niestety zajęty.', { status: 409 });
        }
        
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'p24', 'blik'],
            line_items: [
                {
                    price_data: {
                        currency: 'pln',
                        product_data: {
                            name: `Korepetycje - ${subject}`,
                            description: `Forma: ${option.title} | Termin: ${appointmentDate.toLocaleString('pl-PL')}`,
                        },
                        unit_amount: price * 100, // Cena w groszach
                    },
                    quantity: 1,
                },
            ],
            // ==================================================================
            // KLUCZOWA ZMIANA: Przekazujemy wszystkie dane do metadanych
            // ==================================================================
            metadata: {
                studentId: session.user.id,
                appointmentDateTime: appointmentDateTime,
                subject: subject,
                type: option.id,
                price: price.toString(),
                notes: notes || '',
            },
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/rezerwacja-sukces`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/rezerwacja-anulowana`,
        });

        return NextResponse.json({ sessionId: checkoutSession.id });

    } catch (error: any) {
        console.error("Błąd tworzenia sesji Stripe:", error);
        return new NextResponse(error.message || 'Błąd serwera', { status: 500 });
    }
}