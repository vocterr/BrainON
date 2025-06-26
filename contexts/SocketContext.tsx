"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface SocketContextType {
    socket: Socket;
    isConnected: boolean;
}

const SOCKET_URL = process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL || ''
    : process.env.NEXT_PUBLIC_SOCKET_URL || 'http://192.168.1.72:3000';

const socket: Socket = io(SOCKET_URL, {
    path: '/api/socket',
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ['websocket', 'polling'],
    upgrade: true,
    rememberUpgrade: true,
});

const SocketContext = createContext<SocketContextType>({
    socket,
    isConnected: false
});

// FILE: contexts/SocketContext.tsx
// (Only the useEffect hook is shown, the rest of the file is the same)

//... imports and context creation ...
export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        const onConnect = () => {
            console.log('[SocketContext] Socket connected:', socket.id);
            setIsConnected(true);
            
            if (session?.user?.id) {
                // DEBUG: Add a log here to see it firing
                console.log(`[SocketContext] DEBUG: Authenticated. Emitting 'register-user' for userId: [${session.user.id}]`);
                socket.emit('register-user', session.user.id);
            }
        };

        const onDisconnect = () => {
            console.log('[SocketContext] Socket disconnected');
            setIsConnected(false);
        };

        if (status === 'authenticated') {
            socket.on('connect', onConnect);
            socket.on('disconnect', onDisconnect);
            if (!socket.connected) {
                socket.connect();
            }
        } 
        else if (status === 'unauthenticated') {
            if (socket.connected) {
                socket.disconnect();
            }
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, [status, session?.user?.id]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}
// ... useSocket hook ...

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};