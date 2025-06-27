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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roomId } = await request.json();

  try {
    // Notify others in the room that a peer joined
    await pusher.trigger(
      `private-room-${roomId}`,
      'peer-joined',
      { userId: session.user.id }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
