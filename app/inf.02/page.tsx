"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { FiArrowRight, FiCheckCircle, FiClipboard, FiCode, FiCpu, FiDatabase, FiServer, FiGlobe } from 'react-icons/fi';

// Możesz umieścić ten komponent w osobnym pliku, np. /app/inf02/page.tsx
export default function Inf02Page() {
    const [routeLoading, startTransition] = useTransition();
    const router = useRouter();

    const changeRoute = (route: string) => {
        startTransition(() => {
            router.push(route);
        });
    }
    const [isSolved, setIsSolved] = useState(false);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2, duration: 0.5 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    const teachingMethods = [
        { icon: <FiCode />, title: "Praktyczne Projekty", text: "Od samego początku tworzymy realne, działające programy i strony. Teoria jest ważna, ale tylko wtedy, gdy potrafisz ją zastosować." },
        { icon: <FiCpu />, title: "Logika, nie Pamięciówka", text: "Uczę Cię myśleć jak programista. Zamiast wkuwać składnię, zrozumiesz, dlaczego kod działa w określony sposób." },
        { icon: <FiClipboard />, title: "Symulacje Egzaminacyjne", text: "Regularnie rozwiązujemy zadania z poprzednich lat w warunkach egzaminacyjnych, abyś oswoił się z presją czasu." }
    ];

    const topics = ["Programowanie (Python)", "Bazy Danych (SQL)", "Witryny Internetowe", "Systemy Operacyjne", "Sieci Komputerowe", "Urządzenia Techniki Komp.", "Diagnostyka i Naprawa", "Tworzenie Aplikacji"];

    return (
        <div className="w-full bg-slate-900 text-white font-chewy">
            {/* ===== SEKCJA HERO ===== */}
            <main className="relative w-full min-h-screen flex items-center justify-center overflow-hidden px-4">
                <div className="absolute inset-0 z-0 opacity-50">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute top-[-40%] left-[-20%] w-[70vw] h-[70vw] bg-indigo-700/40 rounded-full blur-3xl" />
                    <motion.div animate={{ rotate: -360 }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-40%] right-[-20%] w-[60vw] h-[60vw] bg-cyan-500/30 rounded-full blur-3xl" />
                </div>
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-8 items-center max-w-7xl mx-auto relative z-10">
                    <motion.div variants={itemVariants}>
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white drop-shadow-2xl">
                            INF.02: Z kodem, który <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">działa</span>.
                        </h1>
                        <p className="mt-6 text-xl md:text-2xl text-indigo-200/80 font-sans">
                            Od teorii do praktyki. Przygotuję Cię kompleksowo do części pisemnej i praktycznej egzaminu zawodowego.
                        </p>
                    </motion.div>
                    <motion.div variants={itemVariants} className="h-64 md:h-96 flex items-center justify-center relative">
                        {/* Animowane symbole kodu */}
                        <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: [0, 0.5, 0], scale: 1 }} transition={{ duration: 5, repeat: Infinity, delay: 0 }} className="absolute text-7xl text-cyan-400/80 font-sans top-10 left-20">{`{ }`}</motion.span>
                        <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: [0, 0.5, 0], scale: 1 }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute text-8xl text-indigo-400/80 font-sans bottom-10 right-20">{`</>`}</motion.span>
                        <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: [0, 0.5, 0], scale: 1 }} transition={{ duration: 5, repeat: Infinity, delay: 2 }} className="absolute text-6xl text-white/80 font-sans top-1/2 left-1/3">{`()`}</motion.span>
                        <FiCpu className="w-40 h-40 text-slate-700/50" />
                    </motion.div>
                </motion.div>
            </main>

            {/* ===== SEKCJA: MÓJ SYSTEM NAUCZANIA ===== */}
            <section className="py-20 sm:py-32 px-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20">
                    <motion.div initial={{ y: "100%" }} whileInView={{ y: "20%" }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute -bottom-40 -left-40 w-[60rem] h-[60rem] bg-gradient-to-tr from-cyan-500/50 to-indigo-500/50 rounded-full blur-3xl" />
                </div>
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={containerVariants} className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
                    <motion.h2 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl text-center mb-16">Jak uczę? Mój system na INF.02</motion.h2>
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                        {teachingMethods.map((method, index) => (
                            <motion.div key={index} variants={itemVariants} className="p-8 rounded-3xl bg-slate-800/50 border border-indigo-500/30 backdrop-blur-sm hover:border-cyan-400 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center">
                                <div className="p-5 rounded-full bg-slate-700/50 mb-6 text-cyan-400 text-4xl">{method.icon}</div>
                                <h3 className="text-2xl mb-4 text-white">{method.title}</h3>
                                <p className="font-sans text-indigo-200/70">{method.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ===== SEKCJA: ZAKRES MATERIAŁU ===== */}
            <section className="py-20 sm:py-32 px-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-15">
                    <motion.div initial={{ scale: 0.5 }} whileInView={{ scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80rem] h-[80rem] bg-orange-600/50 rounded-full blur-3xl" />
                </div>
                <div className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
                    <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="text-4xl sm:text-5xl md:text-6xl text-center mb-4">Co <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">zdasz</span> bez problemu?</motion.h2>
                    <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-purple-200/70 font-sans text-lg max-w-2xl text-center mb-16">Pokrywam 100% zagadnień wymaganych na egzaminie INF.02 (dawne EE.08).</motion.p>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={containerVariants} className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {topics.map((topic) => (
                            <motion.div key={topic} variants={itemVariants} className="p-6 text-center rounded-2xl bg-slate-800/50 border border-indigo-500/20 backdrop-blur-sm cursor-pointer hover:bg-indigo-500/20 transition-colors">
                                <p className="text-lg sm:text-xl">{topic}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ===== SEKCJA: INTERAKTYWNE ZADANIE ===== */}
            <section className="py-20 sm:py-32 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="text-4xl sm:text-5xl md:text-6xl mb-4">Zobacz, jak łamię zadanie na bity.</motion.h2>
                    <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-indigo-200/70 font-sans text-lg mb-12">Weźmy typowe zadanie z baz danych. Zobacz, jak prosto można je rozwiązać, rozumiejąc logikę SQL.</motion.p>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="p-8 rounded-3xl bg-slate-800/80 border border-indigo-500/30 backdrop-blur-lg text-left font-sans relative overflow-hidden">
                        <p className="text-lg mb-4"><span className="font-bold text-indigo-300">Zadanie:</span> Z bazy danych `szkola` wybierz imiona i nazwiska wszystkich uczniów z klasy `3A`, których średnia ocen jest wyższa niż 4.0. Wyniki posortuj alfabetycznie według nazwiska.</p>
                        <hr className="border-indigo-500/30 my-6" />
                        <AnimatePresence>
                            {isSolved && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-mono text-lg bg-slate-900/50 p-4 rounded-lg">
                                    <p><span className="text-cyan-400">SELECT</span> imie, nazwisko</p>
                                    <p><span className="text-cyan-400">FROM</span> uczniowie</p>
                                    <p><span className="text-cyan-400">WHERE</span> klasa = <span className="text-orange-400">'3A'</span> <span className="text-pink-400">AND</span> srednia {">"}  <span className="text-orange-400">4.0</span></p>
                                    <p><span className="text-cyan-400">ORDER BY</span> nazwisko <span className="text-pink-400">ASC</span>;</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {!isSolved && (
                            <motion.button onClick={() => setIsSolved(true)} className="w-full hover:cursor-pointer mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-xl font-chewy hover:scale-105 transition-transform">
                                Pokaż kwerendę SQL
                            </motion.button>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* ===== SEKCJA: FINALNE CTA ===== */}
            <section className="py-20 sm:py-32 px-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-30">
                    <motion.div initial={{ scale: 1.5 }} whileInView={{ scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-full blur-3xl" />
                </div>
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8 }} className="max-w-3xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl mb-6">Rozpocznij swoją <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">informatyczną podróż</span>.</h2>
                    <p className="text-indigo-200/80 font-sans text-lg mb-8">Zdobądź kwalifikację INF.02 bez stresu i niepotrzebnego zakuwania. Dołącz do kursu i zacznij tworzyć kod, który naprawdę działa!</p>
                    <motion.button onClick={() => changeRoute("zacznij-teraz")} whileHover={{ scale: 1.05, boxShadow: "0px 10px 30px -10px rgba(251, 191, 36, 0.5)" }} whileTap={{ scale: 0.95 }} className="flex hover:cursor-pointer items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 text-white text-xl shadow-lg mx-auto">
                        Zapisz się na kurs INF.02 <FiArrowRight />
                    </motion.button>
                </motion.div>
            </section>
        </div>
    );
}