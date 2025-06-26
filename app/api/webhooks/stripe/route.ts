// FILE: app/api/webhooks/stripe/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/prisma/prisma'; // Upewnij się, że ścieżka jest poprawna

// Inicjalizujemy Stripe z naszym tajnym kluczem
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  // Pobieramy surowe ciało żądania jako bufor
  const body = await request.arrayBuffer();
  
  // ==================================================================
  // OSTATECZNA POPRAWKA: Odczytujemy nagłówek bezpośrednio z obiektu 'request'.
  // To jest poprawny i prostszy sposób, który rozwiązuje błąd TypeScript.
  // ==================================================================
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    // Weryfikujemy, czy powiadomienie na pewno przyszło od Stripe
    event = stripe.webhooks.constructEvent(Buffer.from(body), signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Jeśli weryfikacja się powiodła, obsługujemy zdarzenie
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    // Upewniamy się, że metadane i potrzebne ID istnieją
    if (!metadata || !metadata.appointmentId) {
        console.error('❌ Webhook Error: Missing appointmentId in metadata for session:', session.id);
        return new NextResponse('Brak appointmentId w metadanych sesji.', { status: 400 });
    }
    
    const { appointmentId } = metadata;

    try {
      // Znajdź wizytę w bazie danych i zaktualizuj jej status
      await prisma.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          paymentStatus: 'PAID', // Zakładając, że masz takie pole w modelu
        },
      });
      console.log(`✅ Pomyślnie oznaczono rezerwację ${appointmentId} jako opłaconą.`);
    } catch (dbError) {
      console.error("❌ Błąd zapisu do bazy danych:", dbError);
      return new NextResponse('Błąd serwera podczas zapisu rezerwacji.', { status: 500 });
    }
  }

  // Zwracamy sukces (200 OK) do Stripe, aby potwierdzić odbiór
  return new NextResponse(null, { status: 200 });
}