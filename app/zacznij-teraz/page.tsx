"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { JSX, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowRight, FiCalendar, FiChevronLeft, FiChevronRight, FiLoader } from 'react-icons/fi';
import { useIsMobile } from '@/lib/useIsMobile';

type BookedSlots = {
    [date: string]: string[];
}

const timeSlots: string[] = ["15:00", "16:30", "18:00", "19:30", "21:00"]

export default function ZacznijTerazPage() {
    const router = useRouter();
    const isMobile = useIsMobile();
    
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [isBooking, setIsBooking] = useState<boolean>(false);
    const [bookedSlots, setBookedSlots] = useState<BookedSlots>({});
    const [isCalendarLoading, setIsCalendarLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchBookedSlots = async () => {
            try {
                const response = await fetch('/api/appointments/booked-slots');
                if (!response.ok) throw new Error('Nie udało się pobrać danych');
                const data: BookedSlots = await response.json();
                setBookedSlots(data);
            } catch (error) {
                console.error("Błąd pobierania terminów:", error);
            } finally {
                setIsCalendarLoading(false);
            }
        };
        fetchBookedSlots();
    }, []);

    const handleDateSelect = (day: Date) => {
        if (isPast(day)) return;
        const dateString = day.toISOString().split('T')[0];
        const currentBookedSlots = bookedSlots[dateString] || [];
        if (currentBookedSlots.length === timeSlots.length) return;
        setSelectedDate(day);
        setSelectedTime('');
    };

    const handleMonthChange = (offset: number) => {
        setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() + offset, 1));
    };
    
    const handleBooking = async () => {
        if (!selectedDate || !selectedTime) return;

        setIsBooking(true);
        
        // ==================================================================
        // POPRAWKA BŁĘDU STREFY CZASOWEJ
        // Ręcznie budujemy datę w formacie YYYY-MM-DD, ignorując UTC.
        // ==================================================================
        const year = selectedDate.getFullYear();
        const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0'); // +1 bo miesiące są 0-indeksowane
        const day = selectedDate.getDate().toString().padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        // ==================================================================
        
        const timeString = selectedTime.replace(':', '-');

        await new Promise(resolve => setTimeout(resolve, 800));

        router.push(`/wybierz-termin/${dateString}_${timeString}`);
    };

    const generateCalendar = (): JSX.Element[] => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days: JSX.Element[] = [];
        const emptySlots = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);

        for (let i = 0; i < emptySlots; i++) {
            days.push(<div key={`empty-${i}`} className="w-full h-16"></div>);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayDate = new Date(year, month, i);
            const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
            const booked = bookedSlots[dateString] || [];
            const isFullyBooked = booked.length >= timeSlots.length;
            const isPastDay = isPast(dayDate);
            const isSelected = selectedDate?.toDateString() === dayDate.toDateString();
            let dayClass = "cursor-pointer text-green-400 hover:bg-green-500/10";
            if (isPastDay) dayClass = "text-slate-600 cursor-not-allowed";
            else if (isFullyBooked) dayClass = "text-red-500 cursor-not-allowed line-through";
            if(isSelected) dayClass += " bg-gradient-to-br from-yellow-400 to-orange-500 text-slate-900 font-bold";
            days.push(<motion.div key={i} onClick={() => handleDateSelect(dayDate)} className={`w-full h-16 flex items-center justify-center rounded-lg transition-colors ${dayClass}`} whileHover={!isPastDay && !isFullyBooked ? { scale: 1.05 } : {}}>{i}</motion.div>);
        }
        return days;
    };
    
    const isPast = (day: Date): boolean => {
        const today = new Date();
        today.setHours(0,0,0,0);
        return day < today;
    };

    return (
        <div className="relative w-full min-h-screen bg-slate-900 text-white font-chewy overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-30 hidden md:block">
                <motion.div animate={{ x: ['-5%', '5%', '-5%'], y: ['-10%', '10%', '-10%'] }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute top-[-50%] left-[-25%] w-[80rem] h-[80rem] bg-purple-600/50 rounded-full blur-3xl" />
                <motion.div animate={{ x: ['5%', '-5%', '5%'], y: ['10%', '-10%', '10%'] }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-50%] right-[-25%] w-[70rem] h-[70rem] bg-cyan-500/40 rounded-full blur-3xl" />
            </div>

            <main className="max-w-7xl mt-12 md:mt-0 mx-auto px-4 py-16 sm:py-24 relative z-10">
                <motion.div initial={isMobile ? {opacity:1, y:0} : { opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-black">Zarezerwuj <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">swój termin</span></h1>
                    <p className="mt-4 font-sans text-lg text-purple-200/80">Wybierz dogodny dzień i godzinę. Rozpocznijmy razem Twoją podróż do sukcesu!</p>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    <motion.div initial={isMobile ? {opacity:1, scale:1} : { opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="lg:col-span-2 relative p-1">
                        <div className="relative p-6 bg-slate-900/80 rounded-3xl backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-4">
                                <button onClick={() => handleMonthChange(-1)} className="p-2 cursor-pointer rounded-full hover:bg-slate-700 transition-colors"><FiChevronLeft size={24} /></button>
                                <h2 className="text-3xl text-center">{currentDate.toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}</h2>
                                <button onClick={() => handleMonthChange(1)} className="p-2 cursor-pointer rounded-full hover:bg-slate-700 transition-colors"><FiChevronRight size={24} /></button>
                            </div>
                            <div className="grid grid-cols-7 gap-2 text-center text-slate-400 font-sans mb-2">
                                {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map(day => <div key={day}>{day}</div>)}
                            </div>
                            <div className="grid grid-cols-7 gap-2 relative">
                                {isCalendarLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-xl col-span-7 h-96">
                                        <FiLoader className="text-4xl text-cyan-400 animate-spin" />
                                    </div>
                                ) : ( generateCalendar() )}
                            </div>
                            <div className="mt-6 flex flex-wrap justify-center gap-4 font-sans text-sm">
                                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500/50 border border-green-400"/><span>Dostępny</span></div>
                                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500/50 border border-red-400"/><span>Zajęty</span></div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="lg:col-span-1">
                        <AnimatePresence>
                            {selectedDate && (
                                <motion.div 
                                    initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: isMobile ? 0 : 20 }}
                                    transition={{ duration: 0.3 }}
                                    className="p-8 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-lg"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <FiCalendar className="text-cyan-400"/>
                                        <h3 className="text-2xl text-white">Rezerwacja terminu</h3>
                                    </div>
                                    <p className="font-sans text-xl mb-6 text-yellow-400">{selectedDate.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                    <div className="mb-6">
                                        <p className="font-sans text-purple-200/80 mb-3">Wybierz godzinę:</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {timeSlots.map(time => {
                                                const dateString = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;
                                                const isBooked = (bookedSlots[dateString] || []).includes(time);
                                                return (
                                                    <button key={time} onClick={() => setSelectedTime(time)} disabled={isBooked} className={`p-3 cursor-pointer rounded-lg font-sans transition-all duration-200 ${isBooked ? "bg-slate-700 text-slate-500 cursor-not-allowed" : selectedTime === time ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-bold" : "bg-slate-700/50 hover:bg-purple-500/20"}`}>
                                                        {time}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <motion.button onClick={handleBooking} disabled={!selectedTime || isBooking} className="w-full cursor-pointer flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xl shadow-lg hover:shadow-purple-500/40 transition-shadow disabled:opacity-50" whileHover={{scale: !selectedTime || isBooking ? 1 : 1.02}} whileTap={{scale: !selectedTime || isBooking ? 1 : 0.98}}>
                                        {isBooking ? ( <motion.div animate={{rotate: 360}} transition={{duration: 1, repeat: Infinity, ease: 'linear'}}><FiLoader/></motion.div> ) : ( <><span>Potwierdź</span><FiArrowRight/></> )}
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}