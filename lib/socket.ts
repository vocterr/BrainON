import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL || ''
    : 'http://localhost:3000';

export const socket: Socket = io(SOCKET_URL, {
    path: '/api/socket',
    autoConnect: false, // Important: Don't auto-connect
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
    upgrade: true,
    rememberUpgrade: true,
});