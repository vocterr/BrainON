// CallNotification.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FiPhone, FiPhoneOff, FiPhoneIncoming } from 'react-icons/fi';

interface IncomingCallData {
    roomId: string;
    callerName: string;
    adminId: string;
}

export default function CallNotification() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const { socket, isConnected } = useSocket();
    const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);

    // Initialize ringtone (no changes here)
    useEffect(() => {
        ringtoneRef.current = new Audio('/sounds/ringtone.mp3'); 
        ringtoneRef.current.loop = true;
    }, []);

    // Play/stop ringtone (no changes here)
    useEffect(() => {
        if (incomingCall && ringtoneRef.current) {
            ringtoneRef.current.play().catch(e => console.log("Audio play failed:", e));
        } else if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
    }, [incomingCall]);

    // This useEffect now ONLY manages socket event listeners
    useEffect(() => {
        // We only want students to listen for incoming calls
        if (sessionStatus !== 'authenticated' || !session?.user?.id || session.user.role === 'ADMIN') {
            return;
        }

        const handleIncomingCall = (data: IncomingCallData) => {
            console.log("Incoming call from:", data.callerName);
            setIncomingCall(data);

            // Auto-reject after 30 seconds
            setTimeout(() => {
                // Use a functional state update to get the latest state
                setIncomingCall(currentCall => {
                    if (currentCall?.roomId === data.roomId) {
                        rejectCall(data); // Pass data directly to rejectCall
                        return null;
                    }
                    return currentCall;
                });
            }, 30000);
        };


        socket.on('incoming-call', handleIncomingCall);

        return () => {
            socket.off('incoming-call', handleIncomingCall);
        };
    // The rejectCall function is now inside the effect's scope or passed as a dependency
    }, [socket, sessionStatus, session?.user?.id, session?.user?.role]);

    // CallNotification.tsx - Updated acceptCall function
const acceptCall = useCallback(() => {
    if (incomingCall && socket.connected) {
        const { roomId, adminId } = incomingCall;
        
        // Clear incoming call state
        setIncomingCall(null);
        
        // Navigate immediately - this speeds up the student side
        router.push(`/rozmowa/${roomId}`);
        
        // Notify admin after navigation starts (not blocking)
        socket.emit('call-accepted', {
            adminId: adminId,
            roomId: roomId,
            studentId: session?.user?.id
        });
    }
}, [incomingCall, socket, router, session?.user?.id]);

    const rejectCall = useCallback((callToReject?: IncomingCallData) => {
        const callData = callToReject || incomingCall;
        if (callData && socket.connected) {
            socket.emit('call-rejected', {
                adminId: callData.adminId,
                studentId: session?.user?.id
            });
        }
        setIncomingCall(null);
    }, [incomingCall, socket, session?.user?.id]);

    return (
        <AnimatePresence>
            {incomingCall && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 20, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="fixed top-5 right-5 z-[9999] w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl border border-purple-500/30"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 animate-pulse" />
                    <div className="relative p-5">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                                    <FiPhoneIncoming className="text-white w-7 h-7 animate-bounce" />
                                </div>
                                <div className="absolute -inset-1 bg-purple-500 rounded-full animate-ping opacity-75" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-bold text-lg">{incomingCall.callerName}</p>
                                <p className="text-slate-300 text-sm">Przychodzące połączenie wideo</p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={acceptCall}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
                            >
                                <FiPhone className="w-5 h-5" />
                                <span className="font-medium">Odbierz</span>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => rejectCall()}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all shadow-lg"
                            >
                                <FiPhoneOff className="w-5 h-5" />
                                <span className="font-medium">Odrzuć</span>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}