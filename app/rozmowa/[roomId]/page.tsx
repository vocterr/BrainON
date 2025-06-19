"use client";

import { JSX, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, FiPhoneOff, FiPhone } from 'react-icons/fi';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Załóżmy, że admin ma specjalną rolę
const IS_ADMIN = true; // Placeholder - w przyszłości odczytasz to z sesji

export default function RoomPage() {
    const params = useParams();
    const roomId = params.roomId as string;
    
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<Socket | null>(null);

    // Stany do zarządzania UI
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [callStarted, setCallStarted] = useState(!IS_ADMIN); // Uczeń od razu czeka na połączenie

    useEffect(() => {
        socketRef.current = io("http://localhost:3000");
        
        socketRef.current.emit('join-room', roomId);
        socketRef.current.on('webrtc-offer', handleOffer);
        socketRef.current.on('webrtc-answer', handleAnswer);
        socketRef.current.on('webrtc-ice-candidate', handleNewIceCandidate);

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                // Dalsza logika WebRTC...
            });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            if (peerConnectionRef.current) peerConnectionRef.current.close();
        };
    }, [roomId]);
    
    const handleOffer = async (offer: RTCSessionDescriptionInit) => { /* ... Logika ... */ };
    const handleAnswer = async (answer: RTCSessionDescriptionInit) => { /* ... Logika ... */ };
    const handleNewIceCandidate = async (candidate: RTCIceCandidateInit) => { /* ... Logika ... */ };

    const startCall = async () => {
        setCallStarted(true);
        peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);
        const stream = localVideoRef.current?.srcObject as MediaStream;
        stream.getTracks().forEach(track => peerConnectionRef.current?.addTrack(track, stream));

        peerConnectionRef.current.ontrack = event => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };
        
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socketRef.current?.emit('webrtc-offer', { roomId, offer });
    };

    return (
        <div className="relative w-full h-screen bg-slate-900 text-white flex flex-col items-center justify-center overflow-hidden">
             {/* Tło Aurora Glow */}
            <div className="absolute inset-0 z-0 opacity-40">
                <motion.div animate={{ x: ['-5%', '5%', '-5%'], y: ['-10%', '10%', '-10%'] }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }} className="absolute top-[-50%] left-[-50%] w-[150vw] h-[150vw] bg-purple-600/50 rounded-full blur-3xl" />
                <motion.div animate={{ x: ['5%', '-5%', '5%'], y: ['10%', '-10%', '10%'] }} transition={{ duration: 90, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-50%] right-[-50%] w-[150vw] h-[150vw] bg-cyan-500/40 rounded-full blur-3xl" />
            </div>

            {/* Główny kontener wideo */}
            <div className="relative w-full h-full flex items-center justify-center">
                {/* Wideo rozmówcy (duże) */}
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover"/>
                
                {/* Twoje wideo (małe, w rogu) */}
                <motion.div 
                    drag 
                    dragConstraints={{ left: 0, right: window.innerWidth - 250, top: 0, bottom: window.innerHeight - 200 }}
                    className="absolute bottom-8 right-8 w-64 h-40 cursor-grab active:cursor-grabbing"
                >
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-2xl shadow-2xl border-2 border-white/10"/>
                </motion.div>
                
                {/* Panel startowy dla admina */}
                {!callStarted && IS_ADMIN && (
                     <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                        <motion.button 
                            onClick={startCall}
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            className="flex cursor-pointer items-center gap-4 px-8 py-4 rounded-full bg-green-500 text-white text-2xl font-chewy shadow-lg"
                        >
                            <FiPhone/>
                            <span>Rozpocznij Lekcję.</span>
                        </motion.button>
                    </div>
                )}
            </div>

            {/* Panel sterowania */}
            <motion.div 
                initial={{y: 100}}
                animate={{y: 0}}
                transition={{delay: 0.5, type: 'spring', stiffness: 100}}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 p-4 bg-slate-800/50 backdrop-blur-lg border border-white/10 rounded-full flex items-center gap-4"
            >
                <ControlButton icon={<FiMic/>} offIcon={<FiMicOff/>} isToggled={isMuted} onToggle={() => setIsMuted(p => !p)} />
                <ControlButton icon={<FiVideo/>} offIcon={<FiVideoOff/>} isToggled={isCameraOff} onToggle={() => setIsCameraOff(p => !p)} />
                <ControlButton icon={<FiMonitor/>} isToggled={isSharingScreen} onToggle={() => setIsSharingScreen(p => !p)} />

                <div className="w-px h-8 bg-slate-600 mx-2"/>

                <button className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors">
                    <FiPhoneOff size={24}/>
                </button>
            </motion.div>
        </div>
    );
}

// Sub-komponent dla przycisków sterujących
const ControlButton = ({ icon, offIcon, isToggled, onToggle }: {
    icon: JSX.Element;
    offIcon?: JSX.Element;
    isToggled: boolean;
    onToggle: () => void;
}) => {
    return (
        <button 
            onClick={onToggle} 
            className={`p-4 rounded-full cursor-pointer transition-colors ${isToggled ? 'bg-red-500/80 text-white' : 'bg-slate-700/80 text-white hover:bg-slate-600'}`}
        >
            {isToggled ? (offIcon || icon) : icon}
        </button>
    )
}

