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

  // If user is not logged in, reject the auth attempt
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
      email: session.user.email,
      role: session.user.role
    }
  };

  try {
    // Handle presence channels (including presence-online and presence-room-*)
    if (channelName.startsWith('presence-')) {
      const authResponse = pusher.authorizeChannel(socketId, channelName, userData);
      return NextResponse.json(authResponse);
    }
    
    // Handle private channels (for user-specific channels)
    if (channelName.startsWith('private-')) {
      // Only allow users to subscribe to their own private channel
      if (channelName === `private-user-${session.user.id}`) {
        const authResponse = pusher.authorizeChannel(socketId, channelName);
        return NextResponse.json(authResponse);
      }
    }

    // Reject any other channel patterns
    return new Response('Forbidden', { status: 403 });

  } catch (error) {
    console.error("Pusher auth error:", error);
    return new Response('Internal Server Error', { status: 500 });
  }
}