// FILE: pages/api/socket/index.ts

import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
// CELOWO NIE IMPORTUJEMY PRISMA - ten serwer ma być lekki

type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: HttpServer & {
      io?: Server;
    };
  };
};

// WAŻNE: Na Vercel ta mapa nie jest niezawodnym sposobem na przechowywanie stanu,
// ale jest wystarczająca dla prostego przekazywania wiadomości między dwoma
// użytkownikami, którzy połączą się mniej więcej w tym samym czasie.
const userToSocketMap = new Map<string, string>();
const socketToUserMap = new Map<string, string>();

const ioHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
    if (!res.socket.server.io) {
        console.log('🔌 [Vercel] Lightweight Socket.IO server is initializing...');
        const io = new Server(res.socket.server, {
            path: '/api/socket',
            cors: { origin: "*", methods: ["GET", "POST"] }
        });

        io.on('connection', (socket) => {
            console.log(`✅ [Vercel] Client connected: ${socket.id}`);

            socket.on('disconnect', () => {
                const userId = socketToUserMap.get(socket.id);
                if (userId) {
                    userToSocketMap.delete(userId);
                    socketToUserMap.delete(socket.id);
                }
            });

            socket.on('register-user', (userId: string) => {
                if (userId) {
                    userToSocketMap.set(userId, socket.id);
                    socketToUserMap.set(socket.id, userId);
                }
            });
            
            // POPRAWIONA LOGIKA: Nie ma już połączenia z bazą danych
            // Odbieramy studentId bezpośrednio od klienta
            socket.on('initiate-call', ({ roomId, callerName, studentId }) => {
                const adminId = socketToUserMap.get(socket.id);
                if (!adminId || !studentId) {
                    console.error('Webhook Error: Missing adminId or studentId for initiate-call');
                    return;
                }
                
                const studentSocketId = userToSocketMap.get(studentId);
                
                if (studentSocketId) {
                    io.to(studentSocketId).emit('incoming-call', { roomId, callerName, adminId });
                    socket.emit('call-status', { studentId: studentId, status: 'ringing' });
                } else {
                    socket.emit('call-status', { studentId: studentId, status: 'offline' });
                }
            });

            // Reszta logiki WebRTC bez zmian
            socket.on('join-room', (roomId: string) => {
                socket.join(roomId);
                const userId = socketToUserMap.get(socket.id);
                socket.to(roomId).emit('peer-joined', { userId });
            });
            socket.on('call-accepted', ({ adminId, roomId, studentId }) => {
                const adminSocketId = userToSocketMap.get(adminId);
                if (adminSocketId) io.to(adminSocketId).emit('call-accepted', { roomId, studentId });
            });
            socket.on('call-rejected', ({ adminId, studentId }) => {
                const adminSocketId = userToSocketMap.get(adminId);
                if (adminSocketId) io.to(adminSocketId).emit('call-status', { studentId, status: 'rejected' });
            });
            socket.on('webrtc-offer', ({ roomId, offer }) => socket.to(roomId).emit('webrtc-offer', { offer }));
            socket.on('webrtc-answer', ({ roomId, answer }) => socket.to(roomId).emit('webrtc-answer', { answer }));
            socket.on('webrtc-ice-candidate', ({ roomId, candidate }) => socket.to(roomId).emit('webrtc-ice-candidate', { candidate }));
            socket.on('hang-up', ({ roomId }) => socket.to(roomId).emit('call-ended'));
        });

        res.socket.server.io = io;
    }
    res.end();
};

export default ioHandler;