"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiMonitor, FiHome, FiArrowRight, FiLoader, FiLogIn, FiDivideCircle, FiCode, FiCreditCard } from 'react-icons/fi';
import { loadStripe } from '@stripe/stripe-js';
import { useSession } from 'next-auth/react';
import { useIsMobile } from '@/lib/useIsMobile';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Subject = 'MATEMATYKA' | 'INF02';
type OptionType = 'ONLINE' | 'TEACHER_HOME' | 'STUDENT_HOME';

export default function WybierzTerminPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const params = useParams();
    const details = params.details as string;
    const isMobile = useIsMobile();

    // ==================================================================
    // POPRAWKA BŁĘDU DATY
    // Ręcznie parsujemy datę, aby uniknąć problemów ze strefami czasowymi
    // ==================================================================
    const [dateStr, timeStrWithDash] = details ? details.split('_') : [null, null];
    const time = timeStrWithDash ? timeStrWithDash.replace('-', ':') : null;
    
    let date: Date | null = null;
    if (dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        // Tworzymy datę w lokalnej strefie czasowej, co jest poprawne.
        // Miesiące w JS są 0-indeksowane, więc odejmujemy 1.
        date = new Date(year, month - 1, day);
    }
    // ==================================================================

    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [selectedOption, setSelectedOption] = useState<OptionType | null>(null);
    const [notes, setNotes] = useState('');
    const [formattedDate, setFormattedDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isBookingOnSite, setIsBookingOnSite] = useState(false); 
    const [error, setError] = useState('');

    useEffect(() => {
        if (date) {
            const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            setFormattedDate(date.toLocaleDateString('pl-PL', options));
        }
    }, [date]);
    
    const getBookingData = () => {
        if (!selectedOption || !selectedSubject || !session?.user?.id || !date || !time) {
            setError("Proszę wybrać przedmiot i formę zajęć.");
            return null;
        }

        const selectedOptionDetails = options.find(o => o.id === selectedOption);
        // Tworzymy nowy obiekt daty, aby nie modyfikować oryginalnego
        const appointmentDateTime = new Date(date);
        const [hours, minutes] = time.split(':');
        appointmentDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        return {
            userId: session.user.id,
            appointmentDateTime: appointmentDateTime.toISOString(), // toISOString() jest teraz bezpieczne
            subject: selectedSubject,
            option: {
                id: selectedOptionDetails?.id,
                title: selectedOptionDetails?.title,
            },
            price: pricing[selectedOption],
            notes: notes,
        };
    };

    const handlePayment = async () => {
        const bookingData = getBookingData();
        if (!bookingData) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('/api/checkout_sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Wystąpił błąd serwera.');
            const { sessionId } = data;
            const stripe = await stripePromise;
            if (stripe) await stripe.redirectToCheckout({ sessionId });
        } catch (err: any) {
            setError(err.message || "Wystąpił nieoczekiwany błąd.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleBookOnSite = async () => {
        const bookingData = getBookingData();
        if (!bookingData) return;
        setIsBookingOnSite(true);
        setError('');
        try {
            const response = await fetch('/api/book-on-site', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Nie udało się zarezerwować terminu.');
            }
            router.push('/rezerwacja-sukces');
        } catch (err: any) {
            setError(err.message || "Wystąpił nieoczekiwany błąd.");
        } finally {
            setIsBookingOnSite(false);
        }
    };

    // Reszta kodu (dane, JSX) pozostaje bez zmian.
    
    const pricing = { ONLINE: 100, TEACHER_HOME: 120, STUDENT_HOME: 150 };
    const subjects = [
        { id: 'MATEMATYKA' as Subject, icon: <FiDivideCircle />, title: 'Matematyka' },
        { id: 'INF02' as Subject, icon: <FiCode />, title: 'Informatyka (INF.02)' },
    ];
    const options = [
        { id: 'ONLINE' as OptionType, icon: <FiMonitor />, title: 'Lekcja Online', description: 'Przez Discord, Google Meet lub inną platformę.', price: pricing.ONLINE },
        { id: 'TEACHER_HOME' as OptionType, icon: <FiHome />, title: 'U mnie w domu', description: 'Zapraszam do mojego miejsca pracy.', price: pricing.TEACHER_HOME },
        { id: 'STUDENT_HOME' as OptionType, icon: <FiMapPin />, title: 'Dojazd do ucznia', description: 'Na terenie miasta.', price: pricing.STUDENT_HOME },
    ];
    
    if (!date || !time || !details) {
        return (
             <main className="w-full min-h-screen bg-slate-900 text-white font-chewy flex flex-col items-center justify-center p-4">
                 <h1 className="text-4xl text-red-500 mb-4">Błąd</h1>
                 <p className="font-sans text-lg text-slate-300">Nieprawidłowy link rezerwacji. Wróć do kalendarza i spróbuj ponownie.</p>
             </main>
        )
    }

    const showPayOnSiteButton = session?.user && (selectedOption === 'TEACHER_HOME' || selectedOption === 'STUDENT_HOME');

    return (
        <main className="w-full min-h-screen relative bg-slate-900 text-white font-chewy overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-30 hidden md:block">
                <motion.div animate={{ x: ['-5%', '5%', '-5%'], y: ['-10%', '10%', '-10%'] }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute top-[-50%] right-[-25%] w-[80rem] h-[80rem] bg-purple-600/50 rounded-full blur-3xl" />
                <motion.div animate={{ x: ['5%', '-5%', '5%'], y: ['10%', '-10%', '10%'] }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-50%] left-[-25%] w-[70rem] h-[70rem] bg-orange-500/40 rounded-full blur-3xl" />
            </div>

            <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 relative z-10">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-black">Dopracujmy <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-orange-400">szczegóły</span></h1>
                    <p className="mt-4 font-sans text-lg text-purple-200/80">Już prawie gotowe! Wybierz przedmiot, formę zajęć i sfinalizuj rezerwację.</p>
                </motion.div>

                <div className="grid lg:grid-cols-5 gap-8 items-start">
                    <motion.div initial={isMobile ? {opacity:1} : { opacity: 0}} animate={{opacity: 1}} transition={{staggerChildren: 0.1}} className="lg:col-span-3 flex flex-col gap-8">
                        <motion.div variants={{hidden: {opacity:0, y:20}, visible: {opacity:1, y:0}}}>
                            <h3 className="text-2xl mb-4">Krok 1: Wybierz przedmiot</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {subjects.map(subject => (
                                    <div key={subject.id} onClick={() => setSelectedSubject(subject.id)} className={`p-6 rounded-2xl bg-slate-800/50 border-2 backdrop-blur-sm cursor-pointer transition-all duration-300 ${selectedSubject === subject.id ? 'border-purple-500' : 'border-slate-700 hover:border-slate-600'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-lg bg-slate-700 text-purple-300 text-2xl`}>{subject.icon}</div>
                                            <h3 className="text-2xl text-white">{subject.title}</h3>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div variants={{hidden: {opacity:0, y:20}, visible: {opacity:1, y:0}}}>
                            <h3 className="text-2xl mb-4">Krok 2: Wybierz formę zajęć</h3>
                            {options.map(option => (
                                <motion.div key={option.id} onClick={() => setSelectedOption(option.id)} className={`p-6 rounded-2xl bg-slate-800/50 border-2 backdrop-blur-sm cursor-pointer transition-all duration-300 mb-4 ${selectedOption === option.id ? 'border-purple-500' : 'border-slate-700 hover:border-slate-600'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg bg-slate-700 text-purple-300 text-2xl`}>{option.icon}</div>
                                        <div>
                                            <h3 className="text-2xl text-white">{option.title}</h3>
                                            <p className="font-sans text-sm text-purple-200/70">{option.description}</p>
                                        </div>
                                        <p className="ml-auto text-2xl text-white">{option.price} zł</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                        
                        <motion.div variants={{hidden: {opacity: 0, y: 20}, visible: {opacity: 1, y: 0}}}>
                            <h3 className="text-2xl mb-3">Krok 3: Dodatkowe uwagi (opcjonalnie)</h3>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Np. 'Proszę o skupienie się na zadaniach z optymalizacji'..." className="w-full h-32 p-4 rounded-xl bg-slate-800/50 border border-slate-700 font-sans text-base text-white outline-none focus:border-purple-400 transition-colors" />
                        </motion.div>
                    </motion.div>
                    
                    <motion.div initial={isMobile ? {opacity:1, x:0} : {opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} transition={{delay: 0.3}} className="lg:col-span-2 sticky top-24">
                        <div className="p-8 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-lg">
                            <h2 className="text-3xl border-b border-purple-500/20 pb-4 mb-4">Podsumowanie</h2>
                            <div className="space-y-4 font-sans text-lg">
                                <div className="flex justify-between">
                                    <span className="text-purple-200/80">Wybrany termin:</span>
                                    <span className="text-white text-right">{formattedDate}<br/>godz. {time}</span>
                                </div>
                                {selectedSubject && (<div className="flex justify-between items-center"><span className="text-purple-200/80">Przedmiot:</span><span className="text-white">{subjects.find(s => s.id === selectedSubject)?.title}</span></div>)}
                                {selectedOption && ( <div className="flex justify-between items-center"><span className="text-purple-200/80">Forma zajęć:</span><span className="text-white">{options.find(o => o.id === selectedOption)?.title}</span></div>)}
                                <div className="border-t border-purple-500/20 my-4"></div>
                                <div className="flex justify-between text-2xl font-bold">
                                    <span className="text-purple-200/80">Do zapłaty:</span>
                                    <span className="text-yellow-400">{selectedOption ? pricing[selectedOption] : '---'} zł</span>
                                </div>
                            </div>
                            
                            {error && <p className="mt-4 text-center text-red-400 font-sans">{error}</p>}

                            {session?.user ? (
                                <>
                                    <motion.button onClick={handlePayment} disabled={!selectedOption || !selectedSubject || isLoading || isBookingOnSite} className="w-full mt-8 flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xl shadow-lg hover:shadow-orange-500/40 transition-shadow disabled:opacity-50" whileHover={{scale: !selectedOption || !selectedSubject || isLoading || isBookingOnSite ? 1 : 1.02}} whileTap={{scale: !selectedOption || !selectedSubject || isLoading || isBookingOnSite ? 1 : 0.98}}>
                                        {isLoading ? <FiLoader className="animate-spin" /> : <><span>Zapłać online</span> <FiArrowRight /></>}
                                    </motion.button>
                                    {showPayOnSiteButton && (
                                        <motion.button onClick={handleBookOnSite} disabled={!selectedOption || !selectedSubject || isLoading || isBookingOnSite} className="w-full cursor-pointer mt-4 flex items-center justify-center gap-3 p-4 rounded-xl bg-slate-700 text-white text-xl shadow-lg hover:bg-slate-600 transition-colors disabled:opacity-50" whileHover={{scale: !selectedOption || !selectedSubject || isLoading || isBookingOnSite ? 1 : 1.02}} whileTap={{scale: !selectedOption || !selectedSubject || isLoading || isBookingOnSite ? 1 : 0.98}}>
                                            {isBookingOnSite ? <FiLoader className="animate-spin" /> : <><span>Zapłacę na miejscu</span> <FiCreditCard /></>}
                                        </motion.button>
                                    )}
                                </>
                            ) : (
                                <motion.button onClick={() => router.push('/login')} className="w-full cursor-pointer mt-8 flex items-center justify-center gap-3 p-4 rounded-xl bg-slate-700 text-white text-xl shadow-lg">
                                    <FiLogIn /> Zaloguj się, aby kontynuować
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}