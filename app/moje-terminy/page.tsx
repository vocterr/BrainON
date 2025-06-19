"use client";

import React, { useState, useEffect, useMemo, JSX } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { FiCalendar, FiClock, FiX, FiCheckCircle, FiArrowRight, FiMonitor, FiHome, FiMapPin, FiVideo, FiMap } from 'react-icons/fi';

// Typy danych dla TypeScriptu
type AppointmentStatus = 'completed' | 'upcoming';
type AppointmentType = 'online' | 'teacher_home' | 'student_home';

interface Appointment {
    id: number;
    subject: 'Matematyka' | 'INF.02';
    date: string; // Format YYYY-MM-DDTHH:mm:ss
    type: AppointmentType;
    status: AppointmentStatus;
    price: number;
    notes?: string;
}

// Przykładowe dane - w przyszłości będziesz je pobierać z API
const MOCK_APPOINTMENTS: Appointment[] = [
    { id: 1, subject: 'Matematyka', date: '2025-06-12T14:00:00', type: 'online', status: 'completed', price: 100, notes: 'Skupiliśmy się na funkcjach kwadratowych.' },
    { id: 2, subject: 'INF.02', date: '2025-06-17T16:00:00', type: 'teacher_home', status: 'completed', price: 120 },
    { id: 3, subject: 'Matematyka', date: '2025-06-21T10:00:00', type: 'online', status: 'upcoming', price: 100 },
    { id: 4, subject: 'Matematyka', date: '2025-06-24T12:00:00', type: 'student_home', status: 'upcoming', price: 150, notes: 'Proszę o przygotowanie zadań z ostatniej matury.' },
    { id: 5, subject: 'INF.02', date: '2025-07-01T11:00:00', type: 'online', status: 'upcoming', price: 100 },
];

const typeDetails = {
    online: { icon: <FiMonitor />, text: "Lekcja Online" },
    teacher_home: { icon: <FiHome />, text: "U mnie w domu" },
    student_home: { icon: <FiMapPin />, text: "Dojazd do ucznia" },
};

export default function MojeTerminyPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    // Symulacja ładowania danych
    useEffect(() => {
        // W przyszłości tutaj będzie fetch do Twojego API
        setAppointments(MOCK_APPOINTMENTS);
    }, []);

    const upcomingAppointments = useMemo(() => 
        appointments
            .filter(a => a.status === 'upcoming')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        [appointments]
    );

    const completedAppointments = useMemo(() => 
        appointments
            .filter(a => a.status === 'completed')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [appointments]
    );
    
    return (
        <div className="relative w-full min-h-screen bg-slate-900 text-white font-chewy overflow-x-hidden">
            {/* Tło Aurora Glow */}
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

                <div className="relative pl-8 border-l-2 border-slate-700/50">
                    {/* Sekcja: Nadchodzące */}
                    <SectionTitle title="Nadchodzące" />
                    {upcomingAppointments.map((app, index) => (
                        <AppointmentCard key={app.id} appointment={app} onSelect={setSelectedAppointment} isFirst={index === 0} />
                    ))}

                    {/* Sekcja: Zakończone */}
                    <SectionTitle title="Zakończone" />
                     {completedAppointments.map((app, index) => (
                        <AppointmentCard key={app.id} appointment={app} onSelect={setSelectedAppointment} isFirst={index === 0} />
                    ))}
                </div>
            </main>

            {/* Panel boczny ze szczegółami */}
            <AnimatePresence>
                {selectedAppointment && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 h-full w-full max-w-lg bg-slate-800/80 backdrop-blur-lg shadow-2xl z-50 p-8"
                    >
                        <button onClick={() => setSelectedAppointment(null)} className="absolute cursor-pointer top-6 right-6 p-2 rounded-full hover:bg-slate-700"><FiX/></button>
                        
                        <h2 className="text-4xl mb-2">{selectedAppointment.subject}</h2>
                        <div className="flex items-center gap-3 font-sans text-purple-200/80 mb-6">
                            {typeDetails[selectedAppointment.type].icon}
                            <span>{typeDetails[selectedAppointment.type].text}</span>
                        </div>
                        
                        <div className="space-y-4 font-sans text-lg border-t border-b border-slate-700 py-6">
                            <InfoRow icon={<FiCalendar />} label="Data" value={new Date(selectedAppointment.date).toLocaleDateString('pl-PL', {day: 'numeric', month: 'long', year: 'numeric'})} />
                            <InfoRow icon={<FiClock />} label="Godzina" value={new Date(selectedAppointment.date).toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})} />
                            <InfoRow icon={<span className="text-yellow-400 font-bold">zł</span>} label="Cena" value={`${selectedAppointment.price} zł`} />
                        </div>
                        
                        {selectedAppointment.notes && (
                            <div className="mt-6">
                                <h3 className="text-xl mb-2">Twoje uwagi:</h3>
                                <p className="font-sans text-slate-300 bg-slate-700/50 p-4 rounded-lg">{selectedAppointment.notes}</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Sub-komponenty dla czystości kodu

const SectionTitle = ({ title }: { title: string }) => (
    <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once: true, amount: 0.5}} className="relative mb-8">
        <div className="absolute top-1/2 -left-8 w-6 h-6 bg-slate-900 border-4 border-purple-500 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <h2 className="text-3xl">{title}</h2>
    </motion.div>
);

const AppointmentCard = ({ appointment, onSelect, isFirst }: { appointment: Appointment, onSelect: (app: Appointment) => void, isFirst: boolean }) => {
    const isUpcoming = appointment.status === 'upcoming';
    const cardColor = isUpcoming ? 'border-purple-500/30 hover:border-purple-400' : 'border-slate-700';
    const textColor = isUpcoming ? 'text-white' : 'text-slate-500';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            onClick={() => onSelect(appointment)}
            className={`relative mb-8 p-6 rounded-2xl bg-slate-800/50 border backdrop-blur-sm cursor-pointer transition-all duration-300 ${cardColor} ${textColor}`}
        >
            <div className="absolute top-1/2 -left-8 w-4 h-4 bg-slate-700 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className={`text-2xl ${!isUpcoming && 'line-through'}`}>{appointment.subject}</h3>
                    <div className="font-sans text-sm flex items-center gap-4 mt-1 text-purple-300/80">
                        <span>{new Date(appointment.date).toLocaleDateString('pl-PL', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                        <span>{new Date(appointment.date).toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}</span>
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-sans ${isUpcoming ? 'bg-cyan-500/10 text-cyan-300' : 'bg-slate-700 text-slate-400'}`}>
                    {isUpcoming ? <FiArrowRight/> : <FiCheckCircle/>}
                    <span>{isUpcoming ? 'Nadchodzące' : 'Zakończone'}</span>
                </div>
            </div>
        </motion.div>
    );
};

const InfoRow = ({ icon, label, value }: { icon: JSX.Element, label: string, value: string }) => (
    <div className="flex items-start justify-between">
        <span className="flex items-center gap-3 text-purple-200/80">{icon}{label}</span>
        <span className="text-right">{value}</span>
    </div>
);


