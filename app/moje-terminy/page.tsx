// Plik: app/moje-terminy/page.tsx

"use client";

import React, { useState, useEffect, useMemo, JSX } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiClock, FiX, FiCheckCircle, FiArrowRight, FiMonitor, FiHome, FiMapPin, FiAlertTriangle, FiLoader, FiSlash, FiInfo, FiXCircle } from 'react-icons/fi';
import { useIsMobile } from '@/lib/useIsMobile';

type AppointmentStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
type AppointmentType = 'ONLINE' | 'TEACHER_HOME' | 'STUDENT_HOME';
type Subject = 'MATEMATYKA' | 'INF02';

// Zaktualizowano interfejs o pole paymentStatus
interface Appointment {
    id: string;
    subject: Subject;
    date: string;
    type: AppointmentType;
    status: AppointmentStatus;
    price: number;
    notes?: string | null;
    paymentStatus?: string | null; // 'PAID' lub null/inny
}

const typeDetails: Record<AppointmentType, { icon: JSX.Element, text: string }> = {
    ONLINE: { icon: <FiMonitor />, text: "Lekcja Online" },
    TEACHER_HOME: { icon: <FiHome />, text: "U mnie" },
    STUDENT_HOME: { icon: <FiMapPin />, text: "U ucznia" },
};

const statusDetails: Record<AppointmentStatus, { icon: JSX.Element, text: string, cardClass: string, textClass: string }> = {
    UPCOMING: { icon: <FiArrowRight />, text: "Nadchodzące", cardClass: 'border-purple-500/30 hover:border-purple-400', textClass: 'bg-cyan-500/10 text-cyan-300' },
    COMPLETED: { icon: <FiCheckCircle />, text: "Zakończone", cardClass: 'border-slate-700', textClass: 'bg-slate-700 text-slate-400' },
    CANCELLED: { icon: <FiSlash />, text: "Anulowane", cardClass: 'border-red-500/20', textClass: 'bg-red-500/10 text-red-400' },
};

const fallbackStatusDetails = statusDetails.COMPLETED;

export default function MojeTerminyPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const isMobile = useIsMobile();

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // Nowy stan do obsługi anulowania
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        const getAppointments = async () => {
            if (sessionStatus === 'authenticated') {
                setIsLoading(true);
                setError(null);
                try {
                    const res = await fetch('/api/moje-terminy');
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
                router.push('/login');
            }
        };
        if (sessionStatus !== 'loading') {
            getAppointments();
        }
    }, [sessionStatus, router]);

    // Nowa funkcja do obsługi anulowania spotkania
    const handleCancelAppointment = async (appointmentId: string) => {
        setIsCancelling(true);
        setError(null);
        try {
            const res = await fetch('/api/cancel-appointment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointmentId }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Nie udało się anulować terminu.');
            }

            const cancelledAppointment = await res.json();
            // Aktualizacja stanu lokalnego
            setAppointments(prev => 
                prev.map(app => app.id === appointmentId ? { ...app, status: 'CANCELLED' } : app)
            );
            setSelectedAppointment(null); // Zamknięcie modalu

        } catch (err: any) {
            alert(`Błąd: ${err.message}`);
        } finally {
            setIsCancelling(false);
        }
    };

    // POPRAWIONA LOGIKA FILTROWANIA
    const { upcomingAppointments, completedAppointments, cancelledAppointments } = useMemo(() => {
        const now = new Date();
        return {
            upcomingAppointments: appointments
                .filter(a => a.status === 'UPCOMING' && new Date(a.date) > now)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            completedAppointments: appointments
                .filter(a => a.status === 'COMPLETED' || (a.status === 'UPCOMING' && new Date(a.date) <= now))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            cancelledAppointments: appointments
                .filter(a => a.status === 'CANCELLED')
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        };
    }, [appointments]);

    const renderContent = () => {
        if (isLoading || sessionStatus === 'loading') return <AppointmentsSkeleton />;
        if (error) return <ErrorMessage message={error} />;
        if (sessionStatus === 'unauthenticated') return null;
        if (appointments.length === 0) return <EmptyState />;

        return (
            <>
                <SectionTitle title="Nadchodzące" isMobile={isMobile}/>
                {upcomingAppointments.length > 0 ? upcomingAppointments.map((app) => (
                    <AppointmentCard key={app.id} appointment={app} onSelect={setSelectedAppointment} isMobile={isMobile} />
                )) : <p className="pl-8 text-slate-400 font-sans mb-12">Brak nadchodzących terminów.</p>}

                <SectionTitle title="Zakończone" isMobile={isMobile} />
                {completedAppointments.length > 0 ? completedAppointments.map((app) => (
                    <AppointmentCard key={app.id} appointment={app} onSelect={setSelectedAppointment} isMobile={isMobile} />
                )) : <p className="pl-8 text-slate-400 font-sans mb-12">Brak zakończonych lekcji.</p>}
                
                {cancelledAppointments.length > 0 && (
                    <>
                        <SectionTitle title="Anulowane" isMobile={isMobile} />
                        {cancelledAppointments.map((app) => (
                            <AppointmentCard key={app.id} appointment={app} onSelect={setSelectedAppointment} isMobile={isMobile} />
                        ))}
                    </>
                )}
            </>
        );
    };

    return (
        <div className="relative w-full min-h-screen bg-slate-900 text-white font-chewy overflow-x-hidden">
            <div className="absolute inset-0 -z-10 opacity-30 hidden md:block">
                <motion.div animate={{ x: ['-5%', '5%', '-5%'], y: ['-10%', '10%', '-10%'] }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute top-[-50%] left-[-25%] w-[80rem] h-[80rem] bg-purple-600/50 rounded-full blur-3xl" />
                <motion.div animate={{ x: ['5%', '-5%', '5%'], y: ['10%', '-10%', '10%'] }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-50%] right-[-25%] w-[70rem] h-[70rem] bg-cyan-500/40 rounded-full blur-3xl" />
            </div>

            <main className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
                <motion.div initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-16">
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-black">Moje <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">Terminy</span></h1>
                    <p className="mt-4 font-sans text-lg text-purple-200/80">Tutaj znajdziesz historię swoich lekcji oraz nadchodzące spotkania.</p>
                </motion.div>

                <div className="relative border-l-2 border-slate-700/50">
                    {renderContent()}
                </div>
            </main>

            <AnimatePresence>
                {selectedAppointment && (
                    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed top-0 right-0 h-full w-full max-w-lg bg-slate-800/80 backdrop-blur-lg shadow-2xl z-[9999] p-8 overflow-y-auto">
                        <button onClick={() => setSelectedAppointment(null)} className="absolute cursor-pointer top-6 right-6 p-2 rounded-full hover:bg-slate-700"><FiX /></button>
                        <h2 className="text-4xl mb-2">{selectedAppointment.subject}</h2>
                        <div className="flex items-center gap-3 font-sans text-purple-200/80 mb-6">{typeDetails[selectedAppointment.type].icon}<span>{typeDetails[selectedAppointment.type].text}</span></div>
                        <div className="space-y-4 font-sans text-lg border-t border-b border-slate-700 py-6">
                            <InfoRow icon={<FiCalendar />} label="Data" value={new Date(selectedAppointment.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })} />
                            <InfoRow icon={<FiClock />} label="Godzina" value={new Date(selectedAppointment.date).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })} />
                            <InfoRow icon={<span className="text-yellow-400 font-bold">zł</span>} label="Cena" value={`${selectedAppointment.price} zł`} />
                        </div>
                        {selectedAppointment.notes && (<div className="mt-6"><h3 className="text-xl mb-2">Twoje uwagi:</h3><p className="font-sans text-slate-300 bg-slate-700/50 p-4 rounded-lg">{selectedAppointment.notes}</p></div>)}
                        
                        {/* NOWA SEKCJA: Anulowanie terminu */}
                        <CancellationSection 
                            appointment={selectedAppointment} 
                            onCancel={handleCancelAppointment} 
                            isCancelling={isCancelling} 
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Nowy komponent do obsługi sekcji anulowania
const CancellationSection = ({ appointment, onCancel, isCancelling }: { appointment: Appointment, onCancel: (id: string) => void, isCancelling: boolean }) => {
    if (appointment.status !== 'UPCOMING') return null;

    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    const canCancel = appointmentDate.getTime() > now.getTime() + 24 * 60 * 60 * 1000;

    return (
        <div className="mt-6 pt-6 border-t border-slate-700">
            <h3 className="text-xl mb-4">Zarządzaj terminem</h3>
            <div className="flex flex-col gap-4">
                <motion.button
                    onClick={() => onCancel(appointment.id)}
                    disabled={!canCancel || isCancelling}
                    whileHover={canCancel && !isCancelling ? { scale: 1.03 } : {}}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-sans font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:hover:bg-red-500/20"
                >
                    {isCancelling ? <FiLoader className="animate-spin" /> : <FiXCircle />}
                    <span>{isCancelling ? 'Anulowanie...' : 'Odwołaj lekcję'}</span>
                </motion.button>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-700/50 text-sm text-slate-400 font-sans">
                    <FiInfo className="w-5 h-5 mt-0.5 shrink-0" />
                    {canCancel ? (
                        <span>
                            Możesz bezpłatnie odwołać lekcję. Jeśli opłacono ją z góry przez Stripe, środki zostaną automatycznie zwrócone na Twoje konto.
                        </span>
                    ) : (
                        <span>
                            Jest za późno na bezpłatne odwołanie lekcji (mniej niż 24h do rozpoczęcia). Skontaktuj się w celu zmiany terminu.
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};


const SectionTitle = ({ title, isMobile }: { title: string, isMobile: boolean }) => (<motion.div initial={isMobile ? { opacity: 1 } : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.5 }} className="relative mb-8 ml-8"><div className="absolute top-1/2 -left-12 w-6 h-6 bg-slate-900 border-4 border-purple-500 rounded-full -translate-y-1/2"></div><h2 className="text-3xl">{title}</h2></motion.div>);
const AppointmentCard = ({ appointment, onSelect, isMobile }: { appointment: Appointment, onSelect: (app: Appointment) => void, isMobile: boolean }) => {
    const details = statusDetails[appointment.status] || fallbackStatusDetails;
    const isUpcoming = appointment.status === 'UPCOMING' && new Date(appointment.date) > new Date();
    const textColor = isUpcoming ? 'text-white' : 'text-slate-500';
    
    return (
        <motion.div 
            initial={isMobile ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true, amount: 0.5 }} 
            transition={{ duration: 0.5 }} 
            onClick={() => onSelect(appointment)} 
            className={`relative mb-8 ml-8 p-6 rounded-2xl bg-slate-800/50 border backdrop-blur-sm cursor-pointer transition-all duration-300 ${details.cardClass} ${textColor}`}
        >
            <div className="absolute top-1/2 -left-12 w-4 h-4 bg-slate-700 rounded-full -translate-y-1/2"></div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className={`text-2xl ${!isUpcoming && 'line-through'}`}>{appointment.subject}</h3>
                    <div className="font-sans text-sm flex items-center gap-4 mt-1 text-purple-300/80">
                        <span>{new Date(appointment.date).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <span>{new Date(appointment.date).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-sans ${details.textClass}`}>
                    {details.icon}
                    <span>{details.text}</span>
                </div>
            </div>
        </motion.div>
    );
};
const InfoRow = ({ icon, label, value }: { icon: JSX.Element, label: string, value: string }) => (<div className="flex items-start justify-between"><span className="flex items-center gap-3 text-purple-200/80">{icon}{label}</span><span className="text-right">{value}</span></div>);
const AppointmentsSkeleton = () => (<div className="relative pl-8">{[...Array(3)].map((_, i) => <div key={i} className="mb-8 p-6 rounded-2xl bg-slate-800/50 h-24 animate-pulse"><div className="w-1/3 h-6 bg-slate-700/50 rounded"></div><div className="w-1/2 h-4 bg-slate-700/50 rounded mt-3"></div></div>)}</div>);
const ErrorMessage = ({ message }: { message: string }) => (<div className="pl-8 flex flex-col items-center text-center"><FiAlertTriangle className="w-12 h-12 text-red-500 mb-4" /><h3 className="text-2xl">Wystąpił błąd</h3><p className="font-sans text-slate-400">{message}</p></div>);
const EmptyState = () => {
    const router = useRouter();
    return (<div className="pl-8 flex flex-col items-center text-center"><FiCalendar className="w-12 h-12 text-slate-600 mb-4" /><h3 className="text-2xl">Brak terminów</h3><p className="font-sans text-slate-400 mb-6">Nie masz jeszcze żadnych zaplanowanych ani zakończonych lekcji.</p><motion.button onClick={() => router.push('/zacznij-teraz')} whileHover={{ scale: 1.05 }} className="flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-500/20 text-purple-300 font-sans"><span>Zarezerwuj pierwszą lekcję</span><FiArrowRight/></motion.button></div>);
}
