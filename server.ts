// FILE: server.ts

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import prisma from './prisma/prisma';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const userToSocketMap = new Map<string, string>();
const socketToUserMap = new Map<string, string>();

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            if (!req.url) return;
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error handling request:', err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    const io = new SocketIOServer(httpServer, {
        path: '/api/socket',
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    io.on('connection', (socket) => {
        console.log(`✅ [Socket.IO] New client connected: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`❌ [Socket.IO] Client disconnected: ${socket.id}`);
            const userId = socketToUserMap.get(socket.id);
            if (userId) {
                userToSocketMap.delete(userId);
                socketToUserMap.delete(socket.id);
                console.log(`🧹 [Socket.IO] Cleaned up disconnected user: ${userId}`);
            }
        });

        // --- DEBUG STEP 1: Check if student registration is working ---
        socket.on('register-user', (userId: string) => {
            if (userId) {
                console.log(`🧑 [Socket.IO] DEBUG: Received 'register-user' for userId: [${userId}] from socket: [${socket.id}]`);
                userToSocketMap.set(userId, socket.id);
                socketToUserMap.set(socket.id, userId);
                // Log the entire map to see who is online
                console.log('🗺️ [Socket.IO] DEBUG: Current online users map:', userToSocketMap);
            } else {
                console.warn(`[Socket.IO] DEBUG: Received 'register-user' event with a NULL or UNDEFINED userId.`);
            }
        });
        
        // --- DEBUG STEP 2: Trace the entire 'initiate-call' flow ---
        socket.on('initiate-call', async ({ roomId, callerName }) => {
            console.log('---');
            console.log(`📞 [Socket.IO] DEBUG: Received 'initiate-call' for room [${roomId}] from [${callerName}]`);
            
            const adminId = socketToUserMap.get(socket.id);
            if (!adminId) {
                console.error(`[Socket.IO] DEBUG: CRITICAL ERROR! Could not find adminId for socket ${socket.id}`);
                return;
            }

            try {
                const callRoom = await prisma.callRoom.findUnique({ where: { id: roomId } });
                if (!callRoom) {
                    console.error(`[Socket.IO] DEBUG: Database lookup failed. Call room not found for id: [${roomId}]`);
                    return;
                }
                
                const studentIdToFind = callRoom.studentId;
                console.log(`🔍 [Socket.IO] DEBUG: Looking for studentId [${studentIdToFind}] in the user map.`);
                
                const studentSocketId = userToSocketMap.get(studentIdToFind);
                
                if (studentSocketId) {
                    console.log(`✅ [Socket.IO] DEBUG: SUCCESS! Found student socket: [${studentSocketId}]. Sending 'incoming-call'...`);
                    io.to(studentSocketId).emit('incoming-call', { roomId, callerName, adminId });
                    socket.emit('call-status', { studentId: studentIdToFind, status: 'ringing' });
                } else {
                    console.error(`❌ [Socket.IO] DEBUG: FAILURE! Student [${studentIdToFind}] is not online or not registered. Cannot send notification.`);
                    console.log('🗺️ [Socket.IO] DEBUG: Map contents at time of failure:', userToSocketMap);
                    socket.emit('call-status', { studentId: studentIdToFind, status: 'offline' });
                }
            } catch (dbError) {
                console.error(`[Socket.IO] DEBUG: A database error occurred during 'initiate-call':`, dbError);
            }
             console.log('---');
        });
        
        // --- Other Handlers (no changes needed) ---
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

    httpServer.listen(port, () => console.log(`🚀 Server ready at http://${hostname}:${port}`));
});