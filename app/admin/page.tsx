// AdminPage.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from "framer-motion";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/contexts/SocketContext'; // <-- IMPORT THE HOOK
import { FiHome, FiLoader, FiMonitor, FiPhone, FiSlash, FiUser, FiWifiOff, FiAlertTriangle, FiPhoneOff } from 'react-icons/fi';

// Type definitions (assuming these are defined elsewhere or here)
interface Student { id: string; name: string | null; email: string | null; }
type AppointmentStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
type AppointmentType = 'ONLINE' | 'TEACHER_HOME' | 'STUDENT_HOME';
type Subject = 'MATEMATYKA' | 'INF02';
interface AdminAppointment { id: string; student: Student; subject: Subject; date: string; type: AppointmentType; status: AppointmentStatus; }
const typeDetails: Record<AppointmentType, { icon: React.ReactElement, text: string }> = { ONLINE: { icon: <FiMonitor />, text: "Online" }, TEACHER_HOME: { icon: <FiHome />, text: "U nauczyciela" }, STUDENT_HOME: { icon: <FiUser />, text: "U ucznia" }, };


export default function AdminPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const { socket, isConnected } = useSocket();

    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
    const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
    const [callStatuses, setCallStatuses] = useState<Record<string, 'calling' | 'ringing' | 'offline' | 'rejected' | 'disconnected' | null>>({});

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch appointments (no changes here)
    useEffect(() => {
        const fetchAppointments = async () => {
            if (sessionStatus === 'authenticated' && session?.user?.role === 'ADMIN') {
                setIsLoading(true);
                setError(null);
                try {
                    const res = await fetch('/api/admin');
                    if (!res.ok) {
                        const errorData = await res.json();
                        throw new Error(errorData.error || 'Nie udało się pobrać terminów.');
                    }
                    const data = await res.json();
                    setAppointments(data);
                } catch (err: any) {
                    setError(err.message || 'Wystąpił nieoczekiwany błąd.');
                } finally {
                    setIsLoading(false);
                }
            } else if (sessionStatus === 'unauthenticated') {
                setIsLoading(false);
            }
        };
        fetchAppointments();
    }, [sessionStatus, session?.user?.role]);

    // This useEffect is now ONLY for managing socket event listeners for this page.
    useEffect(() => {
        const handleCallAccepted = ({ roomId, studentId }: { roomId: string, studentId?: string }) => {
            console.log("Student accepted call, joining room:", roomId);

            if (studentId) {
                setCallStatuses(prev => ({ ...prev, [studentId]: null }));
            }

            // Now admin joins the room and navigates
            socket.emit('join-room', roomId);

            setTimeout(() => {
                router.push(`/rozmowa/${roomId}`);
            }, 500);
        };

        const handleCallStatus = ({ studentId, status: callStatus }: { studentId: string, status: 'ringing' | 'offline' | 'rejected' | 'disconnected' }) => {
            setCallStatuses(prev => ({ ...prev, [studentId]: callStatus }));
            if (callStatus === 'offline' || callStatus === 'rejected' || callStatus === 'disconnected') {
                setTimeout(() => setCallStatuses(prev => ({ ...prev, [studentId]: null })), 5000);
            }
        };

        const handlePeerDisconnected = ({ studentId }: { studentId: string }) => {
            handleCallStatus({ studentId, status: 'disconnected' });
        };

        const handleRoomJoined = ({ roomId, participants }: { roomId: string, participants: number }) => {
            console.log(`[AdminPage] Successfully joined room ${roomId} with ${participants} participants`);
        };

        socket.on('room-joined', handleRoomJoined);
        socket.on('call-status', handleCallStatus);
        socket.on('call-accepted-by-student', handleCallAccepted);
        socket.on('peer-disconnected', handlePeerDisconnected);

        return () => {
            socket.off('room-joined', handleRoomJoined);
            socket.off('call-status', handleCallStatus);
            socket.off('call-accepted-by-student', handleCallAccepted);
            socket.off('peer-disconnected', handlePeerDisconnected);
        };
    }, [socket, session?.user?.id, router]);

    const handleInitiateCall = async (student: Student) => {
    if (!socket.connected) {
        alert("Błąd połączenia z serwerem. Odśwież stronę.");
        return;
    }

    setCallStatuses(prev => ({ ...prev, [student.id]: 'calling' }));

    try {
        // Step 1: Create room in database
        const res = await fetch('/api/calls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: student.id }),
        });

        if (!res.ok) throw new Error('Failed to create room');

        const newRoom = await res.json();

        // Step 2: Admin joins the room FIRST (before sending invitation)
        console.log(`Admin joining room ${newRoom.id} immediately`);
        socket.emit('join-room', newRoom.id);

        // Step 3: Wait a moment for room join to complete, then send invitation
        setTimeout(() => {
            socket.emit('initiate-call', {
                targetUserId: student.id,
                adminId: session?.user?.id,
                roomId: newRoom.id,
                callerName: session?.user?.name || 'Admin'
            });
        }, 500);

        // Step 4: Set up listener for student acceptance
        const handleAcceptance = ({ roomId, studentId }: any) => {
            if (roomId === newRoom.id) {
                console.log("Student accepted, navigating to room");
                socket.off('call-accepted-by-student', handleAcceptance);
                // Admin is already in room, just navigate
                router.push(`/rozmowa/${roomId}`);
            }
        };

        socket.on('call-accepted-by-student', handleAcceptance);

        // Timeout after 30 seconds
        setTimeout(() => {
            socket.off('call-accepted-by-student', handleAcceptance);
            if (callStatuses[student.id] === 'calling') {
                setCallStatuses(prev => ({ ...prev, [student.id]: null }));
                socket.emit('leave-room', newRoom.id); // Leave room if call not accepted
            }
        }, 30000);

    } catch (error: any) {
        console.error("Call initiation error:", error);
        alert(`Błąd: ${error.message}`);
        setCallStatuses(prev => ({ ...prev, [student.id]: null }));
    }
};
    const { upcomingAppointments, completedAppointments } = useMemo(() => {
        const upcoming = appointments.filter(app => app.status === 'UPCOMING');
        const completed = appointments.filter(app => app.status !== 'UPCOMING');
        return {
            upcomingAppointments: upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            completedAppointments: completed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };
    }, [appointments]);

    const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : completedAppointments;

    if (sessionStatus === "loading") return <div className="flex items-center justify-center min-h-screen bg-slate-900"><FiLoader className="animate-spin text-white h-10 w-10" /></div>
    if (sessionStatus !== "authenticated" || session?.user?.role !== 'ADMIN') return <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white font-chewy"><FiSlash className="h-24 w-24 text-red-500 mb-4" /><h1 className="text-5xl">Brak dostępu</h1></div>

    return (
        <div className="w-full min-h-screen bg-slate-900 text-white font-sans">
            <main className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1 className="text-5xl sm:text-6xl font-chewy">Panel Administratora</h1>
                    <p className="mt-2 text-lg text-slate-400">Zarządzaj rezerwacjami i spotkaniami.</p>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-12 bg-slate-800/50 border border-slate-700 rounded-2xl">
                    <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                        <TabButton text="Nadchodzące" isActive={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')} count={upcomingAppointments.length} />
                        <TabButton text="Zakończone" isActive={activeTab === 'completed'} onClick={() => setActiveTab('completed')} count={completedAppointments.length} />
                    </div>
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-8 text-center"><FiLoader className="animate-spin h-8 w-8 mx-auto text-slate-500" /></div>
                        ) : error ? (
                            <div className="p-8 text-center text-red-400 flex flex-col items-center gap-2"><FiAlertTriangle /><span>{error}</span></div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="border-b border-slate-700 text-sm text-slate-400">
                                    <tr>
                                        <th className="p-4">Uczeń</th>
                                        <th className="p-4">Przedmiot</th>
                                        <th className="p-4">Data i Godzina</th>
                                        <th className="p-4">Forma</th>
                                        <th className="p-4">Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedAppointments.length > 0 ? displayedAppointments.map(app => (
                                        <tr key={app.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4">
                                                <div>{app.student.name}</div>
                                                <div className="text-xs text-slate-400">{app.student.email}</div>
                                            </td>
                                            <td className="p-4">{app.subject}</td>
                                            <td className="p-4">
                                                {new Date(app.date).toLocaleString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    {typeDetails[app.type].icon}
                                                    <span>{typeDetails[app.type].text}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {activeTab === 'upcoming' && app.type === 'ONLINE' && (
                                                    <CallButton
                                                        status={callStatuses[app.student.id]}
                                                        onClick={() => handleInitiateCall(app.student)}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-500">
                                                Brak terminów w tej kategorii.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

// TabButton and CallButton components remain unchanged
const TabButton = ({ text, isActive, onClick, count }: { text: string, isActive: boolean, onClick: () => void, count: number }) => (<button onClick={onClick} className={`relative px-4 py-2 rounded-md text-sm transition-colors ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`} > {text} <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300'}`}> {count} </span> {isActive && <motion.div layoutId="active-admin-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />} </button>);
const CallButton = ({ status, onClick }: { status: 'calling' | 'ringing' | 'offline' | 'rejected' | 'disconnected' | null, onClick: () => void }) => { const baseClasses = "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-300 w-32 justify-center"; switch (status) { case 'calling': return (<div className={`${baseClasses} bg-yellow-500/20 text-yellow-300`}> <FiLoader className="animate-spin" /> <span>Łączenie...</span> </div>); case 'ringing': return (<div className={`${baseClasses} bg-cyan-500/20 text-cyan-300`}> <FiPhone className="animate-pulse" /> <span>Dzwonię...</span> </div>); case 'offline': return (<div className={`${baseClasses} bg-red-500/20 text-red-400`}> <FiWifiOff /> <span>Offline</span> </div>); case 'rejected': return (<div className={`${baseClasses} bg-red-500/20 text-red-400`}> <FiPhoneOff /> <span>Odrzucono</span> </div>); case 'disconnected': return (<div className={`${baseClasses} bg-orange-500/20 text-orange-400`}> <FiWifiOff /> <span>Rozłączono</span> </div>); default: return (<motion.button onClick={onClick} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`${baseClasses} bg-green-500/20 text-green-300 hover:bg-green-500/30`} > <FiPhone /> <span>Zadzwoń</span> </motion.button>); } };