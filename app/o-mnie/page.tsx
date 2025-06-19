"use client";

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { FiUser, FiCode, FiCpu, FiEye, FiZap, FiAward, FiArrowRight } from 'react-icons/fi';

// Możesz umieścić ten komponent w osobnym pliku, np. /app/o-mnie/page.tsx
export default function AboutMePage() {
        const [routeLoading, startTransition] = useTransition();
        const router = useRouter();
    
        const changeRoute = (route: string) => {
            startTransition(() => {
              router.push(route);
            });
        }
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2, duration: 0.5 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    const timelineEvents = [
        { year: "2018", title: "Początki Frustracji", text: "Jako uczeń sam zmagałem się z niezrozumiałymi podręcznikami i wkuwaniem wzorów na pamięć. Czułem, że musi istnieć lepszy sposób." },
        { year: "2020", title: "Moment Przełomowy", text: "Odkryłem, że kluczem jest wizualizacja i praktyka. Zacząłem tworzyć własne notatki i programy, które pomagały mi zrozumieć, a nie tylko zapamiętać." },
        { year: "2023", title: "Narodziny Brain:ON", text: "Postanowiłem podzielić się moimi metodami. Tak powstała ta platforma – z pasji do rozwiązywania problemów i chęci pomocy innym." }
    ];

    const teachingPhilosophy = [
        { icon: <FiZap />, title: "Zrozumienie, nie wkuwanie", text: "Moim celem jest, abyś naprawdę ZROZUMIAŁ, dlaczego dany wzór czy algorytm działa. Koniec z bezmyślnym zapamiętywaniem." },
        { icon: <FiCode />, title: "Praktyka to podstawa", text: "Wierzę, że najlepszą formą nauki jest rozwiązywanie realnych problemów. Dlatego nasza platforma opiera się na tysiącach praktycznych zadań." },
        { icon: <FiEye />, title: "Wizualizacja problemów", text: "Każde trudne zagadnienie staram się przedstawić w sposób graficzny i intuicyjny, bo obraz jest wart więcej niż tysiąc słów." }
    ];

    return (
        <div className="w-full bg-slate-900 text-white font-chewy">
            {/* ===== SEKCJA HERO ===== */}
            <main className="relative w-full min-h-screen flex items-center justify-center overflow-hidden px-4 py-24">
                <div className="absolute inset-0 z-0 opacity-40">
                    <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute top-[-50%] left-[-25%] w-[80vw] h-[80vw] bg-purple-600/40 rounded-full blur-3xl" />
                    <motion.div animate={{ rotate: -360, scale: [1, 0.8, 1] }} transition={{ duration: 35, repeat: Infinity, ease: "linear", delay: 5 }} className="absolute bottom-[-50%] right-[-25%] w-[70vw] h-[70vw] bg-orange-500/30 rounded-full blur-3xl" />
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-7xl w-full mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10"
                >
                    {/* Lewa kolumna: Tekst */}
                    <motion.div variants={itemVariants}>
                        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white drop-shadow-2xl">
                            Cześć, jestem <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">[Twoje Imię]</span>
                        </h1>
                        <p className="mt-6 text-2xl text-purple-200/90">Moja misja jest prosta:</p>
                        <p className="mt-2 text-3xl md:text-4xl text-white">sprawić, byś pokochał kod i cyfry tak samo jak ja.</p>
                        <p className="mt-8 font-sans text-lg text-purple-200/70">Jestem pasjonatem informatyki i matematyki, który wierzy, że każdy może osiągnąć sukces na egzaminach – wystarczą odpowiednie narzędzia i odrobina zaangażowania. Dlatego stworzyłem Brain:ON.</p>
                    </motion.div>

                    {/* Prawa kolumna: Placeholder na zdjęcie */}
                    <motion.div variants={itemVariants} className="relative flex items-center justify-center">
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute w-full max-w-sm aspect-square border-4 border-purple-500/50 rounded-full"
                        />
                        <motion.div 
                            animate={{ rotate: -360 }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="absolute w-full max-w-sm aspect-square border-4 border-orange-500/40 rounded-full scale-75"
                        />
                        <div className="w-full max-w-sm aspect-square bg-slate-800/80 rounded-full backdrop-blur-lg flex flex-col items-center justify-center p-8 text-center border-2 border-white/10">
                            <FiUser className="w-24 h-24 text-purple-300 mb-4" />
                            <p className="font-sans text-purple-200/80">Twoje zdjęcie tutaj</p>
                        </div>
                    </motion.div>
                </motion.div>
            </main>

            {/* ===== SEKCJA: MOJA HISTORIA (TIMELINE) ===== */}
            <section className="py-20 sm:py-32 px-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20">
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-900 to-transparent" />
                    <motion.div initial={{y: "100%"}} whileInView={{y: 0}} transition={{duration: 1.5, ease: "easeOut"}} className="absolute bottom-0 left-1/4 w-[50rem] h-[50rem] bg-gradient-to-tr from-pink-600/50 to-purple-600/50 rounded-full blur-3xl" />
                </div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={itemVariants} className="text-center mb-20">
                        <h2 className="text-4xl sm:text-5xl md:text-6xl">Od frustracji do pasji</h2>
                        <p className="text-purple-200/70 font-sans text-lg max-w-2xl mx-auto mt-4">Brain:ON nie powstało przez przypadek. To wynik mojej własnej drogi.</p>
                    </motion.div>

                    <div className="relative">
                        {/* Linia czasu */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/50 to-transparent -translate-x-1/2"></div>

                        {timelineEvents.map((event, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.5 }}
                                transition={{ duration: 0.6 }}
                                className={`relative flex items-center mb-12 ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                            >
                                <div className={`w-1/2 p-6 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-sm ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                                    <p className="text-3xl text-yellow-400 mb-2">{event.year}</p>
                                    <h3 className="text-2xl text-white mb-3">{event.title}</h3>
                                    <p className="font-sans text-purple-200/70">{event.text}</p>
                                </div>
                                <div className="absolute left-1/2 top-1/2 w-6 h-6 bg-slate-900 border-4 border-yellow-400 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== SEKCJA: MOJA FILOZOFIA ===== */}
            <section className="py-20 sm:py-32 px-4">
                <motion.div 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={containerVariants}
                  className="max-w-7xl mx-auto flex flex-col items-center"
                >
                    <motion.h2 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl text-center mb-4">Uczę inaczej</motion.h2>
                    <motion.p variants={itemVariants} className="text-purple-200/70 font-sans text-lg max-w-2xl text-center mb-16">Oto 3 filary, na których opiera się każda lekcja na platformie Brain:ON.</motion.p>
                    
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                        {teachingPhilosophy.map((item, index) => (
                            <motion.div key={index} variants={itemVariants} className="p-8 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-sm flex flex-col items-center text-center hover:border-purple-400 hover:-translate-y-2 transition-all duration-300">
                                <div className="p-5 rounded-full bg-gradient-to-br from-purple-600/50 to-pink-500/50 mb-6">{item.icon}</div>
                                <h3 className="text-2xl mb-4 text-white">{item.title}</h3>
                                <p className="font-sans text-purple-200/70">{item.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>
            
            {/* ===== SEKCJA: CTA ===== */}
            <section className="py-20 sm:py-32 px-4">
                 <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={itemVariants}
                    className="max-w-3xl mx-auto text-center"
                >
                    <h2 className="text-4xl sm:text-5xl md:text-6xl mb-6">Gotowy na swoją <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">transformację</span>?</h2>
                    <p className="text-purple-200/80 font-sans text-lg mb-8">Moja historia pokazuje, że wszystko jest możliwe. Teraz pora na Ciebie. Dołącz do społeczności Brain:ON i zacznij rozwiązywać zadania z pewnością siebie.</p>
                    <motion.button onClick={() => changeRoute("zacznij-teraz")} whileHover={{ scale: 1.05, boxShadow: "0px 10px 30px -10px rgba(251, 191, 36, 0.5)" }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 text-white text-xl shadow-lg mx-auto">
                        Zobacz moje kursy <FiArrowRight />
                    </motion.button>
                </motion.div>
            </section>
        </div>
    );
}