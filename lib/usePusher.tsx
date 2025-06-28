"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
// KROK 1: Usuwamy błędny import 'Member' i zostawiamy poprawne
import Pusher, { PresenceChannel, Members } from 'pusher-js';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface IncomingCall {
  roomId: string;
  callerName: string;
  adminId: string;
}

interface CallStatus {
  studentId: string;
  status: 'calling' | 'ringing' | 'accepted' | 'rejected' | 'offline' | 'disconnected' | null;
}

// KROK 2: Definiujemy prosty, poprawny typ dla członka kanału
interface PusherMember {
    id: string;
    info: any; // 'info' może zawierać dodatkowe dane, ale my potrzebujemy tylko 'id'
}

export function usePusher() {
  const { data: session } = useSession();
  const router = useRouter();
  const pusherRef = useRef<Pusher | null>(null);
  
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!session?.user?.id || pusherRef.current) return;

    if (process.env.NODE_ENV === 'development') {
      Pusher.logToConsole = true;
    }

    const pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
      auth: { params: { userId: session.user.id } }
    });
    pusherRef.current = pusherInstance;

    const presenceChannel = pusherInstance.subscribe('presence-online') as PresenceChannel;

    // KROK 3: Używamy poprawnych typów w callbackach
    presenceChannel.bind('pusher:subscription_succeeded', (members: Members) => {
      const memberIds = Object.keys(members.members);
      setOnlineUsers(memberIds);
    });

    presenceChannel.bind('pusher:member_added', (member: PusherMember) => {
      setOnlineUsers(prev => [...new Set([...prev, member.id])]);
    });

    presenceChannel.bind('pusher:member_removed', (member: PusherMember) => {
      setOnlineUsers(prev => prev.filter(id => id !== member.id));
      // Dodatkowa logika do obsługi statusu, gdy ktoś się rozłączy
      if (callStatus?.studentId === member.id) {
        setCallStatus({ studentId: member.id, status: 'disconnected' });
      }
    });

    const privateChannel = pusherInstance.subscribe(`private-user-${session.user.id}`);
    privateChannel.bind('incoming-call', (data: IncomingCall) => setIncomingCall(data));
    privateChannel.bind('call-status', (data: CallStatus) => setCallStatus(data));
    privateChannel.bind('call-accepted', (data: { roomId: string, studentId: string }) => {
      setCallStatus({ studentId: data.studentId, status: 'accepted' });
      router.push(`/rozmowa/${data.roomId}`);
    });

    return () => {
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, [session?.user?.id, router, callStatus?.studentId]);

  const initiateCall = useCallback(async (roomId: string, studentId: string, callerName: string) => {
    await fetch('/api/call/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, studentId, callerName })
    });
  }, []);

  const respondToCall = useCallback((action: 'accept' | 'reject', call: IncomingCall) => {
    setIncomingCall(null);
    fetch('/api/call/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...call })
    });
    if (action === 'accept') {
        router.push(`/rozmowa/${call.roomId}`);
    }
  }, [router]);

  const isUserOnline = useCallback((userId: string) => onlineUsers.includes(userId), [onlineUsers]);

  return { pusher: pusherRef.current, onlineUsers, incomingCall, setIncomingCall, callStatus, setCallStatus, isUserOnline, initiateCall, respondToCall };
}