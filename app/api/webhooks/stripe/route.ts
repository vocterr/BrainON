import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/prisma/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.arrayBuffer();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(Buffer.from(body), signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (!metadata) {
        console.error('❌ Webhook Error: Missing metadata in session:', session.id);
        return new NextResponse('Brak metadanych w sesji.', { status: 400 });
    }

    // ==================================================================
    // POPRAWIONA LOGIKA: Odczytujemy dane i tworzymy nową rezerwację
    // ==================================================================
    const { studentId, appointmentDateTime, subject, type, price, notes, contactInfo } = metadata;
    const adminId = process.env.ADMINID as string;
    
    // Walidacja danych z metadanych
    if (!studentId || !appointmentDateTime || !subject || !type || !price || !adminId) {
        console.error('❌ Webhook Error: Incomplete metadata:', metadata);
        return new NextResponse('Niekompletne dane w metadanych sesji.', { status: 400 });
    }

    try {
      const appointmentDate = new Date(appointmentDateTime);

      // Dodajemy sprawdzenie dostępności terminu również tutaj, aby uniknąć race condition
      const existingAppointment = await prisma.appointment.findFirst({
        where: { date: appointmentDate },
      });

      if (existingAppointment) {
        console.warn(`Webhook: Próba rezerwacji już zajętego terminu: ${appointmentDateTime}`);
        // Zwracamy 200, aby Stripe nie próbował ponownie. Obsługa zwrotu pieniędzy
        // powinna być wykonana manualnie lub przez inny system.
        return new NextResponse(null, { status: 200 });
      }

      await prisma.appointment.create({
        data: {
          studentId: studentId,
          teacherId: adminId, 
          date: appointmentDate,
          subject: subject as any, // Typy enum są walidowane wcześniej
          type: type as any,
          price: parseInt(price),
          notes: notes,
          status: 'UPCOMING',
          paymentStatus: 'PAID', // Kluczowa zmiana!
          contactInfo: contactInfo
        }
      });
      
      console.log(`✅ Pomyślnie zapisano opłaconą rezerwację z metadanych Stripe.`);
    } catch (dbError) {
      console.error("❌ Błąd zapisu do bazy danych z webhooka:", dbError);
      return new NextResponse('Błąd serwera podczas zapisu rezerwacji.', { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}