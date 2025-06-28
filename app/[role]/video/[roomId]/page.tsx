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

// Hook do wykrywania urządzeń mobilnych
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

// Sub-komponenty
const VideoPlaceholder = ({ text, isError = false }: { text: string, isError?: boolean }) => ( <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3"> {isError ? <FiAlertTriangle className="text-red-500" size={32} /> : <FiLoader className="animate-spin" size={32} />} <span className={`text-lg font-medium mt-2 text-center ${isError ? 'text-red-500' : ''}`}>{text}</span> </div> );
const ControlButton = ({ icon, offIcon, isToggled, onToggle, activeClass = 'bg-cyan-500/80', disabled = false, title = '' }: { icon: React.ReactElement; offIcon?: React.ReactElement; isToggled: boolean; onToggle: () => void; activeClass?: string, disabled?: boolean, title?: string }) => ( <button onClick={onToggle} disabled={disabled} title={title} className={`p-4 rounded-full transition-colors ${disabled ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : (isToggled ? activeClass + ' text-white' : 'bg-slate-700/80 text-white hover:bg-slate-600')}`} > {isToggled ? (offIcon || icon) : icon} </button> );

// Główny Komponent Strony
export default function RoomPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const params = useParams();
    const roomId = params.roomId as string;
    
    const isMobile = useIsMobile();
    
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoPiPRef = useRef<HTMLVideoElement>(null);

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const localScreenStreamRef = useRef<MediaStream | null>(null);
    const videoSenderRef = useRef<RTCRtpSender | null>(null);
    const pusherRef = useRef<Pusher | null>(null);
    const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);

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
    
    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
            setIsScreenShareSupported(true);
        }
    }, []);

    const sendSignal = useCallback(async (type: string, data: any) => { if (!roomId) return; await fetch('/api/room/signal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId, type, data }), }); }, [roomId]);
    const handleHangUp = useCallback(async () => { if (isCallEnded) return; setIsCallEnded(true); setConnectionStatus("Rozłączanie..."); await fetch('/api/room/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId, event: 'hang-up' }) }); pusherRef.current?.disconnect(); peerConnectionRef.current?.close(); localStreamRef.current?.getTracks().forEach(track => track.stop()); localScreenStreamRef.current?.getTracks().forEach(track => track.stop()); setTimeout(() => { const redirectUrl = session?.user?.role === 'ADMIN' ? '/admin' : '/moje-terminy'; router.push(redirectUrl); }, 1500); }, [roomId, session, router, isCallEnded]);
    const toggleMute = useCallback(() => { if (localStreamRef.current) { localStreamRef.current.getAudioTracks().forEach(track => { track.enabled = !track.enabled; setIsMuted(!track.enabled); }); } }, []);
    const toggleCamera = useCallback(() => { if (localStreamRef.current) { localStreamRef.current.getVideoTracks().forEach(track => { track.enabled = !track.enabled; setIsCameraOff(!track.enabled); }); } }, []);
    const stopScreenShare = useCallback(() => { if (!videoSenderRef.current || !localStreamRef.current) return; localScreenStreamRef.current?.getTracks().forEach(track => track.stop()); const cameraTrack = localStreamRef.current.getVideoTracks()[0]; if (cameraTrack) { videoSenderRef.current.replaceTrack(cameraTrack); } setIsSharingScreen(false); }, []);
    const handleToggleScreenShare = useCallback(async () => { if (isSharingScreen) { stopScreenShare(); } else { try { const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true }); const screenTrack = screenStream.getVideoTracks()[0]; if (!videoSenderRef.current || !screenTrack) return; screenTrack.onended = () => stopScreenShare(); videoSenderRef.current.replaceTrack(screenTrack); localScreenStreamRef.current = screenStream; setIsSharingScreen(true); } catch (error) { console.error("Błąd udostępniania ekranu:", error); } } }, [isSharingScreen, stopScreenShare]);
    const handleSwapViews = () => { if (remoteScreenStream) setPrimaryView(prev => prev === 'camera' ? 'screen' : 'camera'); };
    
    useEffect(() => {
        if (sessionStatus !== 'authenticated' || !roomId) return;

        let pc: RTCPeerConnection | null = null;
        let pusher: Pusher | null = null;

        const initialize = async () => {
            try {
                // KROK 1: POBIERZ MEDIA
                setConnectionStatus("Pobieranie kamery...");
                const stream = await getMediaStreamWithFallback();
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                setHasMediaError(false);

                // KROK 2: STWÓRZ POŁĄCZENIE WEBRTC
                setConnectionStatus("Konfiguracja połączenia...");
                pc = new RTCPeerConnection(ICE_SERVERS);
                peerConnectionRef.current = pc;
                stream.getTracks().forEach(track => {
                    const sender = pc!.addTrack(track, stream);
                    if (track.kind === 'video') videoSenderRef.current = sender;
                });
                pc.onicecandidate = (event) => { if (event.candidate) sendSignal('ice-candidate', event.candidate); };
                pc.ontrack = (event) => { if (event.streams && event.streams[0]) { const isScreen = !!event.track.getSettings().displaySurface; if (isScreen) { setRemoteScreenStream(event.streams[0]); setPrimaryView('screen'); } else { setRemoteCameraStream(event.streams[0]); } } };
                pc.onconnectionstatechange = () => { if (pc) { setConnectionStatus(pc.connectionState); if (['disconnected', 'closed', 'failed'].includes(pc.connectionState)) handleHangUp(); } };
                
                // KROK 3: POŁĄCZ SIĘ Z PUSHEREM
                setConnectionStatus("Łączenie z serwerem...");
                pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
                    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
                    authEndpoint: '/api/pusher/auth',
                    auth: { params: { userId: session.user!.id } }
                });
                pusherRef.current = pusher;
                const channel = pusher.subscribe(`presence-room-${roomId}`) as PresenceChannel;

                const handleOffer = async (data: any) => { if (session.user.role !== 'ADMIN') { await pc!.setRemoteDescription(new RTCSessionDescription(data.offer)); const answer = await pc!.createAnswer(); await pc!.setLocalDescription(answer); sendSignal('answer', answer); }};
                const handleAnswer = async (data: any) => { if (session.user.role === 'ADMIN') { await pc!.setRemoteDescription(new RTCSessionDescription(data.answer)); }};
                const handleIceCandidate = async (data: any) => { if (data.candidate) { await pc!.addIceCandidate(new RTCIceCandidate(data.candidate)); }};

                // KROK 4: NASŁUCHUJ NA SYGNAŁY DOPIERO PO NAWIĄZANIU POŁĄCZENIA
                channel.bind('webrtc-offer', handleOffer);
                channel.bind('webrtc-answer', handleAnswer);
                channel.bind('webrtc-ice-candidate', handleIceCandidate);
                channel.bind('call-ended', handleHangUp);

                // KROK 5: ADMIN CZEKA NA DOŁĄCZENIE STUDENTA, ABY WYSŁAĆ OFERTĘ
                if (session.user.role === 'ADMIN') {
                    channel.bind('pusher:member_added', async () => {
                        console.log("Student dołączył, wysyłam ofertę...");
                        const offer = await pc!.createOffer();
                        await pc!.setLocalDescription(offer);
                        sendSignal('offer', offer);
                    });
                }
                
                setConnectionStatus("Oczekiwanie na drugiego uczestnika...");

            } catch (error: any) {
                console.error("❌ Błąd podczas inicjalizacji:", error);
                setHasMediaError(true);
                setConnectionStatus(handleMediaStreamError(error) || "Nieznany błąd inicjalizacji");
            }
        };

        initialize();

        return () => {
            if (pusherRef.current) pusherRef.current.disconnect();
            if (peerConnectionRef.current) peerConnectionRef.current.close();
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            localScreenStreamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, [roomId, sessionStatus, session, handleHangUp, sendSignal]);

    const mainStream = primaryView === 'screen' ? remoteScreenStream : remoteCameraStream;
    const pipStream = primaryView === 'screen' ? remoteCameraStream : remoteScreenStream;

    useEffect(() => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = mainStream; }, [mainStream]);
    useEffect(() => { if (remoteVideoPiPRef.current) remoteVideoPiPRef.current.srcObject = pipStream; }, [pipStream]);
    
    if (sessionStatus === 'loading') return <div className="w-full h-screen bg-slate-900 flex items-center justify-center"><FiLoader className="animate-spin text-white" size={48}/></div>;
    if (!roomId) return <div className="w-full h-screen bg-slate-900 flex items-center justify-center">Brak ID pokoju.</div>;

    return (
        <div className="relative w-full h-screen bg-slate-900 text-white flex flex-col items-center justify-center overflow-hidden">
             <AnimatePresence>
                 {connectionStatus !== 'connected' && !isCallEnded && (
                     <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800/80 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-3">
                        <FiLoader className="animate-spin text-cyan-400"/>
                        <span className="text-slate-300 capitalize">{connectionStatus}</span>
                     </motion.div>
                 )}
             </AnimatePresence>
 
             <div onClick={handleSwapViews} className={`w-full h-full flex items-center justify-center bg-black ${remoteScreenStream ? 'cursor-pointer' : ''}`}>
                 <video ref={remoteVideoRef} autoPlay playsInline className={`w-full h-full object-contain`} />
                 {!mainStream && !isCallEnded && <VideoPlaceholder text={connectionStatus} isError={hasMediaError} />}
             </div>
 
             <AnimatePresence>
                {pipStream && (
                    <motion.div onClick={handleSwapViews} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} drag dragConstraints={{ left: 0, right: window.innerWidth - 256, top: 0, bottom: window.innerHeight - 144 }} className="absolute bottom-28 right-5 w-64 h-40 cursor-pointer z-20">
                        <video ref={remoteVideoPiPRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-xl shadow-2xl border-2 border-white/20" />
                    </motion.div>
                )}
             </AnimatePresence>

             {!isMobile && (
                 <motion.div drag dragConstraints={{ top: 20, left: 20, right: window.innerWidth - 270, bottom: window.innerHeight - 200 }} className="absolute top-5 left-5 w-64 h-40 cursor-grab active:cursor-grabbing z-30">
                    <div className="w-full h-full object-cover rounded-xl shadow-2xl border-2 border-white/20 bg-black flex items-center justify-center">
                        <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover rounded-xl ${hasMediaError ? 'hidden' : 'block'}`} />
                        {hasMediaError && <FiCameraOff size={32} className="text-slate-500"/>}
                    </div>
                     {isCameraOff && !hasMediaError && <div className="absolute inset-0 bg-slate-800/70 rounded-xl flex items-center justify-center"><FiCameraOff size={32} /></div>}
                 </motion.div>
            )}
 
             <motion.div initial={{y: 100}} animate={{y: 0}} className="absolute bottom-5 p-3 bg-slate-800/50 backdrop-blur-lg border border-white/10 rounded-full flex items-center gap-4 z-40">
                <ControlButton icon={<FiMic size={24}/>} offIcon={<FiMicOff size={24}/>} isToggled={isMuted} onToggle={toggleMute} />
                <ControlButton icon={<FiVideo size={24}/>} offIcon={<FiVideoOff size={24}/>} isToggled={isCameraOff} onToggle={toggleCamera} />
                <ControlButton icon={<FiMonitor size={24}/>} offIcon={<FiAirplay size={24}/>} isToggled={isSharingScreen} onToggle={handleToggleScreenShare} activeClass="bg-blue-500/80" disabled={!isScreenShareSupported} title={isScreenShareSupported ? "Udostępnij ekran" : "Udostępnianie ekranu nie jest wspierane"}/>
                 <div className="w-px h-8 bg-slate-600" />
                 <button onClick={handleHangUp} className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"><FiPhoneOff size={24} /></button>
             </motion.div>
 
             <AnimatePresence>
                 {isCallEnded && (
                     <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
                         <FiXCircle className="w-24 h-24 text-red-500 mb-4" />
                         <h2 className="text-4xl font-bold">Rozmowa zakończona</h2>
                     </motion.div>
                 )}
             </AnimatePresence>
        </div>
    );
}