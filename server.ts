import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import next from 'next';
import { parse } from 'url';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

interface UserConnection {
    socketId: string;
    currentRoom?: string;
    userId?: string;
}

const userSocketMap = new Map<string, UserConnection>();
const socketUserMap = new Map<string, string>(); // socketId -> userId mapping

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer, {
        path: "/api/socket",
        cors: {
            origin: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL : "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        },
        pingInterval: 10000,
        pingTimeout: 5000,
        transports: ['websocket', 'polling']
    });

    io.on('connection', (socket: Socket) => {
        console.log(`[SERVER] ✅ Client Connected: ${socket.id}`);

        // --- User Registration ---
        socket.on('register-user', (userId: string) => {
            // Check if this user is already registered with a different socket
            const existingUser = userSocketMap.get(userId);

            if (existingUser && existingUser.socketId === socket.id) {
                console.log(`[SERVER] ⚠️ User ${userId} already registered with same socket ${socket.id}, skipping`);
                socket.emit('registration-confirmed', { userId, socketId: socket.id });
                return;
            }

            if (existingUser && existingUser.socketId !== socket.id) {
                const oldSocket = io.sockets.sockets.get(existingUser.socketId);
                if (oldSocket) {
                    if (existingUser.currentRoom) {
                        oldSocket.leave(existingUser.currentRoom);
                        oldSocket.to(existingUser.currentRoom).emit('peer-left', { socketId: oldSocket.id });
                    }
                    oldSocket.disconnect(true);
                }
                socketUserMap.delete(existingUser.socketId);
                console.log(`[SERVER] 🔄 Removed old socket mapping for user ${userId}`);
            }

            userSocketMap.set(userId, { socketId: socket.id, userId });
            socketUserMap.set(socket.id, userId);
            console.log(`[SERVER] ✅ User ${userId} registered with socket ${socket.id}`);

            socket.emit('registration-confirmed', { userId, socketId: socket.id });
        });


        // --- Call Initiation ---
        socket.on('initiate-call', (data: { targetUserId: string, adminId: string, roomId: string, callerName: string }) => {
            console.log(`[SERVER] ➡️ Initiating call from ${data.adminId} to ${data.targetUserId} in room ${data.roomId}`);

            const studentConnection = userSocketMap.get(data.targetUserId);
            const adminConnection = userSocketMap.get(data.adminId);

            if (studentConnection && io.sockets.sockets.get(studentConnection.socketId)) {
                console.log(`[SERVER] ➡️ Sending 'incoming-call' to student ${data.targetUserId} (socket: ${studentConnection.socketId})`);
                io.to(studentConnection.socketId).emit('incoming-call', {
                    roomId: data.roomId,
                    callerName: data.callerName,
                    adminId: data.adminId
                });

                if (adminConnection) {
                    io.to(adminConnection.socketId).emit('call-status', {
                        studentId: data.targetUserId,
                        status: 'ringing'
                    });
                }
            } else {
                console.log(`[SERVER] ❌ Student ${data.targetUserId} is offline or socket not found.`);
                if (adminConnection) {
                    io.to(adminConnection.socketId).emit('call-status', {
                        studentId: data.targetUserId,
                        status: 'offline'
                    });
                }
            }
        });

        // --- Call Response Handling ---
        socket.on('call-accepted', (data: { adminId: string, roomId: string, studentId?: string }) => {
            const adminConnection = userSocketMap.get(data.adminId);
            if (adminConnection && io.sockets.sockets.get(adminConnection.socketId)) {
                console.log(`[SERVER] ➡️ Student accepted call. Notifying admin ${data.adminId}`);
                io.to(adminConnection.socketId).emit('call-accepted-by-student', {
                    roomId: data.roomId,
                    studentId: data.studentId
                });
            }
        });

        socket.on('call-rejected', (data: { adminId: string, studentId?: string }) => {
            const adminConnection = userSocketMap.get(data.adminId);
            if (adminConnection && io.sockets.sockets.get(adminConnection.socketId)) {
                console.log(`[SERVER] ➡️ Student rejected call. Notifying admin ${data.adminId}`);
                io.to(adminConnection.socketId).emit('call-status', {
                    studentId: data.studentId || 'unknown',
                    status: 'rejected'
                });
            }
        });

        interface RoomState {
            id: string;
            participants: Set<string>;
            createdAt: Date;
            adminId?: string;
            studentId?: string;
        }

        const activeRooms = new Map<string, RoomState>();

        // When creating a room (on call initiation):
        socket.on('create-room', ({ roomId, adminId, studentId }) => {
            if (!activeRooms.has(roomId)) {
                activeRooms.set(roomId, {
                    id: roomId,
                    participants: new Set(),
                    createdAt: new Date(),
                    adminId,
                    studentId
                });
                console.log(`[SERVER] Room ${roomId} created`);
            }
        });

        // --- Room Management ---
        socket.on('join-room', async (roomId: string) => {
            try {
                const userId = socketUserMap.get(socket.id);

                // Check if already in this room
                if (socket.rooms.has(roomId)) {
                    console.log(`[SERVER] ⚠️ Client ${socket.id} already in room ${roomId}, skipping duplicate join`);

                    // Still send confirmation back
                    const room = io.sockets.adapter.rooms.get(roomId);
                    socket.emit('room-joined', {
                        roomId,
                        participants: room ? room.size : 1
                    });
                    return;
                }

                // Leave any other rooms first
                if (userId) {
                    const userConnection = userSocketMap.get(userId);
                    if (userConnection?.currentRoom && userConnection.currentRoom !== roomId) {
                        socket.leave(userConnection.currentRoom);
                        socket.to(userConnection.currentRoom).emit('peer-left', { socketId: socket.id });
                        console.log(`[SERVER] ➡️ Client ${socket.id} left previous room ${userConnection.currentRoom}`);
                    }
                    // Update current room
                    userConnection!.currentRoom = roomId;
                }

                // Join the new room
                await socket.join(roomId);

                // Get room info after joining
                const room = io.sockets.adapter.rooms.get(roomId);
                const participants = room ? room.size : 0;

                console.log(`[SERVER] ✅ Client ${socket.id} joined room ${roomId} (${participants} participants)`);

                // Send confirmation to the joiner
                socket.emit('room-joined', { roomId, participants });

                // Notify others in the room about new peer
                socket.to(roomId).emit('peer-joined', { socketId: socket.id });

            } catch (error: any) {
                console.error(`[SERVER] ❌ Error joining room ${roomId}:`, error);
                socket.emit('room-join-error', {
                    roomId,
                    error: error.message || 'Failed to join room'
                });
            }
        });

        socket.on('leave-room', (roomId: string) => {
            socket.leave(roomId);
            console.log(`[SERVER] ➡️ Client ${socket.id} left room ${roomId}`);

            // Update user's current room
            const userId = socketUserMap.get(socket.id);
            if (userId) {
                const userConnection = userSocketMap.get(userId);
                if (userConnection) {
                    userConnection.currentRoom = undefined;
                }
            }

            socket.to(roomId).emit('peer-left', { socketId: socket.id });
        });

        // --- Peer Ready Signal ---
        socket.on('peer-ready', (data: { roomId: string, userId: string }) => {
    console.log(`[SERVER] ➡️ Peer ready signal from user ${data.userId} (socket ${socket.id}) in room ${data.roomId}`);
    
    // First, check if the socket is actually in the room
    if (!socket.rooms.has(data.roomId)) {
        console.error(`[SERVER] ❌ Socket ${socket.id} is NOT in room ${data.roomId}!`);
        console.log(`[SERVER] Socket ${socket.id} is in rooms:`, Array.from(socket.rooms));
        
        // Try to fix by joining the room
        socket.join(data.roomId);
        console.log(`[SERVER] 🔧 Force-joined socket ${socket.id} to room ${data.roomId}`);
    }
    
    // Get room info
    const room = io.sockets.adapter.rooms.get(data.roomId);
    if (!room) {
        console.error(`[SERVER] ❌ Room ${data.roomId} doesn't exist!`);
        return;
    }
    
    const participants = room.size;
    console.log(`[SERVER] Room ${data.roomId} has ${participants} participants:`, Array.from(room));
    
    // CRITICAL FIX: Use io.to() instead of socket.to() to ensure broadcast
    // socket.to() excludes the sender, but we want ALL other sockets in the room
    const roomSockets = Array.from(room);
    
    roomSockets.forEach(targetSocketId => {
        if (targetSocketId !== socket.id) {
            console.log(`[SERVER] ✉️ Sending peer-ready from ${socket.id} to ${targetSocketId}`);
            io.to(targetSocketId).emit('peer-ready', {
                userId: data.userId,
                socketId: socket.id,
                participants: participants
            });
        }
    });
    
    // Also try the standard broadcast (as backup)
    socket.to(data.roomId).emit('peer-ready', {
        userId: data.userId,
        socketId: socket.id,
        participants: participants
    });
});

socket.on('debug-room-state', ({ roomId }: { roomId: string }) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const inRoom = socket.rooms.has(roomId);
    
    socket.emit('debug-room-response', {
        roomId,
        yourSocketId: socket.id,
        youAreInRoom: inRoom,
        roomExists: !!room,
        roomParticipants: room ? Array.from(room) : [],
        yourRooms: Array.from(socket.rooms)
    });
});

socket.on('request-peer-ready-status', ({ roomId }: { roomId: string }) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room) return;
    
    // Find other ready peers in the room
    room.forEach(socketId => {
        if (socketId !== socket.id) {
            const userId = socketUserMap.get(socketId);
            if (userId) {
                // Re-send peer-ready to the requesting socket
                socket.emit('peer-ready', {
                    userId: userId,
                    socketId: socketId
                });
            }
        }
    });
});

        socket.on('check-room-status', ({ roomId }: { roomId: string }, callback: (inRoom: boolean) => void) => {
            const inRoom = socket.rooms.has(roomId);
            console.log(`[SERVER] Socket ${socket.id} checking room ${roomId} status: ${inRoom}`);
            callback(inRoom);
        });
        // --- WebRTC Signaling ---
        socket.on('webrtc-offer', (data: { roomId: string, offer: RTCSessionDescriptionInit }) => {
            console.log(`[SERVER] ➡️ Relaying OFFER from ${socket.id} to room ${data.roomId}`);
            // Validate the sender is in the room
            if (!socket.rooms.has(data.roomId)) {
                console.error(`[SERVER] ❌ Socket ${socket.id} tried to send offer to room ${data.roomId} but is not in it`);
                return;
            }
            socket.to(data.roomId).emit('webrtc-offer', {
                offer: data.offer,
                fromSocketId: socket.id
            });
        });

        socket.on('webrtc-answer', (data: { roomId: string, answer: RTCSessionDescriptionInit }) => {
            console.log(`[SERVER] ➡️ Relaying ANSWER from ${socket.id} to room ${data.roomId}`);
            if (!socket.rooms.has(data.roomId)) {
                console.error(`[SERVER] ❌ Socket ${socket.id} tried to send answer to room ${data.roomId} but is not in it`);
                return;
            }
            socket.to(data.roomId).emit('webrtc-answer', {
                answer: data.answer,
                fromSocketId: socket.id
            });
        });

        socket.on('webrtc-ice-candidate', (data: { roomId: string, candidate: RTCIceCandidate }) => {
            if (!socket.rooms.has(data.roomId)) {
                console.error(`[SERVER] ❌ Socket ${socket.id} tried to send ICE candidate to room ${data.roomId} but is not in it`);
                return;
            }
            socket.to(data.roomId).emit('webrtc-ice-candidate', {
                candidate: data.candidate,
                fromSocketId: socket.id
            });
        });

        // --- Call Termination ---
        socket.on('hang-up', (data: { roomId: string }) => {
            console.log(`[SERVER] ➡️ Relaying HANG UP from ${socket.id} to room ${data.roomId}`);
            socket.to(data.roomId).emit('call-ended', { fromSocketId: socket.id });

            // Remove socket from room
            socket.leave(data.roomId);

            // Update user's room info
            const userId = socketUserMap.get(socket.id);
            if (userId) {
                const userConnection = userSocketMap.get(userId);
                if (userConnection) {
                    userConnection.currentRoom = undefined;
                }
            }
        });

        // --- Connection Cleanup ---
        socket.on('disconnect', (reason) => {
            console.log(`[SERVER] ❌ Client Disconnected: ${socket.id}, Reason: ${reason}`);

            // Find and remove user from socket map
            const userId = socketUserMap.get(socket.id);
            if (userId) {
                const userConnection = userSocketMap.get(userId);
                const wasInRoom = userConnection?.currentRoom;

                userSocketMap.delete(userId);
                socketUserMap.delete(socket.id);
                console.log(`[SERVER] 🧹 User ${userId} unregistered due to disconnect`);

                // Notify room members if user was in a call
                if (wasInRoom) {
                    socket.to(wasInRoom).emit('peer-left', { socketId: socket.id });

                    // Notify others about disconnection
                    io.to(wasInRoom).emit('peer-disconnected', {
                        userId,
                        socketId: socket.id
                    });
                }
            }
        });

        // --- Error Handling ---
        socket.on('error', (error) => {
            console.error(`[SERVER] ❌ Socket error for ${socket.id}:`, error);
        });
    });

    const port = process.env.PORT || 3000;
    httpServer.listen(port, () => {
        console.log(`> Server ready on http://localhost:${port}`);
        console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`> Socket.IO path: /api/socket`);
    });
}).catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});