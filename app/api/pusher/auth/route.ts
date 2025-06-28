import { NextResponse } from 'next/server';
import Pusher from 'pusher';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // Jeśli użytkownik nie jest zalogowany, odrzuć próbę
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const socketId = formData.get('socket_id') as string;
  const channelName = formData.get('channel_name') as string;
  
  const userData = {
    user_id: session.user.id,
    user_info: {
      name: session.user.name,
      role: session.user.role
    }
  };

  try {
    // ==================================================================
    // POPRAWKA: Upraszczamy logikę. Jeśli kanał jest typu 'presence',
    // zawsze autoryzujemy go, dodając dane użytkownika.
    // Obejmuje to zarówno 'presence-online', jak i 'presence-room-...'.
    // ==================================================================
    if (channelName.startsWith('presence-')) {
        const authResponse = pusher.authorizeChannel(socketId, channelName, userData);
        return NextResponse.json(authResponse);
    }
    
    // Prywatne kanały autoryzujemy bez dodatkowych danych
    if (channelName.startsWith('private-')) {
        const authResponse = pusher.authorizeChannel(socketId, channelName);
        return NextResponse.json(authResponse);
    }

    // Jeśli kanał nie pasuje do żadnego wzorca, odrzuć
    return new Response('Forbidden', { status: 403 });

  } catch (error) {
    console.error("Błąd autoryzacji Pushera:", error);
    // Zwracamy 403 również w przypadku wewnętrznego błędu, aby być bezpiecznym
    return new Response('Forbidden', { status: 403 });
  }
}