import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../prisma/prisma'; // Upewnij się, że ścieżka do prismy jest poprawna

type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: HttpServer & {
      io?: Server;
    };
  };
};

const userToSocketMap = new Map<string, string>();
const socketToUserMap = new Map<string, string>();

const ioHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
    if (!res.socket.server.io) {
        console.log('🔌 [Vercel] Socket.IO server is initializing...');
        const io = new Server(res.socket.server, {
            path: '/api/socket',
            cors: { origin: "*", methods: ["GET", "POST"] }
        });

        // TA LOGIKA JEST TERAZ IDENTYCZNA JAK W server.ts
        io.on('connection', (socket) => {
            console.log(`✅ [Vercel][Socket.IO] New client connected: ${socket.id}`);

            socket.on('disconnect', () => {
                console.log(`❌ [Vercel][Socket.IO] Client disconnected: ${socket.id}`);
                const userId = socketToUserMap.get(socket.id);
                if (userId) {
                    userToSocketMap.delete(userId);
                    socketToUserMap.delete(socket.id);
                    console.log(`🧹 [Vercel][Socket.IO] Cleaned up disconnected user: ${userId}`);
                }
            });

            socket.on('register-user', (userId: string) => {
                if (userId) {
                    console.log(`🧑 [Vercel][Socket.IO] DEBUG: Received 'register-user' for userId: [${userId}] from socket: [${socket.id}]`);
                    userToSocketMap.set(userId, socket.id);
                    socketToUserMap.set(socket.id, userId);
                    console.log('🗺️ [Vercel][Socket.IO] DEBUG: Current online users map:', userToSocketMap);
                } else {
                    console.warn(`[Vercel][Socket.IO] DEBUG: Received 'register-user' event with a NULL or UNDEFINED userId.`);
                }
            });
            
            socket.on('initiate-call', async ({ roomId, callerName }) => {
                console.log('---');
                console.log(`📞 [Vercel][Socket.IO] DEBUG: Received 'initiate-call' for room [${roomId}] from [${callerName}]`);
                
                const adminId = socketToUserMap.get(socket.id);
                if (!adminId) {
                    console.error(`[Vercel][Socket.IO] DEBUG: CRITICAL ERROR! Could not find adminId for socket ${socket.id}`);
                    return;
                }

                try {
                    const callRoom = await prisma.callRoom.findUnique({ where: { id: roomId } });
                    if (!callRoom) {
                        console.error(`[Vercel][Socket.IO] DEBUG: Database lookup failed. Call room not found for id: [${roomId}]`);
                        return;
                    }
                    
                    const studentIdToFind = callRoom.studentId;
                    console.log(`🔍 [Vercel][Socket.IO] DEBUG: Looking for studentId [${studentIdToFind}] in the user map.`);
                    
                    const studentSocketId = userToSocketMap.get(studentIdToFind);
                    
                    if (studentSocketId) {
                        console.log(`✅ [Vercel][Socket.IO] DEBUG: SUCCESS! Found student socket: [${studentSocketId}]. Sending 'incoming-call'...`);
                        io.to(studentSocketId).emit('incoming-call', { roomId, callerName, adminId });
                        socket.emit('call-status', { studentId: studentIdToFind, status: 'ringing' });
                    } else {
                        console.error(`❌ [Vercel][Socket.IO] DEBUG: FAILURE! Student [${studentIdToFind}] is not online or not registered.`);
                        console.log('🗺️ [Vercel][Socket.IO] DEBUG: Map contents at time of failure:', userToSocketMap);
                        socket.emit('call-status', { studentId: studentIdToFind, status: 'offline' });
                    }
                } catch (dbError) {
                    console.error(`[Vercel][Socket.IO] DEBUG: A database error occurred during 'initiate-call':`, dbError);
                }
                 console.log('---');
            });
            
            socket.on('join-room', (roomId: string) => {
                socket.join(roomId);
                const userId = socketToUserMap.get(socket.id);
                socket.to(roomId).emit('peer-joined', { userId });
            });
            socket.on('call-accepted', ({ adminId, roomId, studentId }) => {
                const adminSocketId = userToSocketMap.get(adminId);
                if (adminSocketId) { io.to(adminSocketId).emit('call-accepted', { roomId, studentId }); }
            });
            socket.on('call-rejected', ({ adminId, studentId }) => {
                const adminSocketId = userToSocketMap.get(adminId);
                if (adminSocketId) { io.to(adminSocketId).emit('call-status', { studentId, status: 'rejected' }); }
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