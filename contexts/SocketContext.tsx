"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { socket } from '@/lib/socket';

interface SocketContextValue {
    socket: typeof socket;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
    socket,
    isConnected: false
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: session, status } = useSession();
    const [isConnected, setIsConnected] = useState(socket.connected);
    const hasRegisteredRef = useRef(false);

    useEffect(() => {
        const onConnect = () => {
            console.log('[SocketContext] Socket connected:', socket.id);
            setIsConnected(true);
            
            // Register user ONLY here, once per connection
            if (session?.user?.id && !hasRegisteredRef.current) {
                console.log('[SocketContext] Registering user:', session.user.id);
                socket.emit('register-user', session.user.id);
                hasRegisteredRef.current = true;
            }
        };

        const onDisconnect = () => {
            console.log('[SocketContext] Socket disconnected');
            setIsConnected(false);
            hasRegisteredRef.current = false; // Reset on disconnect
        };

        // Add listeners
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        // Handle authentication state changes
        if (status === 'authenticated' && session?.user?.id) {
            if (!socket.connected) {
                console.log('[SocketContext] Authenticated - connecting socket...');
                socket.connect();
            } else if (!hasRegisteredRef.current) {
                // If already connected but not registered, register now
                console.log('[SocketContext] Already connected - registering user');
                socket.emit('register-user', session.user.id);
                hasRegisteredRef.current = true;
            }
        } else if (status === 'unauthenticated') {
            if (socket.connected) {
                console.log('[SocketContext] Unauthenticated - disconnecting socket...');
                hasRegisteredRef.current = false;
                socket.disconnect();
            }
        }

        // Set initial state
        setIsConnected(socket.connected);

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
};