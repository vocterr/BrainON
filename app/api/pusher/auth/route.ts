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
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const socketId = formData.get('socket_id') as string;
  const channelName = formData.get('channel_name') as string;
  const userId = session.user.id;

  const userData = {
    user_id: userId,
    user_info: {
      name: session.user.name || 'User',
      role: session.user.role || 'student'
    }
  };

  // Zezwól na kanał obecności online
  if (channelName === 'presence-online') {
    const authResponse = pusher.authorizeChannel(socketId, channelName, userData);
    return NextResponse.json(authResponse);
  }
  
  // Zezwól na prywatny kanał użytkownika
  if (channelName === `private-user-${userId}`) {
    const authResponse = pusher.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  }

  // ==================================================================
  // NOWA LOGIKA: Zezwól na kanały obecności dla pokoi rozmów
  // ==================================================================
  if (channelName.startsWith('presence-room-')) {
    // W prawdziwej aplikacji sprawdziłbyś, czy użytkownik ma dostęp do tego pokoju.
    // Na razie pozwalamy każdemu zalogowanemu użytkownikowi.
    const authResponse = pusher.authorizeChannel(socketId, channelName, userData);
    return NextResponse.json(authResponse);
  }

  return new Response('Forbidden', { status: 403 });
}