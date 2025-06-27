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

  const { action, roomId, adminId } = await request.json();
  const studentId = session.user.id;

  try {
    if (action === 'accept') {
      await pusher.trigger(
        `private-user-${adminId}`,
        'call-accepted',
        { roomId, studentId }
      );
    } else if (action === 'reject') {
      await pusher.trigger(
        `private-user-${adminId}`,
        'call-status',
        { studentId, status: 'rejected' }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error responding to call:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}