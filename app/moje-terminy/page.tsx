"use client";

import React, { useState, useEffect, useMemo, JSX } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiClock, FiX, FiCheckCircle, FiArrowRight, FiMonitor, FiHome, FiMapPin, FiVideo, FiMap, FiAlertTriangle } from 'react-icons/fi';

// KROK 1: Ujednolicamy typy, aby pasowały do schematu Prisma
// Używamy wielkich liter, tak jak w Twoim enum w bazie danych
type AppointmentStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
type AppointmentType = 'ONLINE' | 'TEACHER_HOME' | 'STUDENT_HOME';
type Subject = 'MATEMATYKA' | 'INF02';

// Ten interfejs opisuje, jak wyglądają dane przychodzące z naszego API
interface Appointment {
    id: string; // ID jest teraz stringiem, tak jak w bazie
    subject: Subject;
    date: string; // Data w formacie ISO
    type: AppointmentType;
    status: AppointmentStatus;
    price: number;
    notes?: string | null;
}

const typeDetails: Record<AppointmentType, { icon: JSX.Element, text: string }> = {
    ONLINE: { icon: <FiMonitor />, text: "Lekcja Online" },
    TEACHER_HOME: { icon: <FiHome />, text: "U mnie" },
    STUDENT_HOME: { icon: <FiMapPin />, text: "U ucznia" },
};

export default function MojeTerminyPage() {
    const { data: session, status: sessionStatus } = useSession();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getAppointments = async () => {
            if (sessionStatus === 'authenticated') {
                setIsLoading(true);
                setError(null);
                try {
                    const res = await fetch('/api/moje-terminy');
                    if (!res.ok) {
                        throw new Error('Nie udało się pobrać terminów.');
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
        getAppointments();
    }, [sessionStatus]);

    // KROK 2: Dodajemy jawny typ do zmiennych, aby TypeScript był zadowolony
    const upcomingAppointments: Appointment[] = useMemo(() =>
        appointments
            .filter(a => a.status === 'UPCOMING')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        [appointments]
    );

    const completedAppointments: Appointment[] = useMemo(() =>
        appointments
            .filter(a => a.status !== 'UPCOMING')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [appointments]
    );
    
    const renderContent = () => {
        if (isLoading || sessionStatus === 'loading') {
            return <AppointmentsSkeleton />;
        }
        if (error) {
            return <ErrorMessage message={error} />;
        }
        if (appointments.length === 0) {
            return <EmptyState />;
        }
        return (
            <>
                <SectionTitle title="Nadchodzące" />
                {upcomingAppointments.length > 0 ? upcomingAppointments.map((app, i) => (
                    <AppointmentCard key={app.id} appointment={app} onSelect={setSelectedAppointment} isFirst={i === 0} />
                )) : <p className="pl-8 text-slate-400 font-sans mb-12">Brak nadchodzących terminów.</p>}

                <SectionTitle title="Zakończone" />
                {completedAppointments.length > 0 ? completedAppointments.map((app, i) => (
                    <AppointmentCard key={app.id} appointment={app} onSelect={setSelectedAppointment} isFirst={i === 0} />
                )) : <p className="pl-8 text-slate-400 font-sans">Brak zakończonych lekcji.</p>}
            </>
        );
    };

    return (
        <div className="relative w-full min-h-screen bg-slate-900 text-white font-chewy overflow-x-hidden">
            <div className="absolute inset-0 -z-10 opacity-30">
                <motion.div animate={{ x: ['-5%', '5%', '-5%'], y: ['-10%', '10%', '-10%'] }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute top-[-50%] left-[-25%] w-[80rem] h-[80rem] bg-purple-600/50 rounded-full blur-3xl" />
                <motion.div animate={{ x: ['5%', '-5%', '5%'], y: ['10%', '-10%', '10%'] }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-50%] right-[-25%] w-[70rem] h-[70rem] bg-cyan-500/40 rounded-full blur-3xl" />
            </div>

            <main className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-16">
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-black">
                        Moje <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">Terminy</span>
                    </h1>
                    <p className="mt-4 font-sans text-lg text-purple-200/80">Tutaj znajdziesz historię swoich lekcji oraz nadchodzące spotkania.</p>
                </motion.div>

                <div className="relative border-l-2 border-slate-700/50">
                    {renderContent()}
                </div>
            </main>

            <AnimatePresence>
                {selectedAppointment && (
                    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed top-0 right-0 h-full w-full max-w-lg bg-slate-800/80 backdrop-blur-lg shadow-2xl z-50 p-8">
                        <button onClick={() => setSelectedAppointment(null)} className="absolute cursor-pointer top-6 right-6 p-2 rounded-full hover:bg-slate-700"><FiX /></button>
                        <h2 className="text-4xl mb-2">{selectedAppointment.subject}</h2>
                        <div className="flex items-center gap-3 font-sans text-purple-200/80 mb-6">{typeDetails[selectedAppointment.type].icon}<span>{typeDetails[selectedAppointment.type].text}</span></div>
                        <div className="space-y-4 font-sans text-lg border-t border-b border-slate-700 py-6">
                            <InfoRow icon={<FiCalendar />} label="Data" value={new Date(selectedAppointment.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })} />
                            <InfoRow icon={<FiClock />} label="Godzina" value={new Date(selectedAppointment.date).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })} />
                            <InfoRow icon={<span className="text-yellow-400 font-bold">zł</span>} label="Cena" value={`${selectedAppointment.price} zł`} />
                        </div>
                        {selectedAppointment.notes && (<div className="mt-6"><h3 className="text-xl mb-2">Twoje uwagi:</h3><p className="font-sans text-slate-300 bg-slate-700/50 p-4 rounded-lg">{selectedAppointment.notes}</p></div>)}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const SectionTitle = ({ title }: { title: string }) => (<motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.5 }} className="relative mb-8 ml-8"><div className="absolute top-1/2 -left-12 w-6 h-6 bg-slate-900 border-4 border-purple-500 rounded-full -translate-y-1/2"></div><h2 className="text-3xl">{title}</h2></motion.div>);
const AppointmentCard = ({ appointment, onSelect, isFirst }: { appointment: Appointment, onSelect: (app: Appointment) => void, isFirst: boolean }) => {
    const isUpcoming = appointment.status === 'UPCOMING';
    const cardColor = isUpcoming ? 'border-purple-500/30 hover:border-purple-400' : 'border-slate-700';
    const textColor = isUpcoming ? 'text-white' : 'text-slate-500';
    return (<motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5 }} onClick={() => onSelect(appointment)} className={`relative mb-8 ml-8 p-6 rounded-2xl bg-slate-800/50 border backdrop-blur-sm cursor-pointer transition-all duration-300 ${cardColor} ${textColor}`}> <div className="absolute top-1/2 -left-12 w-4 h-4 bg-slate-700 rounded-full -translate-y-1/2"></div><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h3 className={`text-2xl ${!isUpcoming && 'line-through'}`}>{appointment.subject}</h3><div className="font-sans text-sm flex items-center gap-4 mt-1 text-purple-300/80"><span>{new Date(appointment.date).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' })}</span><span>{new Date(appointment.date).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span></div></div><div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-sans ${isUpcoming ? 'bg-cyan-500/10 text-cyan-300' : 'bg-slate-700 text-slate-400'}`}>{isUpcoming ? <FiArrowRight /> : <FiCheckCircle />}<span>{isUpcoming ? 'Nadchodzące' : 'Zakończone'}</span></div></div></motion.div>);
};
const InfoRow = ({ icon, label, value }: { icon: JSX.Element, label: string, value: string }) => (<div className="flex items-start justify-between"><span className="flex items-center gap-3 text-purple-200/80">{icon}{label}</span><span className="text-right">{value}</span></div>);

const AppointmentsSkeleton = () => (<div className="relative pl-8">{[...Array(3)].map((_, i) => <div key={i} className="mb-8 p-6 rounded-2xl bg-slate-800/50 h-24 animate-pulse"><div className="w-2/3 h-6 bg-slate-700/50 rounded"></div><div className="w-1/3 h-4 bg-slate-700/50 rounded mt-3"></div></div>)}</div>);
const ErrorMessage = ({ message }: { message: string }) => (<div className="pl-8 flex flex-col items-center text-center"><FiAlertTriangle className="w-12 h-12 text-red-500 mb-4" /><h3 className="text-2xl">Wystąpił błąd</h3><p className="font-sans text-slate-400">{message}</p></div>);
const EmptyState = () => {
    const router = useRouter();
    return (<div className="pl-8 flex flex-col items-center text-center"><FiCalendar className="w-12 h-12 text-slate-600 mb-4" /><h3 className="text-2xl">Brak terminów</h3><p className="font-sans text-slate-400 mb-6">Nie masz jeszcze żadnych zaplanowanych ani zakończonych lekcji.</p><motion.button onClick={() => router.push('/zacznij-teraz')} whileHover={{ scale: 1.05 }} className="flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-500/20 text-purple-300 font-sans"><span>Zarezerwuj pierwszą lekcję</span><FiArrowRight/></motion.button></div>);
}

