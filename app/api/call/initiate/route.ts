import { NextResponse } from 'next/server';
import Pusher from 'pusher';
import prisma from '@/prisma/prisma';
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

  const { roomId, callerName } = await request.json();
  const adminId = session.user.id;

  try {
    // Get call room details
    const callRoom = await prisma.callRoom.findUnique({ 
      where: { id: roomId } 
    });
    
    if (!callRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Send call notification to student
    await pusher.trigger(
      `private-user-${callRoom.studentId}`, 
      'incoming-call', 
      {
        roomId,
        callerName,
        adminId
      }
    );
    
    // Also notify the admin about call status
    await pusher.trigger(
      `private-user-${adminId}`,
      'call-status',
      {
        studentId: callRoom.studentId,
        status: 'ringing'
      }
    );

    return NextResponse.json({ 
      success: true,
      status: 'ringing',
      studentId: callRoom.studentId 
    });
    
  } catch (error) {
    console.error('Error initiating call:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}