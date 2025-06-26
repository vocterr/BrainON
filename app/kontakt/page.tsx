// FILE: app/kontakt/page.tsx

"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useState, FormEvent } from 'react';
import { FiMail, FiInstagram, FiYoutube, FiSend, FiLoader, FiCheckCircle, FiPhone, FiFacebook } from 'react-icons/fi';
import { useIsMobile } from '@/lib/useIsMobile'; // KROK 1: Import

export default function ContactPage() {
    const isMobile = useIsMobile(); // KROK 2: Użycie hooka
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        console.log("Wysyłanie danych:", formData);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsSubmitting(false);
        setIsSubmitted(true);
        setTimeout(() => {
            setIsSubmitted(false);
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 4000);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        // KROK 3: Warunkowa animacja
        visible: { opacity: 1, transition: { staggerChildren: isMobile ? 0 : 0.2, duration: 0.5 } },
    };

    const itemVariants = {
        hidden: isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    const socialLinks = [
        { icon: <FiInstagram className="w-6 h-6"/>, href: "#" },
        { icon: <FiYoutube className="w-6 h-6"/>, href: "#" },
        { icon: <FiFacebook className="w-6 h-6"/>, href: "#" },
    ];

    return (
        <div className="w-full bg-slate-900 text-white font-chewy">
            <main className="relative w-full min-h-screen flex items-center justify-center overflow-hidden px-4 py-24 sm:py-32">
                <div className="absolute inset-0 z-0 opacity-50 hidden md:block">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute top-[-30%] left-[-30%] w-[80vw] h-[80vw] bg-purple-600/30 rounded-full blur-3xl" />
                    <motion.div animate={{ rotate: -360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-30%] right-[-30%] w-[70vw] h-[70vw] bg-orange-500/20 rounded-full blur-3xl" />
                </div>

                <motion.div
                    // KROK 4: Zastosowanie warunkowych animacji
                    variants={isMobile ? undefined : containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-7xl w-full mx-auto relative z-10"
                >
                    <motion.div variants={isMobile ? undefined : itemVariants} className="text-center mb-16">
                        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white drop-shadow-2xl">
                            Porozmawiajmy
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-purple-200/80 font-sans font-medium">
                            Masz pytania dotyczące lekcji, sugestie, a może chcesz nawiązać współpracę? Wypełnij formularz lub skorzystaj z poniższych opcji kontaktu.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-16 items-start">
                        <motion.div variants={isMobile ? undefined : itemVariants} className="flex flex-col gap-8">
                            <div className="p-8 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <FiMail className="w-8 h-8 text-purple-400" />
                                    <h2 className="text-3xl">Napisz do mnie</h2>
                                </div>
                                <p className="font-sans text-purple-200/70 mb-4">Preferuję kontakt mailowy. Odpowiadam na wszystkie wiadomości w ciągu 24 godzin.</p>
                                <a href="mailto:kontakt@korki24.pl" className="font-sans text-lg text-yellow-400 hover:text-yellow-300 transition-colors">
                                    kontakt@korki24.pl
                                </a>
                            </div>

                            <div className="p-8 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <FiPhone className="w-8 h-8 text-purple-400" />
                                    <h2 className="text-3xl">Zadzwoń do mnie</h2>
                                </div>
                                <p className="font-sans text-purple-200/70 mb-4">Jeśli wolisz szybszą formę kontaktu lub masz pilne pytanie, śmiało dzwoń.</p>
                                <a href="tel:+48000000000" className="font-sans text-lg text-yellow-400 hover:text-yellow-300 transition-colors">
                                    +48 000 000 000
                                </a>
                            </div>

                            <div className="p-8 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-sm">
                                <h2 className="text-3xl mb-4">Znajdź mnie w sieci</h2>
                                <p className="font-sans text-purple-200/70 mb-6">Śledź mnie na mediach społecznościowych, aby być na bieżąco z nowościami i darmowymi materiałami.</p>
                                <div className="flex items-center gap-4">
                                    {socialLinks.map((social, index) => (
                                        <motion.a 
                                            key={index}
                                            href={social.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            whileHover={{ scale: 1.1, y: -2 }}
                                            className="p-3 bg-slate-700/50 rounded-full text-purple-300 hover:text-white transition-colors"
                                        >
                                            {social.icon}
                                        </motion.a>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={isMobile ? undefined : itemVariants} className="p-8 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-sm relative">
                            <AnimatePresence>
                                {isSubmitted ? (
                                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/80 backdrop-blur-md rounded-3xl text-center p-8">
                                        <motion.div initial={{scale: 0}} animate={{scale: 1, rotate: 360}} transition={{type: 'spring', stiffness: 200, damping: 15}}>
                                            <FiCheckCircle className="w-16 h-16 text-green-400 mb-4" />
                                        </motion.div>
                                        <h2 className="text-3xl mb-2">Dzięki!</h2>
                                        <p className="font-sans text-purple-200/80">Twoja wiadomość została wysłana. Odpowiem najszybciej, jak to możliwe!</p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                                        <div className="relative font-sans">
                                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="peer w-full p-4 bg-slate-700/50 rounded-xl border border-purple-500/40 text-white outline-none focus:border-purple-400 transition-all" />
                                            <label htmlFor="name" className={`absolute left-4 transition-all text-purple-300/80 pointer-events-none ${formData.name ? 'top-[-10px] text-xs bg-slate-800 px-1' : 'top-4 text-base'}`}>Imię</label>
                                        </div>
                                        <div className="relative font-sans">
                                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="peer w-full p-4 bg-slate-700/50 rounded-xl border border-purple-500/40 text-white outline-none focus:border-purple-400 transition-all" />
                                            <label htmlFor="email" className={`absolute left-4 transition-all text-purple-300/80 pointer-events-none ${formData.email ? 'top-[-10px] text-xs bg-slate-800 px-1' : 'top-4 text-base'}`}>Email</label>
                                        </div>
                                        <div className="relative font-sans">
                                            <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows={5} className="peer w-full p-4 bg-slate-700/50 rounded-xl border border-purple-500/40 text-white outline-none focus:border-purple-400 transition-all resize-none" />
                                            <label htmlFor="message" className={`absolute left-4 transition-all text-purple-300/80 pointer-events-none ${formData.message ? 'top-[-10px] text-xs bg-slate-800 px-1' : 'top-4 text-base'}`}>Twoja wiadomość</label>
                                        </div>
                                        <motion.button 
                                            type="submit"
                                            disabled={isSubmitting}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="flex cursor-pointer items-center justify-center gap-2 w-full p-4 rounded-xl bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 text-white text-xl shadow-lg hover:shadow-orange-500/40 transition-shadow disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <motion.div animate={{rotate: 360}} transition={{duration: 1, repeat: Infinity, ease: 'linear'}}><FiLoader /></motion.div>
                                                    <span>Wysyłanie...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Wyślij Wiadomość</span>
                                                    <FiSend />
                                                </>
                                            )}
                                        </motion.button>
                                    </form>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}