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

  const { roomId, type, data } = await request.json();

  try {
    // Map signal types to Pusher events
    const eventMap: Record<string, string> = {
      'offer': 'webrtc-offer',
      'answer': 'webrtc-answer',
      'ice-candidate': 'webrtc-ice-candidate'
    };

    const event = eventMap[type];
    if (!event) {
      return NextResponse.json({ error: 'Invalid signal type' }, { status: 400 });
    }

    // Send the signal to all peers in the room
    await pusher.trigger(
      `private-room-${roomId}`,
      event,
      { [type.replace('-', '')]: data }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending signal:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}