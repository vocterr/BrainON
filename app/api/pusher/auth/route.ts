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

  // Security: Users can only subscribe to their own channels
  const userId = session.user.id;
  
  // Allow presence channel for online status
  if (channelName === `presence-online`) {
    const authResponse = pusher.authorizeChannel(socketId, channelName, {
      user_id: userId,
      user_info: {
        name: session.user.name || 'User',
        role: session.user.role || 'student'
      }
    });
    return NextResponse.json(authResponse);
  }
  
  // Allow users to subscribe to their own private channel
  if (channelName === `private-user-${userId}`) {
    const authResponse = pusher.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  }

  // Allow users to subscribe to room channels they're part of
  if (channelName.startsWith('private-room-')) {
    // In a production app, you'd verify the user has access to this room
    // For now, we'll allow authenticated users to join any room
    const authResponse = pusher.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  }

  return new Response('Forbidden', { status: 403 });
}