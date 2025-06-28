"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Pusher, { PresenceChannel } from 'pusher-js';
import {
    FiCameraOff, FiMic, FiMicOff, FiVideo, FiVideoOff,
    FiAlertTriangle, FiPhoneOff, FiXCircle, FiLoader,
    FiMonitor, FiAirplay
} from 'react-icons/fi';
import { ICE_SERVERS, getMediaStreamWithFallback, handleMediaStreamError } from '@/lib/webrtc-utils';

const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const checkDevice = () => setIsMobile(window.innerWidth < breakpoint);
            checkDevice();
            window.addEventListener('resize', checkDevice);
            return () => window.removeEventListener('resize', checkDevice);
        }
    }, [breakpoint]);
    return isMobile;
};

const VideoPlaceholder = ({ text, isError = false }: { text: string, isError?: boolean }) => (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3">
        {isError ? <FiAlertTriangle className="text-red-500" size={32} /> : <FiLoader className="animate-spin" size={32} />}
        <span className={`text-lg font-medium mt-2 text-center ${isError ? 'text-red-500' : ''}`}>{text}</span>
    </div>
);

const ControlButton = ({ icon, offIcon, isToggled, onToggle, activeClass = 'bg-cyan-500/80', disabled = false, title = '' }: { icon: React.ReactElement; offIcon?: React.ReactElement; isToggled: boolean; onToggle: () => void; activeClass?: string, disabled?: boolean, title?: string }) => (
    <button
        onClick={onToggle}
        disabled={disabled}
        title={title}
        className={`p-4 rounded-full transition-colors ${disabled ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : (isToggled ? activeClass + ' text-white' : 'bg-slate-700/80 text-white hover:bg-slate-600')}`}
    >
        {isToggled ? (offIcon || icon) : icon}
    </button>
);

export default function RoomPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const params = useParams();
    const roomId = (params.roomId || params.id) as string;

    const isMobile = useIsMobile();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoPiPRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const localScreenStreamRef = useRef<MediaStream | null>(null);
    const videoSenderRef = useRef<RTCRtpSender | null>(null);
    const pusherRef = useRef<Pusher | null>(null);
    const channelRef = useRef<PresenceChannel | null>(null);
    const socketIdRef = useRef<string | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isIntentionalDisconnectRef = useRef(false);

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
    const [showSwapHint, setShowSwapHint] = useState(true);

    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
            setIsScreenShareSupported(true);
        }
    }, []);

    // Prevent browser throttling with audio context trick
    useEffect(() => {
        let audioContext: AudioContext | null = null;
        let oscillator: OscillatorNode | null = null;

        try {
            // Create silent audio to prevent tab throttling
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0; // Silent
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.start();
            console.log('Audio context created to prevent throttling');
        } catch (err) {
            console.log('Failed to create audio context:', err);
        }

        return () => {
            if (oscillator) {
                oscillator.stop();
                oscillator.disconnect();
            }
            if (audioContext) {
                audioContext.close();
            }
        };
    }, []);

    const sendSignal = useCallback(async (type: string, data: any) => {
        if (!roomId || !socketIdRef.current) return;

        try {
            await fetch('/api/room/signal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-pusher-socket-id': socketIdRef.current
                },
                body: JSON.stringify({ roomId, type, data })
            });
        } catch (error) {
            console.error('Error sending signal:', error);
        }
    }, [roomId]);

    const handleHangUp = useCallback(async () => {
        if (isCallEnded) return;

        // Mark this as an intentional disconnect
        isIntentionalDisconnectRef.current = true;

        // Clear any pending reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        setIsCallEnded(true);
        setConnectionStatus("Rozłączanie...");

        await fetch('/api/room/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, event: 'hang-up' })
        });

        channelRef.current?.unsubscribe();
        pusherRef.current?.disconnect();
        peerConnectionRef.current?.close();
        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localScreenStreamRef.current?.getTracks().forEach(track => track.stop());

        setTimeout(() => {
            const redirectUrl = session?.user?.role === 'ADMIN' ? '/admin' : '/moje-terminy';
            router.push(redirectUrl);
        }, 1500);
    }, [roomId, session, router, isCallEnded]);

    const toggleMute = useCallback(() => {
        localStreamRef.current?.getAudioTracks().forEach(track => {
            track.enabled = !track.enabled;
            setIsMuted(!track.enabled);
        });
    }, []);

    const toggleCamera = useCallback(() => {
        localStreamRef.current?.getVideoTracks().forEach(track => {
            track.enabled = !track.enabled;
            setIsCameraOff(!track.enabled);
        });
    }, []);

    const stopScreenShare = useCallback(() => {
        if (!videoSenderRef.current || !localStreamRef.current) return;
        localScreenStreamRef.current?.getTracks().forEach(track => track.stop());
        const cameraTrack = localStreamRef.current.getVideoTracks()[0];
        if (cameraTrack) {
            videoSenderRef.current.replaceTrack(cameraTrack);
        }
        setIsSharingScreen(false);
    }, []);

    const handleToggleScreenShare = useCallback(async () => {
        if (isSharingScreen) {
            stopScreenShare();
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                if (!videoSenderRef.current || !screenTrack) return;
                screenTrack.onended = () => stopScreenShare();
                videoSenderRef.current.replaceTrack(screenTrack);
                localScreenStreamRef.current = screenStream;
                setIsSharingScreen(true);
            } catch (error) {
                console.error("Błąd udostępniania ekranu:", error);
            }
        }
    }, [isSharingScreen, stopScreenShare]);

    // Prevent browser throttling
    useEffect(() => {
        // Request wake lock if available (for mobile devices)
        let wakeLock: any = null;

        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await (navigator as any).wakeLock.request('screen');
                    console.log('Wake lock acquired');
                }
            } catch (err) {
                console.log('Wake lock request failed:', err);
            }
        };

        requestWakeLock();

        // Re-acquire wake lock when page becomes visible
        const handleVisibilityChange = () => {
            if (!document.hidden && wakeLock && wakeLock.released) {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (wakeLock) {
                wakeLock.release();
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Hide swap hint after 5 seconds or after first swap
    useEffect(() => {
        if (remoteCameraStream && remoteScreenStream && showSwapHint) {
            const timer = setTimeout(() => setShowSwapHint(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [remoteCameraStream, remoteScreenStream, showSwapHint]);

    const handleSwapViews = () => {
        // Only allow swapping if we have both streams
        if (remoteScreenStream && remoteCameraStream) {
            setPrimaryView(prev => prev === 'camera' ? 'screen' : 'camera');
            setShowSwapHint(false);
        }
    };

    useEffect(() => {
        if (sessionStatus !== 'authenticated' || !roomId) return;
        let isCleanupDone = false;
        let handleVisibilityChange: (() => void) | null = null;
        let keepAliveInterval: NodeJS.Timeout | null = null;

        const initialize = async () => {
            setConnectionStatus("Przygotowywanie...");
            try {
                // KROK 1: Pobierz media
                const stream = await getMediaStreamWithFallback();
                if (isCleanupDone) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                localStreamRef.current = stream;
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                setHasMediaError(false);

                // KROK 2: Stwórz połączenie WebRTC with aggressive settings
                const pc = new RTCPeerConnection({
                    ...ICE_SERVERS,
                    iceCandidatePoolSize: 30, // Pre-gather more candidates
                });
                peerConnectionRef.current = pc;

                // Set aggressive reconnection policy
                if ('restartIce' in pc) {
                    // Modern browsers support configuration
                    (pc as any).configuration = {
                        ...ICE_SERVERS,
                        iceTransportPolicy: 'all',
                        bundlePolicy: 'max-bundle',
                        rtcpMuxPolicy: 'require',
                    };
                }

                stream.getTracks().forEach(track => {
                    if (track.kind === 'video') {
                        videoSenderRef.current = pc.addTrack(track, stream);
                    } else {
                        pc.addTrack(track, stream);
                    }
                });

                // KROK 3: Połącz się z Pusherem
                const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
                    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
                    authEndpoint: '/api/pusher/auth',
                    auth: { params: { userId: session.user.id } }
                });
                pusherRef.current = pusher;

                // Store socket ID when connection is established
                pusher.connection.bind('connected', () => {
                    socketIdRef.current = pusher.connection.socket_id;
                    console.log('Pusher connected with socket ID:', socketIdRef.current);
                });

                const channel = pusher.subscribe(`presence-room-${roomId}`) as PresenceChannel;
                channelRef.current = channel;

                // KROK 4: Ustaw wszystkie listenery
                const isInitiator = session.user.role === 'ADMIN';

                const createOffer = async () => {
                    if (pc.signalingState === 'stable') {
                        try {
                            setConnectionStatus("Tworzenie oferty...");
                            const offer = await pc.createOffer({
                                offerToReceiveAudio: true,
                                offerToReceiveVideo: true
                            });
                            await pc.setLocalDescription(offer);
                            sendSignal('offer', offer);
                        } catch (e) {
                            console.error("Błąd tworzenia oferty:", e);
                        }
                    }
                };

                pc.onicecandidate = e => {
                    if (e.candidate) {
                        sendSignal('ice-candidate', e.candidate);
                    }
                };

                pc.ontrack = e => {
                    const s = e.streams[0];
                    if (s) {
                        const trackSettings = e.track.getSettings();
                        console.log('Received track:', e.track.kind, trackSettings);

                        // Check if this is a screen share track
                        if (trackSettings.displaySurface ||
                            (e.track.label && e.track.label.includes('screen'))) {
                            console.log('Setting remote screen stream');
                            setRemoteScreenStream(s);

                            // Handle when screen share ends
                            e.track.onended = () => {
                                console.log('Remote screen share ended');
                                setRemoteScreenStream(null);
                            };

                            // Auto-switch to screen view when screen sharing starts
                            setPrimaryView(current => {
                                // Only switch if we're currently viewing camera
                                return current === 'camera' ? 'screen' : current;
                            });
                        } else if (e.track.kind === 'video') {
                            console.log('Setting remote camera stream');
                            setRemoteCameraStream(s);

                            // Handle when camera ends
                            e.track.onended = () => {
                                console.log('Remote camera ended');
                                setRemoteCameraStream(null);
                            };
                        }
                    }
                };

                // Track if we're reconnecting
                pc.onconnectionstatechange = () => {
                    if (pc && !isIntentionalDisconnectRef.current) {
                        console.log('Connection state:', pc.connectionState);
                        setConnectionStatus(pc.connectionState);

                        // Handle disconnection with grace period
                        if (pc.connectionState === 'disconnected') {
                            // Clear any existing timeout
                            if (reconnectTimeoutRef.current) {
                                clearTimeout(reconnectTimeoutRef.current);
                            }

                            // Don't disconnect if the page is hidden (tab switched/minimized)
                            if (document.hidden) {
                                console.log('Page is hidden, maintaining connection...');
                                setConnectionStatus("Połączenie wstrzymane");
                                return;
                            }

                            // Give it 30 seconds to reconnect before hanging up
                            reconnectTimeoutRef.current = setTimeout(() => {
                                if (pc.connectionState === 'disconnected' && !document.hidden && !isIntentionalDisconnectRef.current) {
                                    console.log('Connection failed to recover, hanging up...');
                                    handleHangUp();
                                }
                            }, 30000);
                        } else if (pc.connectionState === 'connected') {
                            // Clear any pending disconnect timeout
                            if (reconnectTimeoutRef.current) {
                                clearTimeout(reconnectTimeoutRef.current);
                                reconnectTimeoutRef.current = null;
                            }
                            setConnectionStatus("connected");
                        } else if (['closed', 'failed'].includes(pc.connectionState)) {
                            // These are terminal states, hang up immediately
                            if (reconnectTimeoutRef.current) {
                                clearTimeout(reconnectTimeoutRef.current);
                                reconnectTimeoutRef.current = null;
                            }
                            if (!isIntentionalDisconnectRef.current) {
                                handleHangUp();
                            }
                        }
                    }
                };

                // Also monitor ICE connection state (more reliable in some browsers)
                pc.oniceconnectionstatechange = () => {
                    if (pc && !isIntentionalDisconnectRef.current) {
                        console.log('ICE connection state:', pc.iceConnectionState);

                        // Use ICE state for more accurate connection detection
                        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                            // Clear any pending disconnect timeout
                            if (reconnectTimeoutRef.current) {
                                clearTimeout(reconnectTimeoutRef.current);
                                reconnectTimeoutRef.current = null;
                            }
                            setConnectionStatus("connected");
                        }
                    }
                };
                channel.bind('webrtc-offer', async (data: any) => {
                    if (!isInitiator && pc.signalingState === 'stable') {
                        console.log('Received offer');
                        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        sendSignal('answer', answer);
                    }
                });

                channel.bind('webrtc-answer', async (data: any) => {
                    if (isInitiator && pc.signalingState === 'have-local-offer') {
                        console.log('Received answer');
                        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                    }
                });

                channel.bind('webrtc-ice-candidate', async (data: any) => {
                    if (data.icecandidate && pc.signalingState !== 'closed') {
                        console.log('Adding ICE candidate');
                        await pc.addIceCandidate(new RTCIceCandidate(data.icecandidate));
                    }
                });

                channel.bind('call-ended', handleHangUp);

                // Handle presence events
                channel.bind('pusher:subscription_succeeded', (members: any) => {
                    console.log('Successfully subscribed to channel');
                    const memberCount = Object.keys(members.members).length;
                    console.log(`Members in room: ${memberCount}`);

                    if (memberCount > 1 && isInitiator) {
                        console.log('Other participant already in room, creating offer...');
                        setTimeout(createOffer, 1000);
                    }
                });

                channel.bind('pusher:member_added', (member: { id: string }) => {
                    console.log('New member joined:', member.id);
                    if (isInitiator && member.id !== session.user.id) {
                        console.log('Creating offer for new peer...');
                        setTimeout(createOffer, 1000);
                    }
                });

                channel.bind('pusher:member_removed', (member: { id: string }) => {
                    console.log('Member left:', member.id);
                    if (member.id !== session.user.id) {
                        handleHangUp();
                    }
                });

                // KROK 5: Handle page visibility changes
                handleVisibilityChange = () => {
                    if (document.hidden) {
                        console.log('Page is hidden, maintaining connection...');
                        // Clear any disconnect timeout when page is hidden
                        if (reconnectTimeoutRef.current) {
                            clearTimeout(reconnectTimeoutRef.current);
                            reconnectTimeoutRef.current = null;
                        }
                    } else {
                        console.log('Page is visible again');
                        // When page becomes visible, check connection state
                        if (pc.connectionState === 'disconnected') {
                            console.log('Connection disconnected while hidden, attempting to restart ICE...');
                            setConnectionStatus("Wznawianie połączenia...");
                            // Try to kickstart the connection
                            pc.restartIce();

                            // Set a new timeout for reconnection
                            if (reconnectTimeoutRef.current) {
                                clearTimeout(reconnectTimeoutRef.current);
                            }
                            reconnectTimeoutRef.current = setTimeout(() => {
                                if (pc.connectionState === 'disconnected' && !isIntentionalDisconnectRef.current) {
                                    console.log('Failed to reconnect after page became visible');
                                    handleHangUp();
                                }
                            }, 15000); // 15 seconds to reconnect after becoming visible
                        } else if (pc.connectionState === 'connected') {
                            setConnectionStatus("connected");
                        }
                    }
                };

                document.addEventListener('visibilitychange', handleVisibilityChange);

                // KROK 6: Create a data channel for keep-alive
                const dataChannel = pc.createDataChannel('keepAlive', { ordered: true });

                dataChannel.onopen = () => {
                    console.log('Data channel opened for keep-alive');
                };

                // KROK 7: Keep connection alive
                keepAliveInterval = setInterval(() => {
                    if (pc && pc.connectionState === 'connected') {
                        // Send a ping through data channel if it's open
                        if (dataChannel.readyState === 'open') {
                            try {
                                dataChannel.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                            } catch (e) {
                                console.log('Failed to send keep-alive ping');
                            }
                        }

                        // Also check stats to keep the connection active
                        pc.getStats().then(stats => {
                            console.log('Connection alive check at', new Date().toLocaleTimeString());
                        });
                    }
                }, 3000); // Check every 3 seconds instead of 5

                // KROK 8: Status
                setConnectionStatus("Oczekiwanie na drugiego uczestnika...");

            } catch (error: any) {
                console.error("❌ Błąd podczas inicjalizacji:", error);
                setHasMediaError(true);
                setConnectionStatus(handleMediaStreamError(error));
            }
        };

        initialize();

        return () => {
            isCleanupDone = true;
            isIntentionalDisconnectRef.current = true;

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            if (handleVisibilityChange) {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
            if (keepAliveInterval) {
                clearInterval(keepAliveInterval);
            }
            if (channelRef.current) channelRef.current.unsubscribe();
            if (pusherRef.current) pusherRef.current.disconnect();
            if (peerConnectionRef.current) peerConnectionRef.current.close();
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            localScreenStreamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, [roomId, sessionStatus, session, handleHangUp, sendSignal]);

    // Handle when remote screen share ends
    useEffect(() => {
        if (!remoteScreenStream && primaryView === 'screen' && remoteCameraStream) {
            setPrimaryView('camera');
        }
    }, [remoteScreenStream, primaryView, remoteCameraStream]);

    const mainStream = primaryView === 'screen' ? remoteScreenStream : remoteCameraStream;
    const pipStream = primaryView === 'screen' ? remoteCameraStream : remoteScreenStream;

    useEffect(() => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = mainStream;
    }, [mainStream]);

    useEffect(() => {
        if (remoteVideoPiPRef.current) remoteVideoPiPRef.current.srcObject = pipStream;
    }, [pipStream]);

    if (sessionStatus === 'loading') {
        return <div className="w-full h-screen bg-slate-900 flex items-center justify-center"><FiLoader className="animate-spin text-white" size={48} /></div>;
    }

    if (!roomId) {
        return <div className="w-full h-screen bg-slate-900 flex items-center justify-center">Brak ID pokoju.</div>;
    }

    return (
        <div className="relative w-full h-screen bg-slate-900 text-white flex flex-col items-center justify-center overflow-hidden">
            <AnimatePresence>
                {connectionStatus !== 'connected' && !isCallEnded && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800/80 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-3">
                        {connectionStatus !== 'Połączenie wstrzymane' && <FiLoader className="animate-spin text-cyan-400" />}
                        <span className="text-slate-300 capitalize">
                            {connectionStatus === 'Połączenie wstrzymane' ? 'Połączenie wstrzymane (karta w tle)' : connectionStatus}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div onClick={handleSwapViews} className={`relative w-full h-full flex items-center justify-center bg-black ${(remoteScreenStream && remoteCameraStream) ? 'cursor-pointer' : ''}`}>
                <video ref={remoteVideoRef} autoPlay playsInline className={`w-full h-full object-contain`} />
                {!mainStream && !isCallEnded && <VideoPlaceholder text={connectionStatus} isError={hasMediaError} />}

                {/* Show indicator when viewing screen share */}
                {primaryView === 'screen' && remoteScreenStream && remoteCameraStream && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-5 left-5 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2"
                    >
                        <FiMonitor className="w-5 h-5 text-cyan-400" />
                        <span className="text-white text-sm font-medium">Udostępniony ekran</span>
                    </motion.div>
                )}

                {/* Show swap hint */}
                <AnimatePresence>
                    {showSwapHint && remoteCameraStream && remoteScreenStream && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="text-white text-sm">Kliknij aby przełączyć widok</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {pipStream && (
                    <motion.div
                        onClick={handleSwapViews}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        drag
                        dragConstraints={{ left: 0, right: window.innerWidth - 256, top: 0, bottom: window.innerHeight - 144 }}
                        className="absolute bottom-28 right-5 w-64 h-40 cursor-pointer z-20 group"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <video
                            ref={remoteVideoPiPRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover rounded-xl shadow-2xl border-2 border-white/20 group-hover:border-white/40 transition-all"
                        />
                        {/* Show an icon indicator for screen share */}
                        {primaryView === 'camera' && remoteScreenStream && (
                            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-md p-1.5">
                                <FiMonitor className="w-4 h-4 text-white" />
                            </div>
                        )}
                        {/* Show swap icon on hover */}
                        {remoteCameraStream && remoteScreenStream && (
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                <div className="bg-white/10 backdrop-blur-sm rounded-full p-3">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {!isMobile && (
                <motion.div drag dragConstraints={{ top: 20, left: 20, right: window.innerWidth - 270, bottom: window.innerHeight - 200 }} className="absolute top-5 left-5 w-64 h-40 cursor-grab active:cursor-grabbing z-30">
                    <div className="w-full h-full object-cover rounded-xl shadow-2xl border-2 border-white/20 bg-black flex items-center justify-center">
                        <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover rounded-xl ${hasMediaError ? 'hidden' : 'block'}`} />
                        {hasMediaError && <FiCameraOff size={32} className="text-slate-500" />}
                    </div>
                    {isCameraOff && !hasMediaError && <div className="absolute inset-0 bg-slate-800/70 rounded-xl flex items-center justify-center"><FiCameraOff size={32} /></div>}
                </motion.div>
            )}

            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="absolute bottom-5 p-3 bg-slate-800/50 backdrop-blur-lg border border-white/10 rounded-full flex items-center gap-4 z-40">
                <ControlButton icon={<FiMic size={24} />} offIcon={<FiMicOff size={24} />} isToggled={isMuted} onToggle={toggleMute} />
                <ControlButton icon={<FiVideo size={24} />} offIcon={<FiVideoOff size={24} />} isToggled={isCameraOff} onToggle={toggleCamera} />
                <ControlButton icon={<FiMonitor size={24} />} offIcon={<FiAirplay size={24} />} isToggled={isSharingScreen} onToggle={handleToggleScreenShare} activeClass="bg-blue-500/80" disabled={!isScreenShareSupported} title={isScreenShareSupported ? "Udostępnij ekran" : "Udostępnianie ekranu nie jest wspierane"} />
                <div className="w-px h-8 bg-slate-600" />
                <button onClick={handleHangUp} className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"><FiPhoneOff size={24} /></button>
            </motion.div>

            <AnimatePresence>
                {isCallEnded && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
                        <FiXCircle className="w-24 h-24 text-red-500 mb-4" />
                        <h2 className="text-4xl font-bold">Rozmowa zakończona</h2>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}