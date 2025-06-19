"use client";

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FiPhone } from 'react-icons/fi';

// Definiujemy typ danych, które przychodzą z serwera
interface IncomingCallData {
    roomId: string;
    callerName: string;
    adminId: string; // Potrzebujemy ID admina, aby odesłać odpowiedź
}

export default function CallNotification() {
    const { data: session } = useSession();
    const router = useRouter();
    const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
    const socketRef = useRef<Socket | null>(null);
    
    useEffect(() => {
        // Ustanawiamy połączenie Socket.IO tylko raz, gdy sesja użytkownika jest dostępna
        if (session?.user?.id && !socketRef.current) {
            const socket = io("http://localhost:3000");
            socketRef.current = socket;

            // 1. Rejestrujemy użytkownika na serwerze, aby serwer wiedział, komu wysyłać powiadomienia
            socket.emit('register-user', session.user.id);
            
            // 2. Nasłuchujemy na zdarzenie 'incoming-call' od serwera
            socket.on('incoming-call', (data: IncomingCallData) => {
                setIncomingCall(data);
            });

            // Sprzątamy po odmontowaniu komponentu
            return () => {
                socket.disconnect();
                socketRef.current = null;
            };
        }
    }, [session]);
    
    const acceptCall = () => {
        if (incomingCall) {
            // POPRAWKA: Używamy 'incomingCall.adminId', które otrzymaliśmy od serwera,
            // aby serwer wiedział, któremu adminowi wysłać potwierdzenie.
            socketRef.current?.emit('call-accepted', { 
                adminId: incomingCall.adminId, 
                roomId: incomingCall.roomId 
            });
            // Przekierowujemy ucznia do pokoju rozmowy
            router.push(`/rozmowa/${incomingCall.roomId}`);
            setIncomingCall(null); // Zamykamy powiadomienie
        }
    };

    const rejectCall = () => {
        // W przyszłości można tu wysłać sygnał o odrzuceniu
        setIncomingCall(null);
    };

    return (
        <AnimatePresence>
            {incomingCall && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 20, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="fixed top-5 right-5 z-[9999] w-full max-w-sm p-5 rounded-2xl bg-slate-800/80 backdrop-blur-lg shadow-2xl border border-purple-500/50 font-sans"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center animate-pulse">
                            <FiPhone className="text-white w-6 h-6"/>
                        </div>
                        <div>
                            <p className="text-white font-bold text-lg">{incomingCall.callerName} dzwoni...</p>
                            <p className="text-slate-300 text-sm">Chcesz dołączyć do lekcji?</p>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button onClick={acceptCall} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">Odbierz</button>
                        <button onClick={rejectCall} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Odrzuć</button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
