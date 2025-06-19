"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useState, FormEvent } from 'react';
import { FiMail, FiLoader, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

// Możesz umieścić ten komponent w osobnym pliku, np. /app/zapomnialem-hasla/page.tsx
export default function ForgotPasswordPage() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        console.log("Wysyłanie linku do resetu hasła na adres:", email);
        // Tutaj w przyszłości wywołasz API, które wyśle e-mail
        // WAŻNE: Twoje API powinno zawsze zwracać sukces, nawet jeśli email nie istnieje w bazie,
        // aby uniemożliwić "user enumeration" (sprawdzanie, czyje maile są zarejestrowane).
        
        // Symulacja wywołania API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsLoading(false);
        setStep(2); // Przejdź do kroku drugiego niezależnie od wyniku
    };
    
    const formVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -20, scale: 0.98 },
    };

    return (
        <main className="w-full min-h-screen flex items-center justify-center bg-slate-900 text-white font-chewy p-4 relative overflow-hidden">
            {/* Tło "Aurora Glow" */}
            <div className="absolute inset-0 z-0 opacity-40">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute top-[-40%] right-[-40%] w-[120vw] h-[120vw] bg-gradient-to-bl from-indigo-800/80 via-purple-700/60 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            variants={formVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="w-full p-8 sm:p-12 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-lg shadow-2xl"
                        >
                            <div className="text-center mb-8">
                                <h1 className="text-4xl sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">Zapomniałeś hasła?</h1>
                                <p className="font-sans text-purple-200/70">Żaden problem. Podaj nam swój e-mail, a pomożemy Ci wrócić na właściwe tory.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                                <div className="relative font-sans flex items-center">
                                    <FiMail className="absolute left-4 text-slate-500" />
                                    <input 
                                        type="email" 
                                        placeholder="Twój adres e-mail" 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        required 
                                        className="w-full pl-12 pr-4 py-4 bg-slate-700/50 rounded-xl border border-transparent text-white outline-none focus:border-purple-400 transition-all" 
                                    />
                                </div>
                                
                                {error && <p className="font-sans text-red-400 text-center">{error}</p>}

                                <motion.button
                                    type="submit"
                                    disabled={isLoading}
                                    whileHover={{ scale: 1.02, boxShadow: "0px 8px 25px -8px rgba(192, 132, 252, 0.5)" }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center cursor-pointer justify-center gap-3 w-full p-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xl shadow-lg hover:shadow-purple-500/40 transition-shadow disabled:opacity-60"
                                >
                                    {isLoading ? (
                                        <motion.div animate={{rotate: 360}} transition={{duration: 1, repeat: Infinity, ease: 'linear'}}><FiLoader /></motion.div>
                                    ) : (
                                        <span>Wyślij link do resetu</span>
                                    )}
                                </motion.button>
                            </form>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            variants={formVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="w-full p-8 sm:p-12 rounded-3xl bg-slate-800/50 border border-green-500/30 backdrop-blur-lg shadow-2xl text-center"
                        >
                            <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type: 'spring', stiffness: 200, damping: 12}}>
                                <FiMail className="w-16 h-16 text-green-400 mx-auto mb-6" />
                            </motion.div>
                            <h1 className="text-4xl sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-cyan-400 mb-4">Sprawdź skrzynkę!</h1>
                            <p className="font-sans text-lg text-slate-300 leading-relaxed">
                                Jeśli konto powiązane z adresem <strong className="text-white">{email}</strong> istnieje w naszej bazie, wysłaliśmy na nie wiadomość z dalszymi instrukcjami.
                            </p>
                            <Link href="/login" className="mt-8 inline-flex items-center gap-2 font-sans text-purple-300 hover:text-purple-100 transition-colors">
                                <FiArrowLeft />
                                Wróć do logowania
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}