// FILE: app/rezerwacja-sukces/page.tsx

"use client";

import { motion } from 'framer-motion';
import { FiCheckCircle, FiArrowRight, FiHome } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useIsMobile } from '@/lib/useIsMobile'; // Upewnij się, że masz ten hook

export default function RezerwacjaSukcesPage() {
    const router = useRouter();
    const isMobile = useIsMobile();

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                staggerChildren: isMobile ? 0 : 0.15,
                duration: 0.5
            }
        }
    };

    const itemVariants = {
        hidden: isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <main className="w-full min-h-screen flex items-center justify-center bg-slate-900 text-white font-chewy p-4 relative overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-40 hidden md:block">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }} className="absolute top-[-40%] left-[-40%] w-[100vw] h-[100vw] bg-gradient-to-br from-green-800/80 via-teal-700/60 to-transparent rounded-full blur-3xl" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-40%] right-[-40%] w-[100vw] h-[100vw] bg-gradient-to-tl from-emerald-800/60 to-transparent rounded-full blur-3xl" />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-2xl p-8 sm:p-12 text-center rounded-3xl bg-slate-800/50 border border-green-500/30 backdrop-blur-lg shadow-2xl shadow-green-500/10 relative z-10"
            >
                <motion.div variants={itemVariants}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: 360 }}
                        transition={{ type: 'spring', stiffness: 180, damping: 15, delay: 0.2 }}
                        className="w-24 h-24 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center"
                    >
                        <FiCheckCircle className="w-16 h-16 text-green-400" />
                    </motion.div>
                </motion.div>
                
                <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-cyan-400 mb-4">
                    Rezerwacja Potwierdzona!
                </motion.h1>

                <motion.p variants={itemVariants} className="font-sans text-lg text-slate-300 max-w-md mx-auto mb-10">
                    Dziękuję! Twój termin został pomyślnie zapisany. Wkrótce otrzymasz e-mail z potwierdzeniem i wszystkimi szczegółami.
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => router.push('/moje-terminy')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xl shadow-lg hover:scale-105 transition-transform font-sans"
                    >
                        <span>Zobacz Moje Terminy</span>
                        <FiArrowRight />
                    </button>
                    <Link href="/" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-slate-700/50 text-slate-300 text-xl hover:bg-slate-700 transition-colors font-sans">
                        <FiHome />
                        <span>Wróć na stronę główną</span>
                    </Link>
                </motion.div>
            </motion.div>
        </main>
    );
}