"use client";

import LoadingScreen from '@/components/LoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { FiArrowRight, FiCheckCircle, FiStar, FiCpu, FiTarget, FiServer, FiXCircle, FiBookOpen, FiMonitor } from 'react-icons/fi';

export default function HomePage() {
    const [routeLoading, startTransition] = useTransition();
    const router = useRouter();

    const changeRoute = (route: string) => {
        startTransition(() => {
            router.push(route);
        });
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
        },
    };

    // ===== NOWA, PRAWDZIWA LISTA TWOICH ATUTÓW =====
    const features = [
        {
            icon: <FiTarget className="w-10 h-10 text-purple-400" />,
            title: "Indywidualne Podejście 1 na 1",
            description: "Każda lekcja jest w 100% dopasowana do Twoich potrzeb, tempa i celów. Skupiamy się na tym, z czym masz największy problem."
        },
        {
            icon: <FiCpu className="w-10 h-10 text-orange-400" />,
            title: "Logika, a nie Zakuwanie",
            description: "Pokażę Ci, jak myśleć analitycznie. Zamiast wkuwać wzory i regułki na pamięć, nauczysz się je rozumieć i stosować w praktyce."
        },
        {
            icon: <FiServer className="w-10 h-10 text-green-400" />,
            title: "Realne Środowisko Pracy",
            description: "Na lekcjach z informatyki korzystamy z Wirtualnego Laboratorium (VirtualBox), a na matematyce rozwiązujemy zadania, które uczą myślenia jak programista."
        }
    ];

    return (
        <>
            <div className="w-full bg-slate-900 text-white font-chewy">
                {/* ===== SEKCJA HERO ===== */}
                <main className="relative w-full min-h-screen flex items-center justify-center overflow-hidden px-4">
                    <div className="absolute inset-0 z-0">
                        <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] bg-purple-600/30 rounded-full blur-3xl" />
                        <motion.div animate={{ rotate: -360, scale: [1, 0.8, 1] }} transition={{ duration: 35, repeat: Infinity, ease: "linear", delay: 5 }} className="absolute bottom-[-20%] right-[-20%] w-[50vw] h-[50vw] bg-orange-500/20 rounded-full blur-3xl" />
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl opacity-50" />
                    </div>
                    {/* ZAKTUALIZOWANA TREŚĆ HERO */}
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 flex flex-col items-center text-center">
                        <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white drop-shadow-2xl">
                            Przestań <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">walczyć</span> z zadaniami.<br />Zacznij je <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">rozumieć</span>.
                        </motion.h1>
                        <motion.p variants={itemVariants} className="mt-6 max-w-xl text-lg md:text-xl text-purple-200/80 font-sans font-medium">
                            Zapraszam Cię na indywidualne lekcje 1 na 1, które bezstresowo i skutecznie przygotują Cię do matury z matematyki oraz egzaminu zawodowego INF.02.
                        </motion.p>
                        <motion.p variants={itemVariants} className="mt-8 font-sans text-lg">Wybierz swoją ścieżkę:</motion.p>
                        <motion.div variants={itemVariants} className="mt-4 flex flex-col sm:flex-row items-center gap-4">
                            <motion.button onClick={() => changeRoute("/matematyka")} whileHover={{ scale: 1.05, boxShadow: "0px 10px 30px -10px rgba(192, 132, 252, 0.4)" }} whileTap={{ scale: 0.95 }} className="flex hover:cursor-pointer items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl shadow-lg">
                                <FiBookOpen /> Matematyka
                            </motion.button>
                            <motion.button onClick={() => changeRoute("/inf02")} whileHover={{ scale: 1.05, boxShadow: "0px 10px 30px -10px rgba(56, 189, 248, 0.4)" }} whileTap={{ scale: 0.95 }} className="flex hover:cursor-pointer items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-xl shadow-lg">
                                <FiMonitor /> INF.02
                            </motion.button>
                        </motion.div>
                    </motion.div>
                </main>

                {/* ===== SEKCJA: KLUCZOWE ATUTY (ZAMIAST FUNKCJI) ===== */}
                <section className="py-20 sm:py-32 px-4 relative overflow-hidden">
                    <div className="absolute inset-0 z-0 opacity-30">
                        <motion.div initial={{ x: "-50%", y: "50%", opacity: 0 }} whileInView={{ x: "-20%", y: "0%", opacity: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} className="absolute top-36 left-0 w-[60rem] h-[60rem] bg-pink-600/40 rounded-full blur-3xl" />
                        <motion.div initial={{ x: "50%", y: "-50%", opacity: 0 }} whileInView={{ x: "20%", y: "0%", opacity: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} className="absolute top-0 right-0 w-[60rem] h-[60rem] bg-indigo-600/40 rounded-full blur-3xl" />
                    </div>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={containerVariants} className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
                        <motion.h2 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl text-center mb-4">Dlaczego warto uczyć się <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">ze mną</span>?</motion.h2>
                        <motion.p variants={itemVariants} className="text-purple-200/70 font-sans text-lg max-w-2xl text-center mb-16">Bo wierzę, że kluczem do sukcesu jest spokój, zrozumienie i metody dopasowane do Ciebie.</motion.p>
                        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                            {features.map((feature, index) => (
                                <motion.div key={index} variants={itemVariants} className="p-8 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-sm hover:border-purple-400 transition-all duration-300 flex flex-col items-start">
                                    <div className="p-4 rounded-2xl bg-slate-700/50 mb-6">{feature.icon}</div>
                                    <h3 className="text-2xl mb-4 text-white">{feature.title}</h3>
                                    <p className="font-sans text-purple-200/70">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </section>

                {/* ===== SEKCJA: PROBLEM vs ROZWIĄZANIE ===== */}
                <section className="py-20 sm:py-32 px-4 relative overflow-hidden">
                    <div className="absolute inset-0 z-0 opacity-30">
                        <motion.div initial={{ x: "-50%", y: "50%", opacity: 0 }} whileInView={{ x: "-20%", y: "0%", opacity: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} className="absolute top-0 left-0 w-[60rem] h-[60rem] bg-red-600/40 rounded-full blur-3xl" />
                        <motion.div initial={{ x: "50%", y: "-50%", opacity: 0 }} whileInView={{ x: "20%", y: "0%", opacity: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} className="absolute bottom-0 right-0 w-[60rem] h-[60rem] bg-green-600/40 rounded-full blur-3xl" />
                    </div>
                    <div className="max-w-7xl mx-auto relative z-10">
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="text-center mb-16">
                            <h2 className="text-4xl sm:text-5xl md:text-6xl">Koniec z kuciem na pamięć.</h2>
                            <p className="text-purple-200/70 font-sans text-lg max-w-3xl mx-auto mt-4">Istnieje lepszy sposób na przygotowanie się do egzaminu. Zobacz różnicę.</p>
                        </motion.div>
                        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-px bg-gradient-to-b from-transparent via-purple-500 to-transparent hidden md:block"></div>
                            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6 }} className="p-8 rounded-3xl bg-slate-800/50 border border-red-500/30 backdrop-blur-sm">
                                <h3 className="text-3xl text-red-400 mb-6">Stara Szkoła</h3>
                                <ul className="space-y-4 font-sans text-lg">
                                    <li className="flex items-start gap-3"><FiXCircle className="text-red-500 mt-1 shrink-0" /><span>Grube podręczniki i nudne definicje.</span></li>
                                    <li className="flex items-start gap-3"><FiXCircle className="text-red-500 mt-1 shrink-0" /><span>Brak informacji zwrotnej i poczucie zagubienia.</span></li>
                                    <li className="flex items-start gap-3"><FiXCircle className="text-red-500 mt-1 shrink-0" /><span>Uczenie się na pamięć wzorów bez zrozumienia.</span></li>
                                    <li className="flex items-start gap-3"><FiXCircle className="text-red-500 mt-1 shrink-0" /><span>Stres i niepewność przed egzaminem.</span></li>
                                </ul>
                            </motion.div>
                             {/* ZAKTUALIZOWANE PUNKTY "MOJA METODA" */}
                            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6 }} className="p-8 rounded-3xl bg-slate-800/50 border border-green-500/30 backdrop-blur-sm">
                                <h3 className="text-3xl text-green-400 mb-6">Moja Metoda Nauki</h3>
                                <ul className="space-y-4 font-sans text-lg">
                                    <li className="flex items-start gap-3"><FiCheckCircle className="text-green-500 mt-1 shrink-0" /><span>Angażujące lekcje 1 na 1, na których możesz pytać o wszystko.</span></li>
                                    <li className="flex items-start gap-3"><FiCheckCircle className="text-green-500 mt-1 shrink-0" /><span>Natychmiastowa informacja zwrotna i wspólne rozwiązywanie problemów.</span></li>
                                    <li className="flex items-start gap-3"><FiCheckCircle className="text-green-500 mt-1 shrink-0" /><span>Nauka oparta na zrozumieniu, a nie na bezmyślnym powtarzaniu.</span></li>
                                    <li className="flex items-start gap-3"><FiCheckCircle className="text-green-500 mt-1 shrink-0" /><span>Pewność siebie i spokój w dniu egzaminu.</span></li>
                                </ul>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </div>
            
            <AnimatePresence>
              {routeLoading && <LoadingScreen />}
            </AnimatePresence>
        </>
    );
}