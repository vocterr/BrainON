"use client";

import React, { useState, useEffect, useMemo, useRef, JSX } from 'react';
import { motion } from "framer-motion";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { FiHome, FiLoader, FiMonitor, FiPhone, FiSlash, FiUser, FiWifiOff } from 'react-icons/fi';

// Typy danych
interface Student {
    id: string;
    name: string;
    email: string;
}
type AppointmentStatus = 'completed' | 'upcoming';
type AppointmentType = 'online' | 'teacher_home' | 'student_home';
interface AdminAppointment {
    id: number;
    student: Student;
    subject: 'Matematyka' | 'INF.02';
    date: string;
    type: AppointmentType;
    status: AppointmentStatus;
}

const MOCK_ADMIN_APPOINTMENTS: AdminAppointment[] = [
    { id: 1, student: { id: 'cmc3qswmk0000ucf433obrmy3', name: 'Jan Kowalski (Uczeń Testowy)', email: 'jan@example.com' }, subject: 'Matematyka', date: new Date(Date.now() + 86400000 * 2).toISOString(), type: 'online', status: 'upcoming' },
    { id: 2, student: { id: 'cmc3qswmk0000ucf433obrmy3', name: 'Anna Nowak (Uczeń Testowy)', email: 'anna@example.com' }, subject: 'INF.02', date: new Date(Date.now() + 86400000 * 3).toISOString(), type: 'teacher_home', status: 'upcoming' },
];

const typeDetails: Record<AppointmentType, { icon: JSX.Element, text: string }> = {
    online: { icon: <FiMonitor />, text: "Online" },
    teacher_home: { icon: <FiHome />, text: "U mnie" },
    student_home: { icon: <FiUser />, text: "U ucznia" },
};

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const socketRef = useRef<Socket | null>(null);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
    const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
    const [callStatuses, setCallStatuses] = useState<Record<string, 'calling' | 'ringing' | 'offline' | null>>({});

    useEffect(() => {
        if (status === "authenticated" && session?.user?.id) {
            const socket = io("http://localhost:3000");
            socketRef.current = socket;

            socket.emit('register-user', session.user.id);

            socket.on('call-status', ({ studentId, status: callStatus }) => {
                setCallStatuses(prev => ({ ...prev, [studentId]: callStatus }));
                if (callStatus === 'offline') {
                    setTimeout(() => setCallStatuses(prev => ({ ...prev, [studentId]: null })), 3000);
                }
            });

            socket.on('call-accepted-by-student', ({ roomId }) => {
                setCallStatuses({}); // Wyczyść statusy po przekierowaniu
                router.push(`/rozmowa/${roomId}`);
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [status, session, router]);

    useEffect(() => { setAppointments(MOCK_ADMIN_APPOINTMENTS); }, []);
    
    const handleInitiateCall = async (student: Student) => {
        setCallStatuses(prev => ({ ...prev, [student.id]: 'calling' }));
        try {
            const res = await fetch('/api/calls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: student.id }),
            });
            if (!res.ok) throw new Error('Nie udało się utworzyć pokoju.');
            const newRoom = await res.json();
            
            socketRef.current?.emit('initiate-call', {
                targetUserId: student.id,
                adminId: session?.user?.id,
                roomId: newRoom.id,
                callerName: session?.user?.name || 'Admin'
            });

        } catch (error: any) {
            console.error("Błąd podczas inicjowania rozmowy:", error);
            setCallStatuses(prev => ({ ...prev, [student.id]: 'offline' }));
            setTimeout(() => setCallStatuses(prev => ({ ...prev, [student.id]: null })), 3000);
        }
    };
    
    const filteredAppointments = useMemo(() =>
        appointments.filter(a => a.status === activeTab).sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA;
        }),
        [appointments, activeTab]
    );

    if (status === "loading") return <div className="flex items-center justify-center min-h-screen bg-slate-900"><FiLoader className="animate-spin text-white h-10 w-10"/></div>
    if (status !== "authenticated" || session.user?.role !== 'ADMIN') return <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white font-chewy"><FiSlash className="h-24 w-24 text-red-500 mb-4"/><h1 className="text-5xl">Brak dostępu</h1></div>

    return (
        <div className="w-full min-h-screen bg-slate-900 text-white font-sans">
            <main className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1 className="text-5xl sm:text-6xl font-chewy">Panel Administratora</h1>
                    <p className="mt-2 text-lg text-slate-400">Zarządzaj rezerwacjami i spotkaniami.</p>
                </motion.div>
                <motion.div initial={{ opacity: 0}} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-12 bg-slate-800/50 border border-slate-700 rounded-2xl">
                    <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                        <TabButton text="Nadchodzące" isActive={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')} count={appointments.filter(a => a.status === 'upcoming').length} />
                        <TabButton text="Zakończone" isActive={activeTab === 'completed'} onClick={() => setActiveTab('completed')} count={appointments.filter(a => a.status === 'completed').length} />
                    </div>
                    <div className="overflow-x-auto">
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
                                {filteredAppointments.map(app => (
                                    <tr key={app.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4"><div>{app.student.name}</div><div className="text-xs text-slate-400">{app.student.email}</div></td>
                                        <td className="p-4">{app.subject}</td>
                                        <td className="p-4">{new Date(app.date).toLocaleString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="p-4"><div className="flex items-center gap-2 text-sm">{typeDetails[app.type].icon}<span>{typeDetails[app.type].text}</span></div></td>
                                        <td className="p-4">{app.status === 'upcoming' && <CallButton status={callStatuses[app.student.id]} onClick={() => handleInitiateCall(app.student)}/>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredAppointments.length === 0 && <p className="p-8 text-center text-slate-500">Brak terminów w tej kategorii.</p>}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

const TabButton = ({ text, isActive, onClick, count }: { text: string, isActive: boolean, onClick: () => void, count: number }) => (
    <button onClick={onClick} className={`relative px-4 py-2 rounded-md text-sm transition-colors ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
        {text}
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300'}`}>{count}</span>
        {isActive && <motion.div layoutId="active-admin-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"/>}
    </button>
);

const CallButton = ({ status, onClick }: { status: 'calling' | 'ringing' | 'offline' | null, onClick: () => void }) => {
    const baseClasses = "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-300 w-28 justify-center";
    switch (status) {
        case 'calling': return <div className={`${baseClasses} bg-yellow-500/20 text-yellow-300`}><FiLoader className="animate-spin"/><span>Łączenie...</span></div>
        case 'ringing': return <div className={`${baseClasses} bg-cyan-500/20 text-cyan-300`}><FiPhone className="animate-pulse"/><span>Dzwonię...</span></div>
        case 'offline': return <div className={`${baseClasses} bg-red-500/20 text-red-300`}><FiWifiOff/><span>Offline</span></div>
        default: return <motion.button onClick={onClick} whileHover={{scale: 1.05}} whileTap={{scale: 0.95}} className={`${baseClasses} bg-green-500/20 text-green-300`}><FiPhone/><span>Zadzwoń</span></motion.button>
    }
};
