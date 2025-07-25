"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from 'next-auth/react';
import { usePusher } from '@/lib/usePusher';
// Dodano ikony dla modalu
import { FiHome, FiLoader, FiMonitor, FiPhone, FiSlash, FiUser, FiWifiOff, FiAlertTriangle, FiPhoneOff, FiMoreVertical, FiX, FiMessageSquare, FiShare2 } from 'react-icons/fi';

// Definicje typów
interface Student { id: string; name: string | null; email: string | null; }
type AppointmentStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
type AppointmentType = 'ONLINE' | 'TEACHER_HOME' | 'STUDENT_HOME';
type Subject = 'MATEMATYKA' | 'INF02';

// Zaktualizowany typ AdminAppointment
interface AdminAppointment { 
    id: string; 
    student: Student; 
    subject: Subject; 
    date: string; 
    type: AppointmentType; 
    status: AppointmentStatus; 
    notes?: string | null;          // Dodane pole
    contactInfo?: string | null;    // Dodane pole
}

const typeDetails: Record<AppointmentType, { icon: React.ReactElement, text: string }> = { 
    ONLINE: { icon: <FiMonitor />, text: "Online" }, 
    TEACHER_HOME: { icon: <FiHome />, text: "U nauczyciela" }, 
    STUDENT_HOME: { icon: <FiUser />, text: "U ucznia" }, 
};

// Komponenty pomocnicze skopiowane z `moje-terminy`
const InfoRow = ({ icon, label, value }: { icon: React.ReactElement, label: string, value: string | null | undefined }) => {
    if (!value) return null;
    return (
        <div className="flex items-start justify-between">
            <span className="flex items-center gap-3 text-purple-200/80">{icon}{label}</span>
            <span className="text-right text-slate-300">{value}</span>
        </div>
    );
};

const TabButton = ({ text, isActive, onClick, count }: { text: string, isActive: boolean, onClick: () => void, count: number }) => (
    <button onClick={onClick} className={`relative px-4 py-2 rounded-md text-sm transition-colors ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`} > 
        {text} <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300'}`}>{count}</span> 
        {isActive && <motion.div layoutId="active-admin-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />} 
    </button>
);

const CallButton = ({ status, isOnline, onClick }: { status: 'calling' | 'ringing' | 'offline' | 'rejected' | 'accepted' | 'disconnected' | null, isOnline: boolean, onClick: () => void }) => { 
    const baseClasses = "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-300 w-32 justify-center";
    if (!isOnline) {
        return <div className={`${baseClasses} bg-slate-600/50 text-slate-400`}><FiWifiOff /><span>Offline</span></div>;
    }
    switch (status) { 
        case 'calling': return <div className={`${baseClasses} bg-yellow-500/20 text-yellow-300`}><FiLoader className="animate-spin" /><span>Łączenie...</span></div>; 
        case 'ringing': return <div className={`${baseClasses} bg-cyan-500/20 text-cyan-300`}><FiPhone className="animate-pulse" /><span>Dzwoni...</span></div>; 
        case 'rejected': return <div className={`${baseClasses} bg-red-500/20 text-red-400`}><FiPhoneOff /><span>Odrzucono</span></div>;
        case 'accepted': return <div className={`${baseClasses} bg-green-500/20 text-green-300`}><FiPhone /><span>Łączę...</span></div>;
        default: return <motion.button onClick={onClick} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`${baseClasses} bg-green-500/20 text-green-300 hover:bg-green-500/30`}><FiPhone /><span>Zadzwoń</span></motion.button>;
    } 
};

export default function AdminPage() {
    const { data: session, status: sessionStatus } = useSession();
    const { callStatus, isUserOnline, initiateCall, setCallStatus } = usePusher();

    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
    const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // Stan do przechowywania wybranej rezerwacji
    const [selectedAppointment, setSelectedAppointment] = useState<AdminAppointment | null>(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            if (sessionStatus !== 'authenticated') return;
            setIsLoading(true);
            try {
                const res = await fetch('/api/admin');
                if (!res.ok) throw new Error('Nie udało się pobrać terminów.');
                const data = await res.json();
                setAppointments(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAppointments();
    }, [sessionStatus]);
    
    const handleInitiateCall = async (student: Student) => {
        // ... (bez zmian)
        if (!isUserOnline(student.id)) {
            setCallStatus({ studentId: student.id, status: 'offline' });
            setTimeout(() => setCallStatus(null), 4000);
            return;
        }
        setCallStatus({ studentId: student.id, status: 'calling' });
        try {
            const res = await fetch('/api/calls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: student.id }),
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Nie udało się stworzyć pokoju.');
            const newRoom = await res.json();
            await initiateCall(newRoom.id, student.id, session?.user?.name || 'Admin');
        } catch (error: any) {
            alert(`Błąd: ${error.message}`);
            setCallStatus(null);
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

    if (sessionStatus === "loading") {
        return <div className="flex items-center justify-center min-h-screen bg-slate-900"><FiLoader className="animate-spin text-white h-10 w-10" /></div>;
    }
    if (sessionStatus !== "authenticated" || session?.user?.role !== 'ADMIN') {
        return <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white"><FiSlash className="h-24 w-24 text-red-500 mb-4" /><h1>Brak dostępu</h1></div>;
    }

    return (
        // Dodajemy `overflow-hidden` do głównego kontenera, aby zapobiec podwójnym suwakom
        <div className="w-full min-h-screen bg-slate-900 text-white font-sans overflow-hidden">
            <main className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1 className="text-5xl sm:text-6xl">Panel Administratora</h1>
                    <p className="mt-2 text-lg text-slate-400">Zarządzaj rezerwacjami i spotkaniami.</p>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-12 bg-slate-800/50 border border-slate-700 rounded-2xl">
                    <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                        <TabButton text="Nadchodzące" isActive={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')} count={upcomingAppointments.length} />
                        <TabButton text="Zakończone" isActive={activeTab === 'completed'} onClick={() => setActiveTab('completed')} count={completedAppointments.length} />
                    </div>
                    <div className="overflow-x-auto">
                        {isLoading ? ( <div className="p-8 text-center"><FiLoader className="animate-spin h-8 w-8 mx-auto text-slate-500" /></div> ) : 
                         error ? ( <div className="p-8 text-center text-red-400"><FiAlertTriangle /><span>{error}</span></div> ) : 
                         (
                            <table className="w-full text-left">
                                <thead className="border-b border-slate-700 text-sm text-slate-400">
                                    <tr>
                                        {/* Dodano nową kolumnę na końcu */}
                                        <th className="p-4">Uczeń</th><th className="p-4">Przedmiot</th><th className="p-4">Data i Godzina</th><th className="p-4">Forma</th><th className="p-4">Akcje</th><th className="p-4 text-right">Szczegóły</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedAppointments.length > 0 ? displayedAppointments.map((app) => (
                                        <tr key={app.id} className="border-b border-slate-800">
                                            <td className="p-4"><div>{app.student.name}</div><div className="text-xs text-slate-400">{app.student.email}</div></td>
                                            <td className="p-4">{app.subject}</td>
                                            <td className="p-4">{new Date(app.date).toLocaleString('pl-PL', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="p-4"><div className="flex items-center gap-2 text-sm">{typeDetails[app.type].icon}<span>{typeDetails[app.type].text}</span></div></td>
                                            <td className="p-4">
                                                {activeTab === 'upcoming' && app.type === 'ONLINE' && (
                                                    <CallButton
                                                        status={callStatus?.studentId === app.student.id ? callStatus.status : null}
                                                        isOnline={isUserOnline(app.student.id)}
                                                        onClick={() => handleInitiateCall(app.student)}
                                                    />
                                                )}
                                            </td>
                                            {/* Przycisk do otwierania modalu */}
                                            <td className="p-4 text-right">
                                                <button onClick={() => setSelectedAppointment(app)} className="p-2 rounded-md hover:bg-slate-700 text-slate-400 transition-colors">
                                                    <FiMoreVertical />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : ( <tr><td colSpan={6} className="p-8 text-center text-slate-500">Brak terminów w tej kategorii.</td></tr> )}
                                </tbody>
                            </table>
                         )}
                    </div>
                </motion.div>
            </main>

            {/* Boczny panel (modal) ze szczegółami */}
            <AnimatePresence>
                {selectedAppointment && (
                    <motion.div 
                        initial={{ x: '100%' }} 
                        animate={{ x: 0 }} 
                        exit={{ x: '100%' }} 
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }} 
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-800/80 backdrop-blur-lg shadow-2xl z-50 p-8 overflow-y-auto font-sans"
                    >
                        <button onClick={() => setSelectedAppointment(null)} className="absolute cursor-pointer top-6 right-6 p-2 rounded-full hover:bg-slate-700 text-white"><FiX /></button>
                        
                        <h2 className="text-3xl font-bold text-white mb-2">{selectedAppointment.student.name}</h2>
                        <p className="text-purple-200/80 mb-6">{selectedAppointment.student.email}</p>
                        
                        <div className="space-y-4 border-t border-b border-slate-700 py-6">
                            <InfoRow icon={<FiMonitor />} label="Przedmiot" value={selectedAppointment.subject} />
                            <InfoRow icon={<FiHome />} label="Forma" value={typeDetails[selectedAppointment.type].text} />
                        </div>
                        
                        {/* Sekcja z notatkami */}
                        {selectedAppointment.notes && (
                            <div className="mt-6">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><FiMessageSquare />Notatki ucznia:</h3>
                                <p className="text-slate-300 bg-slate-700/50 p-4 rounded-lg whitespace-pre-wrap">{selectedAppointment.notes}</p>
                            </div>
                        )}

                        {/* Sekcja z danymi kontaktowymi (dla lekcji online) */}
                        {selectedAppointment.contactInfo && (
                            <div className="mt-6">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><FiShare2 />Dane kontaktowe:</h3>
                                <p className="text-slate-300 bg-slate-700/50 p-4 rounded-lg">{selectedAppointment.contactInfo}</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}