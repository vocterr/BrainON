import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/prisma/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
});

export async function POST(request: Request) {
  try {
    // POPRAWKA: Oczekujemy teraz `appointmentDateTime` zamiast osobnych `date` i `time`
    const { appointmentDateTime, subject, option, price, notes, userId } = await request.json();

    // POPRAWKA: Zaktualizowana walidacja
    if (!userId || !appointmentDateTime || !option || !price || !subject) {
      return NextResponse.json({ error: 'Brakuje danych do utworzenia sesji płatności.' }, { status: 400 });
    }
    
    const dateObj = new Date(appointmentDateTime);
    if (isNaN(dateObj.getTime())) {
        return NextResponse.json({ error: 'Nieprawidłowa wartość daty/czasu' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'p24', 'blik'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'pln',
            product_data: {
              name: `Korepetycje Brain:ON - ${subject}`,
              description: `Termin: ${dateObj.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })} o ${dateObj.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`,
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        studentId: userId,
        date: dateObj.toISOString(),
        subject: subject,
        type: option.id,
        price: price,
        notes: notes || "Brak",
      },
      success_url: `${request.headers.get('origin')}/moje-terminy?status=success`,
      cancel_url: request.headers.get('referer') || `${request.headers.get('origin')}`,
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (err) {
    console.error("Błąd tworzenia sesji Stripe:", err);
    const errorMessage = err instanceof Error ? err.message : 'Wystąpił nieznany błąd.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
