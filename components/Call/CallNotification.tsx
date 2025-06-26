// FILE: components/CallNotification.tsx

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
    const { socket } = useSocket();
    const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);

    // This ref will hold the ID of the auto-reject timeout
    const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize the ringtone audio object once on component mount
    useEffect(() => {
        ringtoneRef.current = new Audio('/sounds/ringtone.mp3'); 
        ringtoneRef.current.loop = true;
    }, []);

    // Effect to play or pause the ringtone when a call comes in or is dismissed
    useEffect(() => {
        if (incomingCall && ringtoneRef.current) {
            ringtoneRef.current.play().catch(e => console.log("Ringtone play failed:", e));
        } else if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
    }, [incomingCall]);

    // Wrapped in useCallback so it can be used in the useEffect dependency array
    const rejectCall = useCallback((callToReject?: IncomingCallData) => {
        const callData = callToReject || incomingCall;
        if (!callData) return;
        
        // Clear any existing auto-reject timeout
        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
        }
        
        console.log("[CallNotification] Rejecting call");
        socket.emit('call-rejected', { adminId: callData.adminId, studentId: session?.user?.id });

        setIncomingCall(null);
    }, [incomingCall, socket, session?.user?.id]);


    // The main effect to listen for incoming call notifications from the server
    useEffect(() => {
        // Guard clause: Only authenticated students should listen for calls.
        if (sessionStatus !== 'authenticated' || !session?.user?.id || session.user.role === 'ADMIN') {
            return;
        }

        // DEBUG: Confirm that this component is actively listening for the event.
        console.log(`[CallNotification] DEBUG: Component is mounted and listening for 'incoming-call' for user: [${session.user.id}]`);

        // This function will handle the 'incoming-call' event from the server
        const handleIncomingCall = (data: IncomingCallData) => {
            console.log("[CallNotification] DEBUG: SUCCESS! Received 'incoming-call' event with data:", data);
            
            // Set the state to show the notification UI
            setIncomingCall(data);

            // Set a 30-second timeout to automatically reject the call if the user doesn't respond.
            if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = setTimeout(() => {
                console.log("[CallNotification] Call timed out. Auto-rejecting.");
                rejectCall(data);
            }, 30000);
        };

        // Attach the event listener
        socket.on('incoming-call', handleIncomingCall);

        // Cleanup function: Remove the listener when the component unmounts
        return () => {
            socket.off('incoming-call', handleIncomingCall);
            // Also clear any active timeout on cleanup
            if (callTimeoutRef.current) {
                clearTimeout(callTimeoutRef.current);
            }
        };
    }, [socket, sessionStatus, session?.user?.id, session?.user?.role, rejectCall]);

    const acceptCall = useCallback(() => {
        if (!incomingCall) return;

        // Clear the auto-reject timeout since the user accepted
        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
        }

        const { roomId, adminId } = incomingCall;
        
        console.log("[CallNotification] Accepting call to room:", roomId);
        
        // Notify the server (and the admin) that the call was accepted
        socket.emit('call-accepted', { adminId, roomId, studentId: session?.user?.id });
        
        // Hide the notification UI
        setIncomingCall(null);
        
        // Navigate to the call room
        router.push(`/rozmowa/${roomId}`);
    }, [incomingCall, socket, router, session?.user?.id]);

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
                                 className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl"
                             >
                                 <FiPhone className="w-5 h-5" />
                                 <span className="font-medium">Odbierz</span>
                             </motion.button>
                             <motion.button
                                 whileHover={{ scale: 1.05 }}
                                 whileTap={{ scale: 0.95 }}
                                 onClick={() => rejectCall()}
                                 className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl"
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