// FILE: app/[role]/video/[roomId]/page.tsx

"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Pusher from 'pusher-js';
import { FiCameraOff, FiMic, FiMicOff, FiVideo, FiVideoOff, FiAlertTriangle, FiPhoneOff, FiXCircle, FiLoader, FiMonitor, FiAirplay } from 'react-icons/fi';

// ICE Servers configuration
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

// Helper functions
const getMediaStreamWithFallback = async () => {
    try {
        return await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
    } catch (error: any) {
        console.error('Error accessing media devices:', error);
        // Try audio only if video fails
        try {
            return await navigator.mediaDevices.getUserMedia({ 
                video: false, 
                audio: true 
            });
        } catch (audioError) {
            console.error('Error accessing audio:', audioError);
            throw audioError;
        }
    }
};

// Sub-components
const VideoPlaceholder = ({ text, isError = false }: { text: string, isError?: boolean }) => (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3">
        {isError ? <FiAlertTriangle className="text-red-500" size={32} /> : <FiLoader className="animate-spin" size={32} />}
        <span className={`text-lg font-medium mt-2 text-center ${isError ? 'text-red-500' : ''}`}>{text}</span>
    </div>
);

const ControlButton = ({ icon, offIcon, isToggled, onToggle, activeClass = 'bg-cyan-500/80', disabled = false, title = '' }: { 
    icon: React.ReactElement; 
    offIcon?: React.ReactElement; 
    isToggled: boolean; 
    onToggle: () => void; 
    activeClass?: string;
    disabled?: boolean;
    title?: string;
}) => (
    <button 
        onClick={onToggle} 
        disabled={disabled}
        title={title}
        className={`p-4 rounded-full transition-colors ${
            disabled 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                : (isToggled ? activeClass + ' text-white' : 'bg-slate-700/80 text-white hover:bg-slate-600')
        }`}
    >
        {isToggled ? (offIcon || icon) : icon}
    </button>
);

export default function VideoRoomPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const { roomId, role } = useParams() as { roomId: string; role: string };

    // Refs for video elements
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoPiPRef = useRef<HTMLVideoElement>(null);

    // WebRTC refs
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const localScreenStreamRef = useRef<MediaStream | null>(null);
    const videoSenderRef = useRef<RTCRtpSender | null>(null);
    const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);
    
    // Pusher refs
    const pusherRef = useRef<Pusher | null>(null);
    const roomChannelRef = useRef<any>(null);
    const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // State
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isCallEnded, setIsCallEnded] = useState(false);
    const [remoteCameraStream, setRemoteCameraStream] = useState<MediaStream | null>(null);
    const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [primaryView, setPrimaryView] = useState<'camera' | 'screen'>('camera');
    const [isScreenShareSupported, setIsScreenShareSupported] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Inicjowanie...');
    const [hasMediaError, setHasMediaError] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [peerJoined, setPeerJoined] = useState(false);

    // Check screen share support
    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
            setIsScreenShareSupported(true);
        }
    }, []);

    // Validate role
    useEffect(() => {
        if (role !== 'admin' && role !== 'student') {
            router.push('/');
            return;
        }
        
        if (session?.user?.role) {
            const expectedRole = session.user.role === 'ADMIN' ? 'admin' : 'student';
            if (role !== expectedRole) {
                router.push('/');
            }
        }
    }, [role, session, router]);

    // Hang up handler
    const handleHangUp = useCallback(async () => {
        if (isCallEnded) return;
        setIsCallEnded(true);
        
        // Clear any connection timeout
        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
        }
        
        // Notify other peer via Pusher
        if (roomChannelRef.current) {
            await fetch('/api/room/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, event: 'hang-up' })
            });
        }
        
        // Clean up streams
        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localScreenStreamRef.current?.getTracks().forEach(track => track.stop());
        peerConnectionRef.current?.close();
        
        // Disconnect Pusher
        if (roomChannelRef.current) {
            roomChannelRef.current.unbind_all();
            roomChannelRef.current.unsubscribe();
        }
        if (pusherRef.current) {
            pusherRef.current.disconnect();
        }
        
        // Redirect after delay
        setTimeout(() => {
            const redirectUrl = role === 'admin' ? '/admin' : '/moje-terminy';
            router.push(redirectUrl);
        }, 2000);
    }, [roomId, role, router, isCallEnded]);

    // Media controls
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, []);

    const toggleCamera = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOff(!videoTrack.enabled);
            }
        }
    }, []);

    // Screen sharing
    const stopScreenShare = useCallback(() => {
        if (!videoSenderRef.current || !localStreamRef.current) return;
        localScreenStreamRef.current?.getTracks().forEach(track => track.stop());
        localScreenStreamRef.current = null;
        const cameraTrack = localStreamRef.current.getVideoTracks()[0];
        if (cameraTrack && videoSenderRef.current) {
            videoSenderRef.current.replaceTrack(cameraTrack);
        }
        setIsSharingScreen(false);
    }, []);

    const handleToggleScreenShare = useCallback(async () => {
        if (isSharingScreen) {
            stopScreenShare();
        } else {
            if (!peerConnectionRef.current || !videoSenderRef.current) return;
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                localScreenStreamRef.current = screenStream;
                const screenTrack = screenStream.getVideoTracks()[0];
                screenTrack.onended = () => stopScreenShare();
                await videoSenderRef.current.replaceTrack(screenTrack);
                setIsSharingScreen(true);
            } catch (error) {
                console.error("Error starting screen share:", error);
                setIsSharingScreen(false);
            }
        }
    }, [isSharingScreen, stopScreenShare]);

    const handleSwapViews = () => {
        if (remoteScreenStream) {
            setPrimaryView(prev => prev === 'camera' ? 'screen' : 'camera');
        }
    };

    // Send WebRTC signaling data via Pusher
    const sendSignal = useCallback(async (type: string, data: any) => {
        try {
            console.log(`Sending ${type} signal`);
            await fetch('/api/room/signal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, type, data })
            });
        } catch (error) {
            console.error(`Error sending ${type}:`, error);
        }
    }, [roomId]);

    // Main WebRTC setup
    useEffect(() => {
        if (sessionStatus !== 'authenticated' || !roomId || !session?.user) return;

        console.log('Setting up WebRTC connection...');
        
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;
        const isInitiator = session.user.role === 'ADMIN';

        // Initialize Pusher
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
            authEndpoint: '/api/pusher/auth'
        });
        pusherRef.current = pusher;

        // Subscribe to room channel
        const roomChannel = pusher.subscribe(`private-room-${roomId}`);
        roomChannelRef.current = roomChannel;

        // Connection state handlers
        const updateConnectionState = () => {
            if (!pc) return;
            
            const state = pc.connectionState;
            const iceState = pc.iceConnectionState;
            
            console.log('Connection state:', state, 'ICE state:', iceState);
            
            if (state === 'connected' || iceState === 'connected' || iceState === 'completed') {
                setConnectionStatus('Połączono');
                setIsConnected(true);
                // Clear connection timeout when connected
                if (connectionTimeoutRef.current) {
                    clearTimeout(connectionTimeoutRef.current);
                }
            } else if (state === 'connecting' || iceState === 'checking') {
                setConnectionStatus('Łączenie...');
            } else if (state === 'failed' || iceState === 'failed') {
                setConnectionStatus('Połączenie nieudane');
                setHasMediaError(true);
            } else if (state === 'disconnected' || iceState === 'disconnected') {
                setConnectionStatus('Rozłączono');
                if (isConnected) {
                    handleHangUp();
                }
            }
        };

        pc.onconnectionstatechange = updateConnectionState;
        pc.oniceconnectionstatechange = updateConnectionState;

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Sending ICE candidate');
                sendSignal('ice-candidate', event.candidate);
            }
        };

        pc.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind);
            const stream = event.streams[0];
            if (!stream) return;
            
            const isScreen = event.track.id.includes('screen') || 
                           (event.track.getSettings && event.track.getSettings().displaySurface);
            
            if (isScreen) {
                setRemoteScreenStream(stream);
                setPrimaryView('screen');
            } else {
                setRemoteCameraStream(stream);
                // When we receive the first video track, we're connected
                if (!isConnected) {
                    setIsConnected(true);
                    setConnectionStatus('Połączono');
                }
            }
        };

        // Pusher event handlers
        const handlePeerJoined = async ({ userId }: { userId: string }) => {
            console.log('Peer joined:', userId);
            setPeerJoined(true);
            
            if (isInitiator) {
                // Create and send offer
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    sendSignal('offer', offer);
                } catch (error) {
                    console.error('Error creating offer:', error);
                }
            }
        };

        const handleOffer = async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
            console.log('Received offer');
            if (!isInitiator) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(offer));
                    
                    // Process any pending ICE candidates
                    pendingCandidatesRef.current.forEach(candidate => {
                        pc.addIceCandidate(candidate).catch(console.error);
                    });
                    pendingCandidatesRef.current = [];
                    
                    // Create and send answer
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    sendSignal('answer', answer);
                } catch (error) {
                    console.error('Error handling offer:', error);
                }
            }
        };

        const handleAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
            console.log('Received answer');
            if (isInitiator) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    
                    // Process any pending ICE candidates
                    pendingCandidatesRef.current.forEach(candidate => {
                        pc.addIceCandidate(candidate).catch(console.error);
                    });
                    pendingCandidatesRef.current = [];
                } catch (error) {
                    console.error('Error handling answer:', error);
                }
            }
        };

        const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
            console.log('Received ICE candidate');
            try {
                if (pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } else {
                    // Queue candidates if remote description not set yet
                    pendingCandidatesRef.current.push(new RTCIceCandidate(candidate));
                }
            } catch (error) {
                console.error('Error adding ICE candidate:', error);
            }
        };

        const handleCallEnded = () => {
            console.log('Call ended by peer');
            handleHangUp();
        };

        // Bind Pusher events
        roomChannel.bind('peer-joined', handlePeerJoined);
        roomChannel.bind('webrtc-offer', handleOffer);
        roomChannel.bind('webrtc-answer', handleAnswer);
        roomChannel.bind('webrtc-ice-candidate', handleIceCandidate);
        roomChannel.bind('call-ended', handleCallEnded);

        // Initialize call
        const initializeCall = async () => {
            try {
                // Get user media
                const stream = await getMediaStreamWithFallback();
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                
                // Add tracks to peer connection
                stream.getTracks().forEach(track => {
                    const sender = pc.addTrack(track, stream);
                    if (track.kind === 'video') {
                        videoSenderRef.current = sender;
                    }
                });
                
                // Notify that we joined
                await fetch('/api/room/join', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomId })
                });
                
                // Set connection timeout (30 seconds)
                connectionTimeoutRef.current = setTimeout(() => {
                    if (!isConnected && !isCallEnded) {
                        console.error('Connection timeout');
                        setConnectionStatus('Przekroczono limit czasu');
                        setHasMediaError(true);
                        setTimeout(() => handleHangUp(), 3000);
                    }
                }, 30000);
                
            } catch (error: any) {
                console.error('Error initializing call:', error);
                setConnectionStatus('Błąd dostępu do kamery/mikrofonu');
                setHasMediaError(true);
            }
        };

        initializeCall();

        // Cleanup
        return () => {
            console.log('Cleaning up WebRTC connection');
            
            if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
            }
            
            // Unbind all events
            roomChannel.unbind('peer-joined', handlePeerJoined);
            roomChannel.unbind('webrtc-offer', handleOffer);
            roomChannel.unbind('webrtc-answer', handleAnswer);
            roomChannel.unbind('webrtc-ice-candidate', handleIceCandidate);
            roomChannel.unbind('call-ended', handleCallEnded);
            
            // Unsubscribe and disconnect
            roomChannel.unsubscribe();
            pusher.disconnect();
            
            // Close peer connection
            if (pc) {
                pc.onicecandidate = null;
                pc.ontrack = null;
                pc.onconnectionstatechange = null;
                pc.oniceconnectionstatechange = null;
                pc.close();
            }
            
            // Stop media tracks
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (localScreenStreamRef.current) {
                localScreenStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [roomId, sessionStatus, session, sendSignal, handleHangUp, isConnected, isCallEnded, role]);

    // Update video elements when streams change
    const mainStream = primaryView === 'screen' ? remoteScreenStream : remoteCameraStream;
    const pipStream = primaryView === 'screen' ? remoteCameraStream : remoteScreenStream;

    useEffect(() => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = mainStream;
        }
    }, [mainStream]);
    
    useEffect(() => {
        if (remoteVideoPiPRef.current) {
            remoteVideoPiPRef.current.srcObject = pipStream;
        }
    }, [pipStream]);
    
    // Loading state
    if (sessionStatus === 'loading') {
        return (
            <div className="w-full h-screen bg-slate-900 flex items-center justify-center">
                <FiLoader className="animate-spin text-white" size={48}/>
            </div>
        );
    }
    
    return (
        <div className="relative w-full h-screen bg-slate-900 text-white flex flex-col items-center justify-center overflow-hidden">
            {/* Connection status */}
            <AnimatePresence>
                {!isConnected && !isCallEnded && (
                    <motion.div 
                        initial={{opacity:0}} 
                        animate={{opacity:1}} 
                        exit={{opacity:0}} 
                        className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800/80 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-3"
                    >
                        {!hasMediaError && <FiLoader className="animate-spin text-cyan-400"/>}
                        <span className={`text-slate-300 ${hasMediaError ? 'text-red-400' : ''}`}>
                            {connectionStatus}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Remote video (main view) */}
            <div 
                onClick={handleSwapViews} 
                className={`w-full h-full flex items-center justify-center bg-black ${remoteScreenStream ? 'cursor-pointer' : ''}`}
            >
                <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-contain" 
                />
                {!mainStream && !isCallEnded && !isConnected && (
                    <VideoPlaceholder text={connectionStatus} isError={hasMediaError} />
                )}
            </div>

            {/* Picture-in-Picture for screen share */}
            <AnimatePresence>
                {pipStream && (
                    <motion.div 
                        onClick={handleSwapViews}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        drag
                        dragConstraints={{ 
                            left: 0, 
                            right: window.innerWidth - 256, 
                            top: 0, 
                            bottom: window.innerHeight - 144 
                        }}
                        className="absolute bottom-28 right-5 w-64 h-40 cursor-pointer z-20"
                    >
                        <video 
                            ref={remoteVideoPiPRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover rounded-xl shadow-2xl border-2 border-white/20" 
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Local video */}
            <motion.div 
                drag 
                dragConstraints={{ 
                    top: 20, 
                    left: 20, 
                    right: window.innerWidth - 270, 
                    bottom: window.innerHeight - 200 
                }} 
                className="absolute top-5 left-5 w-64 h-40 cursor-grab active:cursor-grabbing z-30"
            >
                <div className="w-full h-full object-cover rounded-xl shadow-2xl border-2 border-white/20 bg-black flex items-center justify-center">
                    <video 
                        ref={localVideoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className={`w-full h-full object-cover rounded-xl ${hasMediaError ? 'hidden' : 'block'}`} 
                    />
                    {hasMediaError && <FiCameraOff size={32} className="text-slate-500"/>}
                </div>
                {isCameraOff && !hasMediaError && (
                    <div className="absolute inset-0 bg-slate-800/70 rounded-xl flex items-center justify-center">
                        <FiCameraOff size={32} />
                    </div>
                )}
            </motion.div>

            {/* Control bar */}
            <motion.div 
                initial={{y: 100}} 
                animate={{y: 0}} 
                className="absolute bottom-5 p-3 bg-slate-800/50 backdrop-blur-lg border border-white/10 rounded-full flex items-center gap-4 z-40"
            >
                <ControlButton 
                    icon={<FiMic size={24}/>} 
                    offIcon={<FiMicOff size={24}/>} 
                    isToggled={isMuted} 
                    onToggle={toggleMute} 
                />
                <ControlButton 
                    icon={<FiVideo size={24}/>} 
                    offIcon={<FiVideoOff size={24}/>} 
                    isToggled={isCameraOff} 
                    onToggle={toggleCamera} 
                />
                <ControlButton 
                    icon={<FiMonitor size={24}/>} 
                    offIcon={<FiAirplay size={24}/>} 
                    isToggled={isSharingScreen} 
                    onToggle={handleToggleScreenShare} 
                    activeClass="bg-blue-500/80"
                    disabled={!isScreenShareSupported}
                    title={isScreenShareSupported ? "Share Screen" : "Screen sharing not supported"}
                />
                <div className="w-px h-8 bg-slate-600" />
                <button 
                    onClick={handleHangUp} 
                    className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                    <FiPhoneOff size={24} />
                </button>
            </motion.div>

            {/* Call ended overlay */}
            <AnimatePresence>
                {isCallEnded && (
                    <motion.div 
                        initial={{opacity: 0}} 
                        animate={{opacity: 1}} 
                        className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50"
                    >
                        <FiXCircle className="w-24 h-24 text-red-500 mb-4" />
                        <h2 className="text-4xl font-bold">Rozmowa zakończona</h2>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}