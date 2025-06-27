import { useEffect, useRef, useState, useCallback } from 'react';
import Pusher from 'pusher-js';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface IncomingCall {
  roomId: string;
  callerName: string;
  adminId: string;
}

interface CallStatus {
  studentId: string;
  status: 'ringing' | 'accepted' | 'rejected' | 'offline';
}

export function usePusher() {
  const { data: session } = useSession();
  const router = useRouter();
  const pusherRef = useRef<Pusher | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Enable Pusher logging in development
    if (process.env.NODE_ENV === 'development') {
      Pusher.logToConsole = true;
    }

    // Initialize Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth'
    });

    pusherRef.current = pusher;

    // Subscribe to user's private channel
    const privateChannel = pusher.subscribe(`private-user-${session.user.id}`);
    
    // Subscribe to presence channel to track online users
    const presenceChannel = pusher.subscribe('presence-online') as any;

    // Handle presence events
    presenceChannel.bind('pusher:subscription_succeeded', (members: any) => {
      const memberIds = Object.keys(members.members);
      setOnlineUsers(memberIds);
      console.log('Online users:', memberIds);
    });

    presenceChannel.bind('pusher:member_added', (member: any) => {
      setOnlineUsers(prev => [...prev, member.id]);
      console.log('User came online:', member.id);
    });

    presenceChannel.bind('pusher:member_removed', (member: any) => {
      setOnlineUsers(prev => prev.filter(id => id !== member.id));
      console.log('User went offline:', member.id);
    });

    // Handle incoming calls (for students)
    privateChannel.bind('incoming-call', (data: IncomingCall) => {
      console.log('Incoming call:', data);
      setIncomingCall(data);
    });

    // Handle call status updates (for admin)
    privateChannel.bind('call-status', (data: CallStatus) => {
      console.log('Call status:', data);
      setCallStatus(data);
    });

    // Handle call accepted (for admin)
    privateChannel.bind('call-accepted', (data: { roomId: string; studentId: string }) => {
      console.log('Call accepted:', data);
      setCallStatus({ studentId: data.studentId, status: 'accepted' });
      // Redirect to video room
      router.push(`/admin/video/${data.roomId}`);
    });

    return () => {
      privateChannel.unbind_all();
      privateChannel.unsubscribe();
      presenceChannel.unbind_all();
      presenceChannel.unsubscribe();
      pusher.disconnect();
    };
  }, [session?.user?.id, router]);

  const initiateCall = useCallback(async (roomId: string, callerName: string) => {
    try {
      const response = await fetch('/api/call/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, callerName })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      return data;
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  }, []);

  const respondToCall = useCallback(async (action: 'accept' | 'reject', roomId: string, adminId: string) => {
    try {
      const response = await fetch('/api/call/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, roomId, adminId })
      });
      
      if (!response.ok) throw new Error('Failed to respond');
      
      setIncomingCall(null);
      
      if (action === 'accept') {
        router.push(`/student/video/${roomId}`);
      }
    } catch (error) {
      console.error('Error responding to call:', error);
      throw error;
    }
  }, [router]);

  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.includes(userId);
  }, [onlineUsers]);

  return {
    incomingCall,
    callStatus,
    onlineUsers,
    isUserOnline,
    initiateCall,
    respondToCall,
    setCallStatus
  };
}