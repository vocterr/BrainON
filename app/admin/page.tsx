"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from 'next-auth/react';
import { usePusher } from '@/lib/usePusher';
// Dodano ikony dla modalu i przycisków akcji
import { FiHome, FiLoader, FiMonitor, FiPhone, FiSlash, FiUser, FiWifiOff, FiAlertTriangle, FiPhoneOff, FiMoreVertical, FiX, FiMessageSquare, FiShare2, FiCheckCircle, FiXCircle, FiFacebook, FiPhoneCall, FiLink } from 'react-icons/fi'; // Dodano FiPhoneCall i FiLink
import { FaDiscord } from 'react-icons/fa';

// Definicje typów
interface Student { id: string; name: string | null; email: string | null; }
// Zaktualizowano status zgodnie z prośbą
type AppointmentStatus = 'UPCOMING' | 'COMPLETED' | 'NOT_COMPLETED';
type AppointmentType = 'ONLINE' | 'TEACHER_HOME' | 'STUDENT_HOME';
type Subject = 'MATEMATYKA' | 'INF02';
type ContactMethod = 'DISCORD' | 'MESSENGER' | 'WHATSAPP' | 'OTHER';

// Zaktualizowany typ AdminAppointment - ZMIANA TUTAJ
interface AdminAppointment { 
    id: string; 
    student: Student; 
    subject: Subject; 
    date: string; 
    type: AppointmentType; 
    status: AppointmentStatus; 
    notes?: string | null;
    contactInfo?: { // Zaktualizowany typ contactInfo
        method: ContactMethod;
        details: string;
    } | null;
}

const typeDetails: Record<AppointmentType, { icon: React.ReactElement, text: string }> = { 
    ONLINE: { icon: <FiMonitor />, text: "Online" }, 
    TEACHER_HOME: { icon: <FiHome />, text: "U nauczyciela" }, 
    STUDENT_HOME: { icon: <FiUser />, text: "U ucznia" }, 
};

// Nowe mapowanie dla metod kontaktu - ZMIANA TUTAJ
const contactMethodDetails: Record<ContactMethod, { icon: React.ReactElement, text: string }> = {
    DISCORD: { icon: <FaDiscord />, text: "Discord" },
    MESSENGER: { icon: <FiFacebook />, text: "Messenger (Facebook)" },
    WHATSAPP: { icon: <FiPhoneCall />, text: "WhatsApp / Telefon" },
    OTHER: { icon: <FiShare2 />, text: "Inna" },
};

// Komponenty pomocnicze
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
    const [selectedAppointment, setSelectedAppointment] = useState<AdminAppointment | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

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

    const handleUpdateStatus = async (appointmentId: string, newStatus: 'COMPLETED' | 'NOT_COMPLETED') => {
        setIsUpdating(true);
        try {
            const res = await fetch('/api/admin', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointmentId, status: newStatus }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Nie udało się zaktualizować statusu.');
            }

            const updatedAppointment = await res.json();

            setAppointments(prev => 
                prev.map(app => app.id === appointmentId ? { ...app, status: updatedAppointment.status } : app)
            );

            setSelectedAppointment(null);

        } catch (err: any) {
            alert(`Błąd: ${err.message}`);
        } finally {
            setIsUpdating(false);
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

    // Funkcja pomocnicza do sprawdzania, czy string to URL
    const isValidUrl = (str: string) => {
        try {
            new URL(str);
            return true;
        } catch (e) {
            return false;
        }
    };

    return (
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

            <AnimatePresence>
                {selectedAppointment && (
                    <motion.div 
                        initial={{ x: '100%' }} 
                        animate={{ x: 0 }} 
                        exit={{ x: '100%' }} 
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }} 
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-800/80 backdrop-blur-lg shadow-2xl z-[9999] p-8 overflow-y-auto font-sans"
                    >
                        <button onClick={() => setSelectedAppointment(null)} className="absolute cursor-pointer top-6 right-6 p-2 rounded-full hover:bg-slate-700 text-white"><FiX /></button>
                        
                        <h2 className="text-3xl font-bold text-white mb-2">{selectedAppointment.student.name}</h2>
                        <p className="text-purple-200/80 mb-6">{selectedAppointment.student.email}</p>
                        
                        <div className="space-y-4 border-t border-b border-slate-700 py-6">
                            <InfoRow icon={<FiMonitor />} label="Przedmiot" value={selectedAppointment.subject} />
                            <InfoRow icon={<FiHome />} label="Forma" value={typeDetails[selectedAppointment.type].text} />
                        </div>
                        
                        {selectedAppointment.notes && (
                            <div className="mt-6">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><FiMessageSquare />Notatki ucznia:</h3>
                                <p className="text-slate-300 bg-slate-700/50 p-4 rounded-lg whitespace-pre-wrap">{selectedAppointment.notes}</p>
                            </div>
                        )}

                        {/* ZMIANA: Obsługa wyświetlania contactInfo */}
                        {selectedAppointment.contactInfo && (
                            <div className="mt-6">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><FiShare2 />Dane kontaktowe:</h3>
                                <div className="bg-slate-700/50 p-4 rounded-lg flex items-center gap-3">
                                    {contactMethodDetails[selectedAppointment.contactInfo.method]?.icon}
                                    <div className="flex-1">
                                        <p className="text-slate-300 text-sm font-semibold">
                                            {contactMethodDetails[selectedAppointment.contactInfo.method]?.text || 'Nieznana metoda'}
                                        </p>
                                        {isValidUrl(selectedAppointment.contactInfo.details) ? (
                                            <a 
                                                href={selectedAppointment.contactInfo.details.startsWith('http') ? selectedAppointment.contactInfo.details : `https://${selectedAppointment.contactInfo.details}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-blue-400 hover:underline flex items-center gap-1 text-sm break-all"
                                            >
                                                {selectedAppointment.contactInfo.details} <FiLink className="text-xs" />
                                            </a>
                                        ) : (
                                            <p className="text-slate-300 text-sm break-all">{selectedAppointment.contactInfo.details}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedAppointment.status === 'UPCOMING' && (
                            <div className="mt-6 pt-6 border-t border-slate-700">
                                <h3 className="text-lg font-semibold text-white mb-3">Zmień status spotkania</h3>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button 
                                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'COMPLETED')}
                                        disabled={isUpdating}
                                        className="flex-1 flex items-center justify-center gap-2 bg-green-500/20 text-green-300 hover:bg-green-500/30 rounded-lg py-2.5 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUpdating ? <FiLoader className="animate-spin" /> : <><FiCheckCircle /> Ukończono</>}
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'NOT_COMPLETED')}
                                        disabled={isUpdating}
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg py-2.5 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUpdating ? <FiLoader className="animate-spin" /> : <><FiXCircle /> Nie ukończono</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}