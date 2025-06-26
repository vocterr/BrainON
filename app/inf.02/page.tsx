// FILE: app/inf02/page.tsx

"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { FiArrowRight, FiCpu, FiServer, FiGlobe } from 'react-icons/fi';
import { useIsMobile } from '@/lib/useIsMobile'; // KROK 1: Import

export default function Inf02Page() {
    const [routeLoading, startTransition] = useTransition();
    const router = useRouter();
    const isMobile = useIsMobile(); // KROK 2: Użycie hooka

    const changeRoute = (route: string) => {
        startTransition(() => {
            router.push(route);
        });
    }
    const [isSolved, setIsSolved] = useState(false);

    const containerVariants = {
        hidden: { opacity: 0 },
        // KROK 3: Warunkowa animacja
        visible: { opacity: 1, transition: { staggerChildren: isMobile ? 0 : 0.2, duration: 0.5 } },
    };

    const itemVariants = {
        hidden: isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    const teachingMethods = [
        { icon: <FiServer />, title: "Wirtualne Laboratorium", text: "Uczymy się w specjalnie przygotowanym środowisku na VirtualBoxie. Masz dostęp do systemów i narzędzi identycznych jak na egzaminie. Ćwiczymy w warunkach, które niczym Cię nie zaskoczą." },
        { icon: <FiCpu />, title: "Logika, nie Pamięciówka", text: "Uczę Cię myśleć jak administrator i technik. Zamiast wkuwać definicje, zrozumiesz, dlaczego dana konfiguracja czy polecenie działa w określony sposób." },
        { icon: <FiGlobe />, title: "Mistrzowie Podsieci (i nie tylko)", text: "Rozkładam na czynniki pierwsze najtrudniejsze zagadnienia, od adresacji IP i podsieci po specyficzne pytania z Accessa. Tłumaczę tak długo, aż powiesz 'Aha, to takie proste!'" }
    ];

    const topics = ["Systemy Operacyjne", "Sieci Komputerowe", "Bazy Danych (Access)", "Witryny Internetowe (HTML/CSS)", "Urządzenia Techniki Komp.", "Diagnostyka i Naprawa"];

    return (
        <div className="w-full bg-slate-900 text-white font-chewy">
            <main className="relative w-full min-h-screen flex items-center justify-center overflow-hidden px-4">
                <div className="absolute inset-0 z-0 opacity-50 hidden md:block">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute top-[-40%] left-[-20%] w-[70vw] h-[70vw] bg-indigo-700/40 rounded-full blur-3xl" />
                    <motion.div animate={{ rotate: -360 }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-40%] right-[-20%] w-[60vw] h-[60vw] bg-cyan-500/30 rounded-full blur-3xl" />
                </div>
                <motion.div variants={isMobile ? undefined : containerVariants} initial="hidden" animate="visible" className="grid mt-24 md:mt-0 md:grid-cols-2 gap-8 items-center max-w-7xl mx-auto relative z-10">
                    <motion.div variants={isMobile ? undefined : itemVariants}>
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white drop-shadow-2xl">
                            INF.02: Z teorią, która ma sens i <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">praktyką, która działa</span>.
                        </h1>
                        <p className="mt-6 text-xl md:text-2xl text-indigo-200/80 font-sans">
                            Koniec z suchą teorią. Przygotuję Cię do egzaminu w środowisku, które wygląda jak prawdziwa pracownia egzaminacyjna. Skupimy się na tym, co naprawdę się liczy, by zdać.
                        </p>
                    </motion.div>
                    <motion.div variants={isMobile ? undefined : itemVariants} className="h-64 md:h-96 flex items-center justify-center relative">
                        <div className="hidden md:block">
                            <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: [0, 0.5, 0], scale: 1 }} transition={{ duration: 5, repeat: Infinity, delay: 0 }} className="absolute text-7xl text-cyan-400/80 font-sans top-10 left-20">{`{ }`}</motion.span>
                            <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: [0, 0.5, 0], scale: 1 }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute text-8xl text-indigo-400/80 font-sans bottom-10 right-20">{`</>`}</motion.span>
                            <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: [0, 0.5, 0], scale: 1 }} transition={{ duration: 5, repeat: Infinity, delay: 2 }} className="absolute text-6xl text-white/80 font-sans top-1/2 left-1/3">{`()`}</motion.span>
                        </div>
                        <FiServer className="w-40 h-40 text-slate-700/50" />
                    </motion.div>
                </motion.div>
            </main>

            <section className="py-20 sm:py-32 px-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20 hidden md:block">
                    <motion.div initial={{ y: "100%" }} whileInView={{ y: "20%" }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute -bottom-40 -left-40 w-[60rem] h-[60rem] bg-gradient-to-tr from-cyan-500/50 to-indigo-500/50 rounded-full blur-3xl" />
                </div>
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={isMobile ? undefined : containerVariants} className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
                    <motion.h2 variants={isMobile ? undefined : itemVariants} className="text-4xl sm:text-5xl md:text-6xl text-center mb-16">Mój system na pewne zdanie INF.02</motion.h2>
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                        {teachingMethods.map((method, index) => (
                            <motion.div key={index} variants={isMobile ? undefined : itemVariants} className="p-8 rounded-3xl bg-slate-800/50 border border-indigo-500/30 backdrop-blur-sm hover:border-cyan-400 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center">
                                <div className="p-5 rounded-full bg-slate-700/50 mb-6 text-cyan-400 text-4xl">{method.icon}</div>
                                <h3 className="text-2xl mb-4 text-white">{method.title}</h3>
                                <p className="font-sans text-indigo-200/70">{method.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            <section className="py-20 sm:py-32 px-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-15 hidden md:block">
                    <motion.div initial={{ scale: 0.5 }} whileInView={{ scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80rem] h-[80rem] bg-orange-600/50 rounded-full blur-3xl" />
                </div>
                <div className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
                    <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="text-4xl sm:text-5xl md:text-6xl text-center mb-4">Co <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">zdasz</span> bez problemu?</motion.h2>
                    <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-purple-200/70 font-sans text-lg max-w-2xl text-center mb-16">Skupiamy się w 100% na zagadnieniach wymaganych na egzaminie INF.02 (dawne EE.08). Zero lania wody, maksimum konkretów, które pojawią się na arkuszu.</motion.p>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={isMobile ? undefined : containerVariants} className="w-full grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        {topics.map((topic) => (
                            <motion.div key={topic} variants={isMobile ? undefined : itemVariants} className="p-6 text-center rounded-2xl bg-slate-800/50 border border-indigo-500/20 backdrop-blur-sm cursor-pointer hover:bg-indigo-500/20 transition-colors">
                                <p className="text-lg sm:text-xl">{topic}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            <section className="py-20 sm:py-32 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="text-4xl sm:text-5xl md:text-6xl mb-4">Zobacz, jak łamię zadanie na bity.</motion.h2>
                    <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-indigo-200/70 font-sans text-lg mb-12">Subnetting to koszmar wielu zdających. Zobacz, jak logicznie i bezboleśnie można sobie z nim poradzić, krok po kroku.</motion.p>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="p-8 rounded-3xl bg-slate-800/80 border border-indigo-500/30 backdrop-blur-lg text-left font-sans relative overflow-hidden">
                        <p className="text-lg mb-4"><span className="font-bold text-indigo-300">Zadanie:</span> Dla sieci o adresie <span className="font-mono text-yellow-300">192.168.10.0/24</span> należy wydzielić 4 równe podsieci. Podaj adresy sieci, adresy rozgłoszeniowe oraz zakresy adresów hostów dla każdej z nowo utworzonych podsieci.</p>
                        <hr className="border-indigo-500/30 my-6" />
                        <AnimatePresence>
                            {isSolved && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-left font-sans text-base space-y-4">
                                    <div>
                                        <p className="font-bold text-green-400">1. Obliczenie nowej maski:</p>
                                        <p className="font-mono text-indigo-200/90">Potrzebujemy 4 podsieci, więc pożyczamy 2 bity (bo 2<sup>2</sup>=4). Nowa maska to /24 + 2 = <span className="text-yellow-300">/26</span>, czyli <span className="text-yellow-300">255.255.255.192</span>.</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-green-400">2. Ustalenie "skoku" (inkrementu):</p>
                                        <p className="font-mono text-indigo-200/90">Nasz "skok" to 256 - 192 (ostatni oktet maski) = <span className="text-yellow-300">64</span>. Będziemy dodawać 64 do ostatniego oktetu adresu.</p>
                                    </div>
                                    <div className="font-mono bg-slate-900/50 p-4 rounded-lg text-sm sm:text-base overflow-x-auto">
                                        <p className="text-white"><span className="text-cyan-400">Podsieć 1:</span> Sieć: 192.168.10.0 | Hosty: 10.1 - 10.62 | Broadcast: 10.63</p>
                                        <p className="text-white"><span className="text-cyan-400">Podsieć 2:</span> Sieć: 192.168.10.64 | Hosty: 10.65 - 10.126 | Broadcast: 10.127</p>
                                        <p className="text-white"><span className="text-cyan-400">Podsieć 3:</span> Sieć: 192.168.10.128 | Hosty: 10.129 - 10.190 | Broadcast: 10.191</p>
                                        <p className="text-white"><span className="text-cyan-400">Podsieć 4:</span> Sieć: 192.168.10.192 | Hosty: 10.193 - 10.254 | Broadcast: 10.255</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {!isSolved && (
                            <motion.button onClick={() => setIsSolved(true)} className="w-full hover:cursor-pointer mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-xl font-chewy hover:scale-105 transition-transform">
                                Pokaż rozwiązanie
                            </motion.button>
                        )}
                    </motion.div>
                </div>
            </section>

            <section className="py-20 sm:py-32 px-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-30 hidden md:block">
                    <motion.div initial={{ scale: 1.5 }} whileInView={{ scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-full blur-3xl" />
                </div>
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8 }} className="max-w-3xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl mb-6">Zacznij przygotowania w <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">profesjonalnym środowisku</span>.</h2>
                    <p className="text-indigo-200/80 font-sans text-lg mb-8">Nie czekaj na ostatnią chwilę. Umów się na lekcję i przekonaj się, jak spokojnie i skutecznie można przygotować się do INF.02. Z moim wsparciem zdasz bez problemu.</p>
                    <motion.button onClick={() => changeRoute("zacznij-teraz")} whileHover={{ scale: 1.05, boxShadow: "0px 10px 30px -10px rgba(251, 191, 36, 0.5)" }} whileTap={{ scale: 0.95 }} className="flex hover:cursor-pointer items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 text-white text-xl shadow-lg mx-auto">
                        Zarezerwuj termin <FiArrowRight />
                    </motion.button>
                </motion.div>
            </section>
        </div>
    );
}