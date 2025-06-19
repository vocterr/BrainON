"use client";

// Usunęliśmy useSearchParams i Suspense, bo nie są już potrzebne do tego celu
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiMonitor, FiHome, FiArrowRight, FiInfo, FiLoader } from 'react-icons/fi';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// KROK 1: Komponent teraz przyjmuje 'params' jako props,
// które Next.js automatycznie przekazuje dla dynamicznych stron.
type BookingDetailsPageProps = {
    params: {
        details: string; // np. "2025-07-25_10-00"
    }
}

export default function WybierzTerminPage({ params }: BookingDetailsPageProps) {
    // KROK 2: Odczytujemy dane z `params`, a nie z `useSearchParams`
    const { details } = params;
    const [dateStr, timeStrWithDash] = details ? details.split('_') : [null, null];
    
    const date = dateStr ? new Date(dateStr) : null;
    const time = timeStrWithDash ? timeStrWithDash.replace('-', ':') : null;

    const [selectedOption, setSelectedOption] = useState<'online' | 'teacher_home' | 'student_home' | null>(null);
    const [notes, setNotes] = useState('');
    const [formattedDate, setFormattedDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (date) {
            const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            setFormattedDate(date.toLocaleDateString('pl-PL', options));
        }
    }, [date]);
    
    const handlePayment = async () => {
        if (!selectedOption) return;
        setIsLoading(true);
        setError('');

        const selectedOptionDetails = options.find(o => o.id === selectedOption);

        const bookingData = {
            date: formattedDate,
            time: time,
            option: {
                title: selectedOptionDetails?.title,
            },
            price: pricing[selectedOption],
            notes: notes,
        };
        
        console.log("Wysyłanie danych do API:", bookingData);

        try {
            const response = await fetch('/api/checkout_sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData),
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Wystąpił błąd serwera.');
            }

            const { sessionId } = data;
            const stripe = await stripePromise;
            if (stripe) {
                await stripe.redirectToCheckout({ sessionId });
            }

        } catch (err: any) {
            console.error("Błąd w handlePayment:", err);
            setError(err.message || "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
        } finally {
            setIsLoading(false);
        }
    };

    const pricing = {
        online: 100,
        teacher_home: 120,
        student_home: 150,
    };

    const options = [
        { id: 'online', icon: <FiMonitor />, title: 'Lekcja Online', description: 'Przez Discord, Google Meet lub inną platformę.', price: pricing.online },
        { id: 'teacher_home', icon: <FiHome />, title: 'U mnie w domu', description: 'Zapraszam do mojego miejsca pracy w komfortowych warunkach.', price: pricing.teacher_home },
        { id: 'student_home', icon: <FiMapPin />, title: 'Dojazd do ucznia', description: 'Przyjadę w dogodne dla Ciebie miejsce (na terenie miasta).', price: pricing.student_home },
    ];

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    // KROK 3: Dodajemy obsługę błędu, jeśli URL jest nieprawidłowy
    if (!date || !time) {
        return (
             <main className="w-full min-h-screen bg-slate-900 text-white font-chewy flex flex-col items-center justify-center p-4">
                <h1 className="text-4xl text-red-500 mb-4">Błąd</h1>
                <p className="font-sans text-lg text-slate-300">Nieprawidłowy link rezerwacji. Wróć do kalendarza i spróbuj ponownie.</p>
            </main>
        )
    }

    return (
        <main className="w-full min-h-screen relative bg-slate-900 text-white font-chewy overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-30">
                <motion.div animate={{ x: ['-5%', '5%', '-5%'], y: ['-10%', '10%', '-10%'] }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute top-[-50%] right-[-25%] w-[100vw] h-[100vw] bg-purple-600/50 rounded-full blur-3xl" />
                <motion.div animate={{ x: ['5%', '-5%', '5%'], y: ['10%', '-10%', '10%'] }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-50%] left-[-25%] w-[90vw] h-[90vw] bg-orange-500/40 rounded-full blur-3xl" />
            </div>

            <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 relative z-10">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-black">Dopracujmy <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-orange-400">szczegóły</span></h1>
                    <p className="mt-4 font-sans text-lg text-purple-200/80">Już prawie gotowe! Wybierz formę zajęć i sfinalizuj rezerwację.</p>
                </motion.div>

                <div className="grid lg:grid-cols-5 gap-8 items-start">
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="lg:col-span-3 flex flex-col gap-8">
                        {options.map(option => (
                            <motion.div key={option.id} variants={itemVariants} onClick={() => setSelectedOption(option.id as any)} className={`p-6 rounded-2xl bg-slate-800/50 border-2 backdrop-blur-sm cursor-pointer transition-all duration-300 ${selectedOption === option.id ? 'border-purple-500' : 'border-slate-700 hover:border-slate-600'}`}>
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
                         <motion.div variants={itemVariants}>
                            <h3 className="text-2xl mb-3">Dodatkowe uwagi (opcjonalnie)</h3>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Np. 'Proszę o skupienie się na zadaniach z optymalizacji' lub 'Będę dostępny 5 minut wcześniej'." className="w-full h-32 p-4 rounded-xl bg-slate-800/50 border border-slate-700 font-sans text-base text-white outline-none focus:border-purple-400 transition-colors" />
                        </motion.div>
                    </motion.div>

                    <motion.div initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} transition={{delay: 0.3}} className="lg:col-span-2 sticky top-24">
                         <div className="p-8 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-lg">
                            <h2 className="text-3xl border-b border-purple-500/20 pb-4 mb-4">Podsumowanie</h2>
                            <div className="space-y-4 font-sans text-lg">
                                <div className="flex justify-between">
                                    <span className="text-purple-200/80">Wybrany termin:</span>
                                    <span className="text-white text-right">{formattedDate}<br/>godz. {time}</span>
                                </div>
                                {selectedOption && ( <div className="flex justify-between items-center"><span className="text-purple-200/80">Forma zajęć:</span><span className="text-white">{options.find(o => o.id === selectedOption)?.title}</span></div>)}
                                <div className="border-t border-purple-500/20 my-4"></div>
                                <div className="flex justify-between text-2xl font-bold">
                                    <span className="text-purple-200/80">Do zapłaty:</span>
                                    <span className="text-yellow-400">{selectedOption ? pricing[selectedOption] : '---'} zł</span>
                                </div>
                            </div>
                            
                            {error && <p className="mt-4 text-center text-red-400 font-sans">{error}</p>}

                            <motion.button onClick={handlePayment} disabled={!selectedOption || isLoading} className="w-full cursor-pointer mt-8 flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xl shadow-lg hover:shadow-orange-500/40 transition-shadow disabled:opacity-50" whileHover={{scale: !selectedOption || isLoading ? 1 : 1.02}} whileTap={{scale: !selectedOption || isLoading ? 1 : 0.98}}>
                                {isLoading ? <FiLoader className="animate-spin" /> : <><span>Przejdź do płatności</span> <FiArrowRight /></>}
                            </motion.button>
                         </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
