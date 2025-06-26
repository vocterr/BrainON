// FILE: app/jak-to-dziala/page.tsx

"use client";

import { motion } from 'framer-motion';
import { FiCalendar, FiCreditCard, FiVideo, FiArrowRight } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/lib/useIsMobile'; // KROK 1: Import

export default function JakToDzialaPage() {
    const router = useRouter();
    const isMobile = useIsMobile(); // KROK 2: Użycie hooka

    const steps = [
        {
            icon: <FiCalendar />,
            title: "Wybierz Swój Termin",
            description: "Przejrzyj dostępny kalendarz i wybierz dogodny dla siebie dzień oraz godzinę. Nasz system jest zawsze aktualny, więc masz pewność, że wybrany termin jest wolny.",
            visual: <CalendarVisual />
        },
        {
            icon: <FiCreditCard />,
            title: "Dopracuj Szczegóły i Zapłać",
            description: "Wybierz formę zajęć (online, u mnie lub z dojazdem) i opłać rezerwację bezpiecznie przez internet. Używamy Stripe, lidera płatności online, aby zapewnić Ci 100% bezpieczeństwa.",
            visual: <PaymentVisual />
        },
        {
            icon: <FiVideo />,
            title: "Dołącz do Lekcji Live",
            description: "W dniu lekcji otrzymasz przypomnienie i link do pokoju rozmowy. Wystarczy jedno kliknięcie, aby dołączyć i rozpocząć naukę w naszym wirtualnym pokoju z udostępnianiem ekranu i wideo.",
            visual: <CallVisual />
        }
    ];

    // KROK 3: Definicja prostszych animacji dla urządzeń mobilnych
    const mobileAnimationProps = {
        initial: { opacity: 1, x: 0 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: true, amount: 0.5 },
        transition: { duration: 0 }
    };

    const desktopAnimationProps = {
        initial: { opacity: 0, x: -20 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: true, amount: 0.5 },
        transition: { duration: 0.5 }
    };
    
    const desktopVisualAnimationProps = {
        initial:{ opacity: 0, scale: 0.8 },
        whileInView:{ opacity: 1, scale: 1 },
        viewport:{ once: true, amount: 0.8 },
        transition:{ duration: 0.6, delay: 0.2 }
    };


    return (
        <div className="relative w-full min-h-screen bg-slate-900 text-white font-chewy overflow-x-hidden">
            <div className="absolute inset-0 z-0 opacity-30 hidden md:block">
                <motion.div animate={{ x: ['-5%', '5%', '-5%'], y: ['-10%', '10%', '-10%'] }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }} className="absolute top-[-50%] right-[-50%] w-[120rem] h-[120rem] bg-purple-600/40 rounded-full blur-3xl" />
                <motion.div animate={{ x: ['5%', '-5%', '5%'], y: ['10%', '-10%', '10%'] }} transition={{ duration: 90, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-50%] left-[-50%] w-[120rem] h-[120rem] bg-orange-500/30 rounded-full blur-3xl" />
            </div>

            <main className="max-w-7xl mx-auto px-4 py-16 sm:py-24 relative z-10">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-20">
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-black">
                        Jak to <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-orange-400">działa</span>?
                    </h1>
                    <p className="mt-4 font-sans text-lg text-purple-200/80">Twoja droga do sukcesu w 3 prostych krokach.</p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="relative">
                        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-700/50"></div>
                        <div className="flex flex-col gap-16">
                            {steps.map((step, index) => (
                                <motion.div
                                    key={index}
                                    // KROK 4: Zastosowanie warunkowych animacji
                                    {...(isMobile ? mobileAnimationProps : desktopAnimationProps)}
                                    className="flex gap-6 items-start"
                                >
                                    <div className="relative z-10 flex-shrink-0 flex flex-col items-center">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg">
                                            {index + 1}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl text-purple-300">{step.icon}</span>
                                            <h3 className="text-3xl">{step.title}</h3>
                                        </div>
                                        <p className="font-sans text-purple-200/80">{step.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="hidden lg:block h-[600px] sticky top-24">
                        {steps.map((step, index) => (
                                <motion.div
                                    key={index}
                                    {...desktopVisualAnimationProps}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    {step.visual}
                                </motion.div>
                        ))}
                    </div>
                </div>

                 <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.8 }}
                    className="mt-24 text-center"
                >
                    <h2 className="text-4xl sm:text-5xl md:text-6xl mb-6">Gotowy, by zacząć?</h2>
                    <p className="text-purple-200/80 font-sans text-lg mb-8 max-w-2xl mx-auto">Pierwszy krok jest najprostszy. Wybierz termin, który Ci pasuje i przekonaj się, jak przyjemna może być nauka.</p>
                    <motion.button 
                        onClick={() => router.push('/zacznij-teraz')}
                        whileHover={{ scale: 1.05, boxShadow: "0px 10px 30px -10px rgba(251, 191, 36, 0.5)" }} 
                        whileTap={{ scale: 0.95 }} 
                        className="flex cursor-pointer items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 text-white text-xl shadow-lg mx-auto font-sans"
                    >
                        Zarezerwuj swoją pierwszą lekcję <FiArrowRight />
                    </motion.button>
                </motion.div>
            </main>
        </div>
    );
}

const CalendarVisual = () => (
    <div className="w-80 h-64 p-4 bg-slate-800/50 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
        <div className="w-full h-full border-2 border-dashed border-slate-700 rounded-lg flex flex-col p-2 gap-2">
            <div className="flex justify-between items-center"><div className="w-20 h-4 bg-slate-700/50 rounded"></div><div className="w-12 h-4 bg-slate-700/50 rounded"></div></div>
            <div className="grid grid-cols-7 gap-2">
                {[...Array(28)].map((_, i) => (
                    <div key={i} className={`w-full h-8 rounded ${i === 17 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-slate-700/50'}`}></div>
                ))}
            </div>
        </div>
    </div>
);

const PaymentVisual = () => (
    <div className="w-80 h-48 p-4 bg-slate-800/50 rounded-2xl border border-purple-500/30 backdrop-blur-sm flex flex-col justify-between">
        <div>
            <div className="w-1/3 h-4 bg-slate-700/50 rounded mb-4"></div>
            <div className="w-full h-10 bg-slate-700/50 rounded-lg"></div>
        </div>
        <div className="w-full h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg"></div>
    </div>
);

const CallVisual = () => (
    <div className="w-96 h-64 p-4 bg-black rounded-2xl border border-purple-500/30 backdrop-blur-sm flex items-center justify-center relative">
        <FiVideo className="w-24 h-24 text-slate-700"/>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 p-3 bg-slate-800/50 rounded-full border border-slate-700">
            <div className="w-10 h-10 rounded-full bg-slate-700"></div>
            <div className="w-10 h-10 rounded-full bg-slate-700"></div>
            <div className="w-10 h-10 rounded-full bg-red-500"></div>
        </div>
    </div>
);