import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import next from 'next';
import { parse } from 'url'; // KROK 1: Importujemy 'parse' z 'url'

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Mapa do przechowywania powiązania: userId -> socketId
const userSocketMap = new Map<string, string>();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // KROK 2: Używamy parsera z Next.js zamiast standardowego 'new URL()'
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*", // W produkcji warto ograniczyć do Twojej domeny
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Gdy użytkownik (admin lub uczeń) się łączy, zapisujemy jego ID
    socket.on('register-user', (userId: string) => {
        userSocketMap.set(userId, socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`);
        // Można wysłać potwierdzenie do klienta, jeśli to potrzebne
        // socket.emit('user-registered', { success: true });
    });

    // Gdy admin inicjuje rozmowę
    socket.on('initiate-call', (data: { targetUserId: string, adminId: string, roomId: string, callerName: string }) => {
        console.log('Received initiate-call:', data);
        const studentSocketId = userSocketMap.get(data.targetUserId);
        const adminSocketId = userSocketMap.get(data.adminId);

        if (studentSocketId) {
            // Wysyłamy powiadomienie do ucznia
            console.log(`Sending 'incoming-call' to student ${data.targetUserId} on socket ${studentSocketId}`);
            io.to(studentSocketId).emit('incoming-call', {
                roomId: data.roomId,
                callerName: data.callerName,
                adminId: data.adminId 
            });
            // Wysyłamy potwierdzenie do admina
            if (adminSocketId) {
                console.log(`Sending 'call-status: ringing' to admin ${data.adminId} on socket ${adminSocketId}`);
                io.to(adminSocketId).emit('call-status', { studentId: data.targetUserId, status: 'ringing' });
            }
        } else {
            // Jeśli uczeń jest offline, informujemy o tym admina
            if (adminSocketId) {
                console.log(`Student ${data.targetUserId} is offline. Notifying admin.`);
                io.to(adminSocketId).emit('call-status', { studentId: data.targetUserId, status: 'offline' });
            }
        }
    });
    
    // Gdy uczeń zaakceptuje rozmowę
    socket.on('call-accepted', (data: { adminId: string, roomId: string }) => {
        console.log('Received call-accepted:', data);
        const adminSocketId = userSocketMap.get(data.adminId);
        if (adminSocketId) {
            // Informujemy admina, że uczeń odebrał i może przekierować do pokoju
            console.log(`Notifying admin ${data.adminId} that call was accepted.`);
            io.to(adminSocketId).emit('call-accepted-by-student', { roomId: data.roomId });
        }
    });

    // Pozostała logika WebRTC
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined WebRTC room ${roomId}`);
    });
    socket.on('webrtc-offer', (data) => { socket.to(data.roomId).emit('webrtc-offer', data.offer); });
    socket.on('webrtc-answer', (data) => { socket.to(data.roomId).emit('webrtc-answer', data.answer); });
    socket.on('webrtc-ice-candidate', (data) => { socket.to(data.roomId).emit('webrtc-ice-candidate', data.candidate); });

    // Gdy użytkownik się rozłącza
    socket.on('disconnect', () => {
        for (const [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);
                console.log(`User ${userId} unregistered.`);
                break;
            }
        }
        console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  const port = process.env.PORT || 3000;
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
