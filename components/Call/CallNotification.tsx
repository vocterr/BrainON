// FILE: components/CallNotification.tsx

"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePusher } from '@/lib/usePusher';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FiPhone, FiPhoneOff, FiPhoneIncoming } from 'react-icons/fi';

export default function CallNotification() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const { incomingCall, respondToCall } = usePusher();
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);

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

    // Guard clause: Only authenticated students should see notifications
    if (sessionStatus !== 'authenticated' || !session?.user?.id || session.user.role === 'ADMIN') {
        return null;
    }

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
                                 onClick={() => respondToCall('accept', incomingCall.roomId, incomingCall.adminId)}
                                 className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl"
                             >
                                 <FiPhone className="w-5 h-5" />
                                 <span className="font-medium">Odbierz</span>
                             </motion.button>
                             <motion.button
                                 whileHover={{ scale: 1.05 }}
                                 whileTap={{ scale: 0.95 }}
                                 onClick={() => respondToCall('reject', incomingCall.roomId, incomingCall.adminId)}
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