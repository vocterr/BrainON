import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Inicjalizujemy Stripe z naszym tajnym kluczem
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Logujemy całe otrzymane body w terminalu serwera
    console.log("Otrzymano body w API:", body);

    const { date, time, option, price, notes } = body;

    // POPRAWKA: Bardziej szczegółowa walidacja
    if (!date) {
      return NextResponse.json({ error: 'Brakuje daty (date).' }, { status: 400 });
    }
    if (!time) {
      return NextResponse.json({ error: 'Brakuje czasu (time).' }, { status: 400 });
    }
    if (!option || !option.title) {
      return NextResponse.json({ error: 'Brakuje opcji lekcji (option).' }, { status: 400 });
    }
    if (!price) {
      return NextResponse.json({ error: 'Brakuje ceny (price).' }, { status: 400 });
    }
    
    // Tworzymy sesję płatności Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'p24', 'blik'],
      mode: 'payment',
      
      line_items: [
        {
          price_data: {
            currency: 'pln',
            product_data: {
              name: `Korepetycje Brain:ON - ${option.title}`,
              description: `Termin: ${date} o godz. ${time}`,
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      
      metadata: {
        bookingDate: date,
        bookingTime: time,
        bookingNotes: notes || "Brak", // Upewniamy się, że nie jest null
      },

      success_url: `${request.headers.get('origin')}/platnosc/sukces?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: request.headers.get('referer') || `${request.headers.get('origin')}`,
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (err) {
    console.error("Błąd tworzenia sesji Stripe:", err);
    const errorMessage = err instanceof Error ? err.message : 'Wystąpił nieznany błąd.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
