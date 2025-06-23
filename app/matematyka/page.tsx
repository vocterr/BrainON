"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { FiArrowRight, FiCheckCircle, FiBarChart2, FiCpu } from 'react-icons/fi';

export default function MatematykaPage() {
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
        {
            icon: <FiCpu />,
            title: "Myślenie, nie Wkuwanie",
            text: "Nie będziemy bezmyślnie powtarzać regułek. Nauczę Cię zadawać właściwe pytania i samodzielnie dochodzić do odpowiedzi. Kiedy zrozumiesz 'dlaczego', każde 'jak' stanie się proste."
        },
        {
            icon: <FiBarChart2 />,
            title: "Logika Programisty w Zadaniach",
            text: "Jako programista, podchodzę do problemów systemowo. Pokażę Ci, jak 'debugować' swoje błędy w myśleniu i rozbijać najtrudniejsze zadania na małe, zrozumiałe części."
        },
        {
            icon: <FiCheckCircle />,
            title: "Atmosfera Stoickiego Spokoju",
            text: "Zero presji, zero oceniania. U mnie możesz pytać o wszystko, nawet o podstawy. Tworzymy bezpieczną przestrzeń, gdzie liczy się Twój komfort i realny postęp, a nie wyścig z czasem."
        }
    ];

    const topics = ["Funkcje i ich własności", "Geometria analityczna", "Planimetria i stereometria", "Rachunek prawdopodobieństwa", "Ciągi liczbowe", "Trygonometria", "Logika i zbiory", "Optymalizacja"];

    return (
        <div className="w-full bg-slate-900 text-white font-chewy">
            {/* ===== SEKCJA HERO ===== */}
            <main className="relative w-full min-h-screen flex items-center justify-center overflow-hidden px-4">
                <div className="absolute inset-0 z-0 opacity-50">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute top-[-40%] left-[-20%] w-[70vw] h-[70vw] bg-purple-700/40 rounded-full blur-3xl" />
                    <motion.div animate={{ rotate: -360 }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-40%] right-[-20%] w-[60vw] h-[60vw] bg-pink-500/30 rounded-full blur-3xl" />
                </div>
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-8 items-center max-w-7xl mx-auto relative z-10">
                    <motion.div variants={itemVariants}>
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white drop-shadow-2xl">
                            Matematyka, z którą wreszcie <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">się dogadasz</span>.
                        </h1>
                        <p className="mt-6 text-xl md:text-2xl text-purple-200/80 font-sans">
                            Pamiętam, jak pomogłem koledze, który z jedynkowicza stał się czwórkowiczem. To nie magia. To pokazanie, że każdy problem to logiczna łamigłówka, którą możemy razem, w bezstresowej atmosferze rozwiązać.
                        </p>
                    </motion.div>
                    <motion.div variants={itemVariants} className="h-64 md:h-96 flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 400 200">
                            <motion.path
                                d="M 10 100 C 50 10, 150 190, 200 100 S 350 10, 390 100"
                                fill="none"
                                stroke="url(#gradient)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                            />
                            <defs>
                                <linearGradient id="gradient" gradientTransform="rotate(90)">
                                    <stop offset="0%" stopColor="#c084fc" />
                                    <stop offset="100%" stopColor="#f9a8d4" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </motion.div>
                </motion.div>
            </main>

            {/* ===== SEKCJA: MOJE METODY NAUCZANIA ===== */}
            <section className="py-20 sm:py-32 px-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-30">
                    <motion.div initial={{ scale: 1 }} whileInView={{ scale: 1.5 }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] bg-gradient-to-r from-pink-500 via-indigo-500 to-purple-500 rounded-full blur-3xl" />
                </div>
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={containerVariants} className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
                    <motion.h2 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl text-center mb-16">Jak uczę? Oto mój przepis na sukces.</motion.h2>
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                        {teachingMethods.map((method, index) => (
                            <motion.div key={index} variants={itemVariants} className="p-8 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-sm hover:border-pink-400 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center">
                                <div className="p-5 rounded-full bg-slate-700/50 mb-6 text-pink-400 text-4xl">{method.icon}</div>
                                <h3 className="text-2xl mb-4 text-white">{method.title}</h3>
                                <p className="font-sans text-purple-200/70">{method.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>
            
            {/* ===== SEKCJA: ZAKRES MATERIAŁU ===== */}
            <section className="py-20 sm:py-32 px-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-15">
                    <motion.div initial={{ scale: 0.5 }} whileInView={{ scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80rem] h-[80rem] bg-yellow-600/50 rounded-full blur-3xl" />
                </div>
                <div className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
                    <motion.h2 initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true, amount: 0.2}} transition={{duration: 0.6}} className="text-4xl sm:text-5xl md:text-6xl text-center mb-4">Co razem <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">opanujemy</span>?</motion.h2>
                    <motion.p initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true, amount: 0.2}} transition={{duration: 0.6, delay: 0.1}} className="text-purple-200/70 font-sans text-lg max-w-2xl text-center mb-16">
                        Skupiamy się na solidnych fundamentach, które są kluczem do sukcesu na każdym etapie – od szkoły podstawowej po liceum. Poniższe działy to nasza baza wypadowa do budowania Twojej pewności siebie. (Przygotowanie do matury wkrótce w ofercie!)
                    </motion.p>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={containerVariants} className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {topics.map((topic) => (
                            <motion.div key={topic} variants={itemVariants} className="p-6 text-center rounded-2xl bg-slate-800/50 border border-purple-500/20 backdrop-blur-sm cursor-pointer hover:bg-purple-500/20 transition-colors">
                                <p className="text-lg sm:text-xl">{topic}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ===== SEKCJA: INTERAKTYWNE ZADANIE ===== */}
            <section className="py-20 sm:py-32 px-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-25">
                    <motion.div initial={{ y: "50%" }} whileInView={{ y: 0 }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute -bottom-1/2 left-1/2 -translate-x-1/2 w-[100rem] h-[50rem] bg-gradient-to-t from-indigo-600/50 to-transparent rounded-t-full blur-3xl" />
                </div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.h2 initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true, amount: 0.2}} transition={{duration: 0.6}} className="text-4xl sm:text-5xl md:text-6xl mb-4">Zobacz, jak to działa w praktyce.</motion.h2>
                    <motion.p initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true, amount: 0.2}} transition={{duration: 0.6, delay: 0.1}} className="text-purple-200/70 font-sans text-lg mb-12">
                        Weźmy zadanie, które często sprawia problemy. Zobacz, jak na spokojnie można je 'rozkodować', krok po kroku, bez zbędnej paniki.
                    </motion.p>
                    <motion.div initial={{opacity: 0, scale: 0.95}} whileInView={{opacity: 1, scale: 1}} viewport={{once: true, amount: 0.2}} transition={{duration: 0.6}} className="p-8 rounded-3xl bg-slate-800/80 border border-purple-500/30 backdrop-blur-lg text-left font-sans relative overflow-hidden">
                        <p className="text-lg mb-4"><span className="font-bold text-purple-300">Zadanie:</span> Drut o długości 100 cm należy podzielić na dwie części. Z jednej części tworzymy kwadratową ramkę, a z drugiej okrąg. Jak należy podzielić drut, aby suma pól obu figur była najmniejsza?</p>
                        <hr className="border-purple-500/30 my-6"/>
                        <AnimatePresence>
                            {isSolved && (
                                <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}}>
                                    <p className="mb-2 text-xl font-chewy text-green-400">Rozwiązanie krok po kroku:</p>
                                    <p className="mb-2"><span className="text-green-400 font-bold">1. Oznaczmy sobie:</span>{` Niech `}<span className="text-yellow-400">x</span>{` to część drutu na kwadrat, a `}<span className="text-yellow-400">100-x</span>{` to część na okrąg.`}</p>
                                    
                                    {/* ===== POPRAWIONE LINIE Z LATEX ===== */}
                                    <p className="mb-2">
                                        <span className="text-green-400 font-bold">2. Wzory na pola:</span>
                                        {` Bok kwadratu to $a = \\frac{x}{4}$, więc jego pole $P_k = (\\frac{x}{4})^2$. Obwód okręgu to $2\\pi r = 100-x$, czyli promień $r = \\frac{100-x}{2\\pi}$. Pole koła $P_o = \\pi r^2 = \\pi (\\frac{100-x}{2\\pi})^2$.`}
                                    </p>
                                    <p className="mb-2">
                                        <span className="text-green-400 font-bold">3. Funkcja sumy pól:</span>
                                        {` Sumujemy oba pola, by stworzyć funkcję, którą będziemy optymalizować: $S(x) = \\frac{x^2}{16} + \\frac{(100-x)^2}{4\\pi}$.`}
                                    </p>
                                    <p className="mb-4">
                                        <span className="text-green-400 font-bold">4. Pochodna i minimum:</span>
                                        {` Szukamy minimum tej funkcji. Liczymy pochodną $S'(x)$, przyrównujemy ją do zera i rozwiązujemy. Otrzymujemy optymalną wartość `}<span className="text-yellow-400">x ≈ 56</span>{` cm.`}
                                    </p>
                                    <p className="text-lg font-bold text-white">Odpowiedź: Aby suma pól była najmniejsza, na kwadrat trzeba wziąć ok. 56 cm drutu, a na okrąg resztę, czyli ok. 44 cm.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {!isSolved && (
                            <motion.button onClick={() => setIsSolved(true)} className="w-full hover:cursor-pointer mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-chewy hover:scale-105 transition-transform">
                                Zobacz rozwiązanie
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
                <motion.div initial={{opacity: 0}} whileInView={{opacity: 1}} viewport={{once: true, amount: 0.3}} transition={{duration: 0.8}} className="max-w-3xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl mb-6">Gotów, by spojrzeć na matematykę <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">inaczej</span>?</h2>
                    <p className="text-purple-200/80 font-sans text-lg mb-8">Koniec z odkładaniem na później. Zróbmy razem pierwszy krok w stronę Twojego sukcesu i lepszych ocen. Czekam na Ciebie!</p>
                    <motion.button onClick={() => changeRoute("zacznij-teraz")} whileHover={{ scale: 1.05, boxShadow: "0px 10px 30px -10px rgba(251, 191, 36, 0.5)" }} whileTap={{ scale: 0.95 }} className="flex hover:cursor-pointer items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 text-white text-xl shadow-lg mx-auto">
                        Zarezerwuj termin <FiArrowRight />
                    </motion.button>
                </motion.div>
            </section>
        </div>
    );
}