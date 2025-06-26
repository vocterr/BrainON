// FILE: app/o-mnie/page.tsx

"use client";

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { FiUser, FiCode, FiCpu, FiCheckCircle, FiZap, FiAward, FiArrowRight } from 'react-icons/fi';
import { useIsMobile } from '@/lib/useIsMobile'; // KROK 1: Import

export default function AboutMePage() {
    const [routeLoading, startTransition] = useTransition();
    const router = useRouter();
    const isMobile = useIsMobile(); // KROK 2: Użycie hooka

    const changeRoute = (route: string) => {
        startTransition(() => {
            router.push(route);
        });
    }

    // KROK 3: Warunkowa animacja
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: isMobile ? 0 : 0.2, duration: 0.5 } },
    };

    const itemVariants = {
        hidden: isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };
    
    const timelineItemVariants = (index: number) => ({
        hidden: isMobile ? { opacity: 1, x: 0 } : { opacity: 0, x: index % 2 === 0 ? -50 : 50 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
    });

    const timelineEvents = [
        { year: "Od zawsze", title: "Naturalna Ciekawość", text: "Od kiedy pamiętam, pociągała mnie elegancja i logika w matematyce i informatyce. To, co dla innych było zbiorem reguł, dla mnie było fascynującą łamigłówką." },
        { year: "W szkole", title: "Odkrycie Pasji do Nauczania", text: "Zauważyłem, że potrafię tłumaczyć skomplikowane tematy w prosty sposób. Gdy koledzy z klasy prosili o pomoc, odkryłem, że sprawia mi to ogromną satysfakcję." },
        { year: "Dzisiaj", title: "Sprawdzona Metoda", text: "Ci sami koledzy, którzy wcześniej mieli zaległości, zaczęli dostawać dobre oceny. Wtedy zrozumiałem, że moje spokojne i logiczne podejście naprawdę działa i może pomóc innym poczuć się pewnie." }
    ];
    
    const teachingPhilosophy = [
        { icon: <FiZap className="w-8 h-8"/>, title: "Zrozumienie, nie wkuwanie", text: "Moim celem jest, abyś naprawdę ZROZUMIAŁ, dlaczego dany wzór czy algorytm działa. Koniec z bezmyślnym zapamiętywaniem." },
        { icon: <FiCode className="w-8 h-8"/>, title: "Praktyka to podstawa", text: "Wierzę, że najlepszą formą nauki jest rozwiązywanie realnych problemów. Na naszych lekcjach 1 na 1 skupiamy się na zadaniach, które od razu pokazują teorię w działaniu." },
        { icon: <FiAward className="w-8 h-8"/>, title: "Stoicki Spokój", text: "Nie ma głupich pytań. Tworzę atmosferę, w której możesz czuć się swobodnie, popełniać błędy i uczyć się bez presji. Twój komfort jest dla mnie priorytetem." }
    ];

    return (
        <div className="w-full bg-slate-900 text-white font-chewy">
            <main className="relative w-full min-h-screen flex items-center justify-center overflow-hidden px-4 py-24">
                <div className="absolute inset-0 z-0 opacity-40 hidden md:block">
                    <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute top-[-50%] left-[-25%] w-[80vw] h-[80vw] bg-purple-600/40 rounded-full blur-3xl" />
                    <motion.div animate={{ rotate: -360, scale: [1, 0.8, 1] }} transition={{ duration: 35, repeat: Infinity, ease: "linear", delay: 5 }} className="absolute bottom-[-50%] right-[-25%] w-[70vw] h-[70vw] bg-orange-500/30 rounded-full blur-3xl" />
                </div>

                <motion.div
                    // KROK 4: Zastosowanie warunkowych animacji
                    variants={isMobile ? undefined : containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-7xl w-full mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10"
                >
                    <motion.div variants={isMobile ? undefined : itemVariants}>
                        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white drop-shadow-2xl">
                            Cześć, jestem <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">Bartek</span>
                        </h1>
                        <p className="mt-6 text-3xl md:text-4xl text-white">Po prostu lubię, gdy trudne rzeczy stają się proste.</p>
                        <p className="mt-8 font-sans text-lg text-purple-200/70">Zawsze fascynowała mnie logika ukryta w matematyce i informatyce. Na tej stronie dzielę się swoim sposobem patrzenia na te przedmioty — spokojnie, bez presji i bez wkuwania. Chcę pokazać, że Ty też możesz to zrozumieć i poczuć satysfakcję z rozwiązywania zadań.</p>
                    </motion.div>

                    <motion.div variants={isMobile ? undefined : itemVariants} className="relative flex items-center justify-center">
                        <div className="hidden md:block">
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
                        </div>
                        <div className="w-full max-w-sm aspect-square bg-slate-800/80 rounded-full backdrop-blur-lg flex flex-col items-center justify-center p-8 text-center border-2 border-white/10">
                            <FiUser className="w-24 h-24 text-purple-300 mb-4" />
                            <p className="font-sans text-purple-200/80">Twoje zdjęcie tutaj</p>
                        </div>
                    </motion.div>
                </motion.div>
            </main>

            <section className="py-20 sm:py-32 px-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20 hidden md:block">
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-900 to-transparent" />
                    <motion.div initial={{y: "100%"}} whileInView={{y: 0}} transition={{duration: 1.5, ease: "easeOut"}} className="absolute bottom-0 left-1/4 w-[50rem] h-[50rem] bg-gradient-to-tr from-pink-600/50 to-purple-600/50 rounded-full blur-3xl" />
                </div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div initial={isMobile ? {opacity:1, y:0} : {opacity: 0, y:20}} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{duration: 0.5}} className="text-center mb-20">
                        <h2 className="text-4xl sm:text-5xl md:text-6xl">Dlaczego uczę? Moja historia</h2>
                        <p className="text-purple-200/70 font-sans text-lg max-w-2xl mx-auto mt-4">Moje podejście to połączenie wrodzonej pasji do logiki i szczerej chęci pomagania innym.</p>
                    </motion.div>

                    <div className="relative">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/50 to-transparent -translate-x-1/2 hidden md:block"></div>
                        {timelineEvents.map((event, index) => (
                            <motion.div
                                key={index}
                                variants={timelineItemVariants(index)}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.5 }}
                                className={`relative flex items-center mb-12 ${index % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}`}
                            >
                                <div className={`w-full md:w-1/2 p-6 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-sm ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                                    <p className="text-3xl text-yellow-400 mb-2">{event.year}</p>
                                    <h3 className="text-2xl text-white mb-3">{event.title}</h3>
                                    <p className="font-sans text-purple-200/70">{event.text}</p>
                                </div>
                                <div className="absolute left-1/2 top-1/2 w-6 h-6 bg-slate-900 border-4 border-yellow-400 rounded-full -translate-x-1/2 -translate-y-1/2 hidden md:block"></div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 sm:py-32 px-4">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={isMobile ? undefined : containerVariants}
                    className="max-w-7xl mx-auto flex flex-col items-center"
                >
                    <motion.h2 variants={isMobile ? undefined : itemVariants} className="text-4xl sm:text-5xl md:text-6xl text-center mb-4">Uczę inaczej</motion.h2>
                    <motion.p variants={isMobile ? undefined : itemVariants} className="text-purple-200/70 font-sans text-lg max-w-2xl text-center mb-16">Oto 3 filary, na których opiera się każda nasza lekcja.</motion.p>
                    
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                        {teachingPhilosophy.map((item, index) => (
                            <motion.div key={index} variants={isMobile ? undefined : itemVariants} className="p-8 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-sm flex flex-col items-center text-center hover:border-purple-400 hover:-translate-y-2 transition-all duration-300">
                                <div className="p-5 rounded-full bg-gradient-to-br from-purple-600/50 to-pink-500/50 mb-6 text-white text-3xl">{item.icon}</div>
                                <h3 className="text-2xl mb-4 text-white">{item.title}</h3>
                                <p className="font-sans text-purple-200/70">{item.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>
            
            <section className="py-20 sm:py-32 px-4">
                 <motion.div 
                    initial={isMobile ? {opacity: 1} : {opacity: 0}}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{duration: 0.6}}
                    className="max-w-3xl mx-auto text-center"
                >
                    <h2 className="text-4xl sm:text-5xl md:text-6xl mb-6">Porozmawiajmy o <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">Twoich celach</span>.</h2>
                    <p className="text-purple-200/80 font-sans text-lg mb-8">Moja historia pokazuje, że wszystko jest możliwe. Teraz pora na Ciebie. Zobacz, w czym mogę Ci pomóc i zróbmy pierwszy krok w stronę Twojego sukcesu.</p>
                    <motion.button onClick={() => changeRoute("/zacznij-teraz")} whileHover={{ scale: 1.05, boxShadow: "0px 10px 30px -10px rgba(251, 191, 36, 0.5)" }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 text-white text-xl shadow-lg mx-auto">
                        Zacznij Teraz <FiArrowRight />
                    </motion.button>
                </motion.div>
            </section>
        </div>
    );
}