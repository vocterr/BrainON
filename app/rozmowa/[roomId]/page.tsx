"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/contexts/SocketContext';
import { FiCameraOff, FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, FiPhoneOff, FiXCircle, FiLoader } from 'react-icons/fi';

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
    ]
};

const VideoPlaceholder = ({ text }: { text: string }) => (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3">
        <FiCameraOff size={48} />
        <span className="text-lg font-medium">{text}</span>
        <FiLoader className="animate-spin mt-2" size={24} />
    </div>
);

export default function RoomPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const params = useParams();
    const roomId = params.roomId as string;
    const { isConnected, socket } = useSocket();

    // Refs for stable references
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteCameraVideoRef = useRef<HTMLVideoElement>(null);
    const remoteScreenVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const localScreenStreamRef = useRef<MediaStream | null>(null);
    const screenTrackSenderRef = useRef<RTCRtpSender | null>(null);
    const isInitializedRef = useRef(false);
    const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);
    const isOfferCreatedRef = useRef(false);
    const hasJoinedRef = useRef(false);
    const isLeavingPageRef = useRef(false); // Track if we're actually leaving

    const [isLocalReady, setIsLocalReady] = useState(false);
    const [isPeerReady, setIsPeerReady] = useState(false);
    const [debugInfo, setDebugInfo] = useState({
        socketConnected: socket.connected,
        socketId: socket.id || '',
        roomJoined: false,
        localStreamActive: false,
        peerConnectionCreated: false,
        offerCreated: false,
        answerReceived: false,
        iceCandidatesCount: 0,
        remoteStreamReceived: false,
        connectionState: 'new',
        iceConnectionState: 'new',
        signalingState: 'stable',
        roomParticipants: 0,
        userRole: 'unknown'
    });
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [isCallEnded, setIsCallEnded] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [remoteCameraStream, setRemoteCameraStream] = useState<MediaStream | null>(null);
    const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);

    // Update debug info with user role
    useEffect(() => {
        if (session?.user?.role) {
            setDebugInfo(prev => ({ ...prev, userRole: session.user.role! }));
        }
    }, [session]);

    // Handle browser/tab close
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (socket.connected && hasJoinedRef.current && !isLeavingPageRef.current) {
                // Synchronously leave room when closing tab/browser
                socket.emit('leave-room', roomId);
                socket.emit('hang-up', { roomId });
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [roomId, socket]);

    // --- CLEANUP AND UTILITY FUNCTIONS ---
    const cleanupPeerConnection = useCallback(() => {
        console.log("🧹 Cleaning up peer connection...");
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setRemoteCameraStream(null);
        setRemoteScreenStream(null);
        pendingCandidatesRef.current = [];
        isOfferCreatedRef.current = false;
        setDebugInfo(prev => ({
            ...prev,
            peerConnectionCreated: false,
            remoteStreamReceived: false,
            connectionState: 'closed',
            offerCreated: false
        }));
    }, []);

    const cleanupLocalStreams = useCallback(() => {
        console.log("🧹 Cleaning up local streams...");
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (localScreenStreamRef.current) {
            localScreenStreamRef.current.getTracks().forEach(track => track.stop());
            localScreenStreamRef.current = null;
        }
        setDebugInfo(prev => ({ ...prev, localStreamActive: false }));
    }, []);

    const handleHangUp = useCallback(() => {
        console.log("📞 Hanging up call...");
        isLeavingPageRef.current = true; // Mark that we're intentionally leaving

        if (socket.connected) {
            socket.emit('hang-up', { roomId });
            socket.emit('leave-room', roomId);
        }
        cleanupLocalStreams();
        cleanupPeerConnection();
        setIsCallEnded(true);
        setTimeout(() => {
            const redirectUrl = session?.user?.role === 'ADMIN' ? '/admin' : '/moje-terminy';
            router.push(redirectUrl);
        }, 2000);
    }, [roomId, router, session, cleanupLocalStreams, cleanupPeerConnection, socket]);

    // --- WEBRTC AND MEDIA FUNCTIONS ---
    const initializeMediaStream = useCallback(async () => {
        try {
            console.log("🎤📹 Requesting media permissions...");

            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };

            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (error) {
                console.warn("Failed with ideal constraints, trying basic...");
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
            }

            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            setDebugInfo(prev => ({ ...prev, localStreamActive: true }));
            return stream;
        } catch (error: any) {
            console.error("❌ Error accessing media devices:", error);

            let errorMessage = 'Failed to access camera/microphone';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Camera/microphone permissions denied. Please allow access and refresh.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No camera or microphone found. Please connect a device.';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'Camera/microphone is already in use by another application.';
            }

            setConnectionError(errorMessage);
            setDebugInfo(prev => ({ ...prev, localStreamActive: false }));
            throw error;
        }
    }, []);

    // Process any pending ICE candidates
    const processPendingCandidates = useCallback(async () => {
        if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
            console.log(`Processing ${pendingCandidatesRef.current.length} pending ICE candidates`);
            for (const candidate of pendingCandidatesRef.current) {
                try {
                    await peerConnectionRef.current.addIceCandidate(candidate);
                } catch (error) {
                    console.error("Error adding pending ice candidate", error);
                }
            }
            pendingCandidatesRef.current = [];
        }
    }, []);

    // Create peer connection with all listeners
    const createPeerConnection = useCallback(() => {
        console.log("🔗 Creating new peer connection...");
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;
        setDebugInfo(prev => ({ ...prev, peerConnectionCreated: true }));

        // Set up all peer connection event listeners
        pc.onicecandidate = (event) => {
            if (event.candidate && socket.connected) {
                socket.emit('webrtc-ice-candidate', { roomId, candidate: event.candidate });
                setDebugInfo(prev => ({ ...prev, iceCandidatesCount: prev.iceCandidatesCount + 1 }));
            }
        };

        pc.ontrack = (event) => {
            console.log("✅ 📺 Received remote track:", event.track.kind);
            setDebugInfo(prev => ({ ...prev, remoteStreamReceived: true }));
            const remoteStream = event.streams[0];

            if (event.track.kind === 'video') {
                const settings = event.track.getSettings();
                if (settings.displaySurface || event.track.label.includes('screen')) {
                    setRemoteScreenStream(remoteStream);
                } else {
                    setRemoteCameraStream(remoteStream);
                }
            } else if (event.track.kind === 'audio' && !remoteCameraStream) {
                setRemoteCameraStream(remoteStream);
            }
        };

        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            console.log("🔄 Connection state changed:", state);
            setDebugInfo(prev => ({ ...prev, connectionState: state }));
            setIsConnecting(state === 'connecting' || state === 'new');

            if (state === 'failed' || state === 'disconnected' || state === 'closed') {
                setConnectionError(`Connection ${state}`);
            } else if (state === 'connected') {
                setConnectionError(null);
            }
        };

        pc.oniceconnectionstatechange = () => {
            setDebugInfo(prev => ({ ...prev, iceConnectionState: pc.iceConnectionState }));
        };

        pc.onsignalingstatechange = () => {
            setDebugInfo(prev => ({ ...prev, signalingState: pc.signalingState }));
        };

        return pc;
    }, [roomId, socket, remoteCameraStream]);

    // Create and send offer
    const createAndSendOffer = useCallback(async () => {
        if (!peerConnectionRef.current) {
            console.error("No peer connection available for offer creation");
            return;
        }

        if (isOfferCreatedRef.current) {
            console.log("Offer already being created, skipping");
            return;
        }

        // Check if we're actually in the room
        if (!debugInfo.roomJoined) {
            console.warn("Not in room yet, delaying offer creation");
            setTimeout(() => createAndSendOffer(), 1000);
            return;
        }

        try {
            const pc = peerConnectionRef.current;

            console.log("Creating offer with state:", {
                signalingState: pc.signalingState,
                connectionState: pc.connectionState,
                iceConnectionState: pc.iceConnectionState,
                roomJoined: debugInfo.roomJoined,
                socketConnected: socket.connected
            });

            if (pc.signalingState !== 'stable') {
                console.warn("⚠️ Cannot create offer - signaling state:", pc.signalingState);
                isOfferCreatedRef.current = false;
                setTimeout(() => createAndSendOffer(), 1000);
                return;
            }

            isOfferCreatedRef.current = true;
            console.log("🎯 Creating WebRTC offer...");

            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            console.log("Setting local description...");
            await pc.setLocalDescription(offer);

            if (socket.connected && debugInfo.roomJoined) {
                console.log("Sending offer via socket...");
                socket.emit('webrtc-offer', { roomId, offer });
                setDebugInfo(prev => ({ ...prev, offerCreated: true }));
                console.log("✅ Offer sent successfully");
            } else {
                console.error("Cannot send offer - socket not connected or not in room");
                isOfferCreatedRef.current = false;
            }
        } catch (error) {
            console.error("❌ Error creating offer:", error);
            isOfferCreatedRef.current = false;

            // Retry after a delay
            setTimeout(() => {
                console.log("Retrying offer creation...");
                createAndSendOffer();
            }, 2000);
        }
    }, [roomId, socket, debugInfo.roomJoined]);

    // Main initialization effect
    useEffect(() => {
        if (isInitializedRef.current || sessionStatus !== 'authenticated' || !session?.user?.id) {
            return;
        }
        isInitializedRef.current = true;
        console.log("🚀 Initializing WebRTC connection...");

        const handlePeerReady = ({ userId, socketId }: { userId: string, socketId?: string }) => {
            console.log("✅ Received peer-ready signal:", { userId, socketId });
            setIsPeerReady(true);

            // Check if we should create offer (we need to check current state values)
            setTimeout(() => {
                // Get current state values
                const currentLocalReady = isLocalReady; // This might be stale in closure
                const currentRoomJoined = debugInfo.roomJoined; // This might be stale too

                console.log("Checking if should create offer:", {
                    role: session?.user?.role,
                    isLocalReady: currentLocalReady,
                    roomJoined: currentRoomJoined,
                    hasPeerConnection: !!peerConnectionRef.current,
                    offerCreated: isOfferCreatedRef.current
                });

                if (session?.user?.role === 'ADMIN' && !isOfferCreatedRef.current && peerConnectionRef.current) {
                    console.log("Admin should create offer after peer ready");
                    // We'll trigger offer creation from the effect that monitors states
                }
            }, 100);
        };

        const handlePeerJoined = ({ socketId }: { socketId: string }) => {
        console.log("👥 Peer joined:", socketId);
        setDebugInfo(prev => ({
            ...prev,
            roomParticipants: prev.roomParticipants + 1
        }));
    };

        const handleOffer = async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
            console.log("📥 Received offer from peer");

            if (!peerConnectionRef.current) {
                console.error("❌ No peer connection when offer received!");
                return;
            }

            try {
                const pc = peerConnectionRef.current;

                if (pc.signalingState === 'have-local-offer') {
                    if (session?.user?.role === 'ADMIN') {
                        console.log("Admin ignoring student's offer due to collision");
                        return;
                    } else {
                        console.log("Student rolling back local offer");
                        await pc.setLocalDescription({ type: 'rollback' });
                    }
                } else if (pc.signalingState !== 'stable') {
                    console.warn("⚠️ Received offer in non-stable state:", pc.signalingState);
                    return;
                }

                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                await processPendingCandidates();

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                if (socket.connected) {
                    socket.emit('webrtc-answer', { roomId, answer });
                    setDebugInfo(prev => ({ ...prev, answerReceived: true }));
                }
            } catch (error) {
                console.error("❌ Error handling offer:", error);
            }
        };

        const handleAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
            console.log("📥 Received answer");
            if (!peerConnectionRef.current) return;

            if (peerConnectionRef.current.signalingState === 'have-local-offer') {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                await processPendingCandidates();
                setDebugInfo(prev => ({ ...prev, answerReceived: true }));
            }
        };

        const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidate }) => {
            const iceCandidate = new RTCIceCandidate(candidate);

            if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
                try {
                    await peerConnectionRef.current.addIceCandidate(iceCandidate);
                } catch (error) {
                    console.error("Error adding received ice candidate", error);
                }
            } else {
                pendingCandidatesRef.current.push(iceCandidate);
            }
        };

        const handlePeerLeft = () => {
            console.log("👋 Peer left the call");
            cleanupPeerConnection();
            setConnectionError('The other participant left the call');
            setTimeout(() => handleHangUp(), 3000);
        };

        const handleDisconnect = (reason: string) => {
        console.log(`❌ Socket disconnected: ${reason}`);
        hasJoinedRef.current = false;
        setDebugInfo(prev => ({
            ...prev,
            socketConnected: false,
            roomJoined: false
        }));
        setConnectionError('Lost connection to server');
    };

         const handleConnect = () => {
        console.log(`✅ Socket connected: ${socket.id}`);
        setDebugInfo(prev => ({ ...prev, socketConnected: true, socketId: socket.id || '' }));
    };

        const handleRoomJoined = ({ roomId: joinedRoomId, participants }: { roomId: string, participants: number }) => {
        console.log(`✅ Room joined confirmed: ${joinedRoomId} with ${participants} participants`);
        setDebugInfo(prev => ({ 
            ...prev, 
            roomJoined: true, 
            roomParticipants: participants
        }));
    };


        // Attach all socket listeners
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('room-joined', handleRoomJoined);
        socket.on('peer-joined', handlePeerJoined);
        socket.on('peer-ready', handlePeerReady);
        socket.on('peer-left', handlePeerLeft);
        socket.on('call-ended', handlePeerLeft);
        socket.on('webrtc-offer', handleOffer);
        socket.on('webrtc-answer', handleAnswer);
        socket.on('webrtc-ice-candidate', handleIceCandidate);

        const initializeCall = async () => {
        try {
            // Reset state
            hasJoinedRef.current = false;
            isLeavingPageRef.current = false;

            // Step 1: Get media stream first
            const stream = await initializeMediaStream();

            // Step 2: Create peer connection and add tracks
            const pc = createPeerConnection();
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
                console.log(`Added ${track.kind} track to peer connection`);
            });

            // Step 3: Join room or check status
            if (!hasJoinedRef.current) {
                console.log("📍 Checking room status...");
                hasJoinedRef.current = true;
                
                if (session?.user?.role === 'ADMIN') {
                    socket.emit('check-room-status', { roomId }, (inRoom: boolean) => {
                        if (!inRoom) {
                            console.log("Admin not in room, joining now");
                            socket.emit('join-room', roomId);
                        } else {
                            console.log("Admin already in room");
                            setDebugInfo(prev => ({ ...prev, roomJoined: true }));
                            setTimeout(() => {
                                socket.emit('peer-ready', { roomId, userId: session!.user!.id });
                                setIsLocalReady(true);
                            }, 500);
                        }
                    });
                } else {
                    socket.emit('join-room', roomId);
                }
            }

        } catch (err) {
            console.error("❌ Failed to initialize call:", err);
            setConnectionError("Initialization failed. Check permissions and console.");
        }
    };

    // Start initialization
    initializeCall();

    // Cleanup function
    return () => {
        console.log("🧹 RoomPage unmounting - cleaning up...");

        // Remove all socket listeners
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('room-joined', handleRoomJoined);
        socket.off('peer-joined', handlePeerJoined);
        socket.off('peer-ready', handlePeerReady);
        socket.off('peer-left', handlePeerLeft);
        socket.off('call-ended', handlePeerLeft);
        socket.off('webrtc-offer', handleOffer);
        socket.off('webrtc-answer', handleAnswer);
        socket.off('webrtc-ice-candidate', handleIceCandidate);

        // Only leave room if we're actually leaving the call
        if (socket.connected && hasJoinedRef.current && isLeavingPageRef.current) {
            socket.emit('leave-room', roomId);
            hasJoinedRef.current = false;
        }

        // Always cleanup streams and peer connection
        cleanupLocalStreams();
        cleanupPeerConnection();
    };
    }, [sessionStatus, session, roomId, socket, initializeMediaStream, createPeerConnection, processPendingCandidates, cleanupLocalStreams, cleanupPeerConnection, handleHangUp, createAndSendOffer, isPeerReady, debugInfo.roomJoined]);

    // Effect to create offer when both peers are ready
    useEffect(() => {
        console.log("Ready states changed:", {
            isLocalReady,
            isPeerReady,
            roomJoined: debugInfo.roomJoined,
            role: session?.user?.role,
            hasPeerConnection: !!peerConnectionRef.current,
            offerCreated: isOfferCreatedRef.current
        });

        // Only create offer if ALL conditions are met
        if (
            isLocalReady &&
            isPeerReady &&
            debugInfo.roomJoined &&
            session?.user?.role === 'ADMIN' &&
            peerConnectionRef.current &&
            !isOfferCreatedRef.current
        ) {
            console.log("🎯 All conditions met in effect - Admin creating offer");
            isOfferCreatedRef.current = true;

            const timer = setTimeout(() => {
                createAndSendOffer();
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [isLocalReady, isPeerReady, debugInfo.roomJoined, session?.user?.role, createAndSendOffer]);

    // Update video elements when streams change
    useEffect(() => {
        if (remoteCameraVideoRef.current && remoteCameraStream) {
            remoteCameraVideoRef.current.srcObject = remoteCameraStream;
        }
    }, [remoteCameraStream]);

    useEffect(() => {
        if (remoteScreenVideoRef.current && remoteScreenStream) {
            remoteScreenVideoRef.current.srcObject = remoteScreenStream;
        }
    }, [remoteScreenStream]);

    // --- MEDIA CONTROL TOGGLES ---
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

    const handleScreenShare = useCallback(async () => {
        if (isSharingScreen) {
            if (screenTrackSenderRef.current && peerConnectionRef.current) {
                peerConnectionRef.current.removeTrack(screenTrackSenderRef.current);
                screenTrackSenderRef.current = null;
            }
            if (localScreenStreamRef.current) {
                localScreenStreamRef.current.getTracks().forEach(track => track.stop());
                localScreenStreamRef.current = null;
            }
            setIsSharingScreen(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
                const screenTrack = stream.getVideoTracks()[0];
                localScreenStreamRef.current = stream;

                if (peerConnectionRef.current) {
                    screenTrackSenderRef.current = peerConnectionRef.current.addTrack(screenTrack, stream);
                    setIsSharingScreen(true);
                    screenTrack.onended = () => {
                        handleScreenShare();
                    };
                }
            } catch (error) {
                console.error("❌ Screen sharing error:", error);
                if (error instanceof DOMException && error.name === 'NotAllowedError') {
                    return;
                }
                setConnectionError('Failed to start screen share');
            }
        }
    }, [isSharingScreen]);

    // --- RENDER LOGIC ---
    if (sessionStatus === 'loading') {
        return (
            <div className="w-full h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
                <FiLoader className="animate-spin" size={48} />
                <p>Uwierzytelnianie...</p>
            </div>
        );
    }

    if (sessionStatus !== 'authenticated') {
        return (
            <div className="w-full h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
                <FiXCircle size={48} className="text-red-500" />
                <p>Nie jesteś zalogowany</p>
            </div>
        );
    }

    const DebugPanel = () => (
        <div className="absolute top-20 left-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-xs font-mono text-white max-w-sm">
            <h3 className="text-sm font-bold mb-2 text-cyan-400">🔧 Connection Debug Info</h3>
            <div className="text-yellow-400 mb-2">Role: {session?.user?.role || 'Unknown'}</div>
            <div className="space-y-1">
                <div className={`flex items-center gap-2 ${isLocalReady ? 'text-green-400' : 'text-red-400'}`}>
                    <span>{isLocalReady ? '✅' : '❌'}</span>
                    <span>Local Ready</span>
                </div>
                <div className={`flex items-center gap-2 ${isPeerReady ? 'text-green-400' : 'text-red-400'}`}>
                    <span>{isPeerReady ? '✅' : '❌'}</span>
                    <span>Peer Ready</span>
                </div>
                <div className={`flex items-center gap-2 ${debugInfo.socketConnected ? 'text-green-400' : 'text-red-400'}`}>
                    <span>{debugInfo.socketConnected ? '✅' : '❌'}</span>
                    <span>Socket: {debugInfo.socketConnected ? debugInfo.socketId : 'Not connected'}</span>
                </div>
                <div className={`flex items-center gap-2 ${debugInfo.roomJoined ? 'text-green-400' : 'text-red-400'}`}>
                    <span>{debugInfo.roomJoined ? '✅' : '❌'}</span>
                    <span>Room Joined: {roomId}</span>
                </div>
                <div className={`flex items-center gap-2 ${debugInfo.localStreamActive ? 'text-green-400' : 'text-red-400'}`}>
                    <span>{debugInfo.localStreamActive ? '✅' : '❌'}</span>
                    <span>Local Stream Active</span>
                </div>
                <div className={`flex items-center gap-2 ${debugInfo.peerConnectionCreated ? 'text-green-400' : 'text-red-400'}`}>
                    <span>{debugInfo.peerConnectionCreated ? '✅' : '❌'}</span>
                    <span>Peer Connection Created</span>
                </div>
                <div className={`flex items-center gap-2 ${debugInfo.offerCreated ? 'text-green-400' : 'text-yellow-400'}`}>
                    <span>{debugInfo.offerCreated ? '✅' : '⏳'}</span>
                    <span>Offer Sent</span>
                </div>
                <div className={`flex items-center gap-2 ${debugInfo.answerReceived ? 'text-green-400' : 'text-yellow-400'}`}>
                    <span>{debugInfo.answerReceived ? '✅' : '⏳'}</span>
                    <span>Answer Received</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>🧊</span>
                    <span>ICE Candidates: {debugInfo.iceCandidatesCount}</span>
                </div>
                <div className={`flex items-center gap-2 ${debugInfo.remoteStreamReceived ? 'text-green-400' : 'text-red-400'}`}>
                    <span>{debugInfo.remoteStreamReceived ? '✅' : '❌'}</span>
                    <span>Remote Stream Received</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>📡</span>
                    <span>Connection: {debugInfo.connectionState}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>🧊</span>
                    <span>ICE State: {debugInfo.iceConnectionState}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>📞</span>
                    <span>Signaling: {debugInfo.signalingState}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>👥</span>
                    <span>Room Participants: {debugInfo.roomParticipants}</span>
                </div>
            </div>
            {process.env.NODE_ENV === 'development' && (
                <>
                    <button
                        onClick={() => {
                            socket.emit('debug-room-state', { roomId });
                            socket.once('debug-room-response', (data) => {
                                console.log('🔍 Room Debug Info:', data);
                            });
                        }}
                        className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-xs w-full"
                    >
                        Debug Room State
                    </button>

                    <button
                        onClick={() => {
                            console.log("Manual peer-ready signal");
                            socket.emit('peer-ready', { roomId, userId: session?.user?.id });
                            setIsLocalReady(true);
                        }}
                        className="mt-1 px-3 py-1 bg-green-600 text-white rounded text-xs w-full"
                    >
                        Force Signal Ready
                    </button>
                </>
            )}
        </div>
    );

    return (
        <>
            {process.env.NODE_ENV === 'development' && <DebugPanel />}

            <div className="relative w-full h-screen bg-slate-900 text-white flex flex-col items-center justify-center overflow-hidden">
                {/* Background animations */}
                <div className="absolute inset-0 z-0 opacity-40">
                    <motion.div
                        animate={{ x: ['-5%', '5%', '-5%'], y: ['-10%', '10%', '-10%'] }}
                        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                        className="absolute top-[-50%] left-[-50%] w-[150vw] h-[150vw] bg-purple-600/50 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ x: ['5%', '-5%', '5%'], y: ['10%', '-10%', '10%'] }}
                        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
                        className="absolute bottom-[-50%] right-[-50%] w-[150vw] h-[150vw] bg-cyan-500/40 rounded-full blur-3xl"
                    />
                </div>

                {/* Connection status */}
                {(isConnecting || connectionError) && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800/90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
                        {isConnecting && !connectionError && (
                            <>
                                <FiLoader className="animate-spin" size={16} />
                                <span className="text-sm">Łączenie...</span>
                            </>
                        )}
                        {connectionError && (
                            <>
                                <FiXCircle className="text-red-500" size={16} />
                                <span className="text-sm text-red-500">{connectionError}</span>
                            </>
                        )}
                    </div>
                )}

                {/* Main video area */}
                <div className="relative w-full h-full flex items-center justify-center p-4">
                    <div className="w-full h-full bg-black/30 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center">
                        {remoteScreenStream ? (
                            <video ref={remoteScreenVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
                        ) : remoteCameraStream ? (
                            <video ref={remoteCameraVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        ) : (
                            <VideoPlaceholder text="Oczekiwanie na uczestnika..." />
                        )}
                    </div>

                    {/* Picture-in-picture for camera when screen sharing */}
                    <AnimatePresence>
                        {remoteScreenStream && remoteCameraStream && (
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 50 }}
                                transition={{ duration: 0.3 }}
                                className="absolute bottom-32 right-8 w-72 h-54 bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-2xl border-2 border-white/20 overflow-hidden z-20"
                            >
                                <video ref={remoteCameraVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Call ended overlay */}
                    <AnimatePresence>
                        {isCallEnded && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50"
                            >
                                <FiXCircle className="w-24 h-24 text-red-500 mb-4" />
                                <h2 className="text-4xl font-bold">Rozmowa zakończona</h2>
                                <p className="text-slate-400 mt-2">Przekierowywanie...</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Local video (draggable) */}
                    <motion.div
                        drag
                        dragConstraints={{ top: 0, left: 0, right: window.innerWidth - 250, bottom: window.innerHeight - 200 }}
                        className="absolute bottom-24 sm:bottom-8 right-8 w-48 sm:w-64 h-32 sm:h-40 cursor-grab active:cursor-grabbing z-30"
                    >
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover rounded-2xl shadow-2xl border-2 border-white/10"
                        />
                        {isCameraOff && (
                            <div className="absolute inset-0 bg-slate-800 rounded-2xl flex items-center justify-center">
                                <FiCameraOff size={32} className="text-slate-400" />
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Control buttons */}
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 p-3 sm:p-4 bg-slate-800/50 backdrop-blur-lg border border-white/10 rounded-full flex items-center gap-2 sm:gap-4 z-40"
                >
                    <ControlButton
                        icon={<FiMic size={24} />}
                        offIcon={<FiMicOff size={24} />}
                        isToggled={isMuted}
                        onToggle={toggleMute}
                    />
                    <ControlButton
                        icon={<FiVideo size={24} />}
                        offIcon={<FiVideoOff size={24} />}
                        isToggled={isCameraOff}
                        onToggle={toggleCamera}
                    />
                    <ControlButton
                        icon={<FiMonitor size={24} />}
                        isToggled={isSharingScreen}
                        onToggle={handleScreenShare}
                    />
                    <div className="w-px h-8 bg-slate-600 mx-2" />
                    <button
                        onClick={handleHangUp}
                        className="p-3 sm:p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                        <FiPhoneOff size={24} />
                    </button>
                </motion.div>
            </div>
        </>
    );
}

const ControlButton = ({
    icon,
    offIcon,
    isToggled,
    onToggle
}: {
    icon: React.ReactElement;
    offIcon?: React.ReactElement;
    isToggled: boolean;
    onToggle: () => void;
}) => (
    <button
        onClick={onToggle}
        className={`p-3 sm:p-4 rounded-full transition-colors ${isToggled
                ? 'bg-cyan-500/80 text-white'
                : 'bg-slate-700/80 text-white hover:bg-slate-600'
            }`}
    >
        {isToggled ? (offIcon || icon) : icon}
    </button>
);