import React, { Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { FiBookOpen, FiCode, FiMail, FiUser, FiArrowRight, FiLogIn, FiLogOut, FiLoader } from 'react-icons/fi';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Komponent przyjmuje teraz router do obsługi nawigacji
export const MenuTopbar = ({ isMenuClicked, setIsMenuClicked }: { 
    isMenuClicked: boolean, 
    setIsMenuClicked: Dispatch<SetStateAction<boolean>> 
}) => {
    
    const { data: session, status } = useSession();
    const router = useRouter();
    
    // Funkcja do zamykania menu i nawigacji
    const handleNavigation = (route: string) => {
        setIsMenuClicked(false);
        router.push(route);
    };

    const menuItems = [
        { name: "Matematyka", route: "/matematyka", icon: FiBookOpen, color: "from-purple-500 to-purple-700" },
        { name: "INF.02", route: "/inf.02", icon: FiCode, color: "from-slate-500 to-slate-700" },
        { name: "O mnie", route: "/o-mnie", icon: FiUser, color: "from-slate-600 to-purple-600" },
        { name: "Kontakt", route: "/kontakt", icon: FiMail, color: "from-purple-700 to-slate-700" }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08, // Delikatnie przyspieszamy animacje
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -40 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <AnimatePresence>
            {isMenuClicked && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed font-chewy inset-0 z-[100] bg-slate-900/80 backdrop-blur-2xl"
                >
                    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden p-4">
                        {/* Tło Aurora Glow */}
                        <div className="absolute inset-0 z-0 opacity-40">
                            <motion.div animate={{ x: ['-5%', '5%', '-5%'], y: ['-10%', '10%', '-10%'] }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }} className="absolute top-[-50%] left-[-50%] w-[150vw] h-[150vw] bg-purple-600/50 rounded-full blur-3xl" />
                            <motion.div animate={{ x: ['5%', '-5%', '5%'], y: ['10%', '-10%', '10%'] }} transition={{ duration: 90, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-50%] right-[-50%] w-[150vw] h-[150vw] bg-cyan-500/40 rounded-full blur-3xl" />
                        </div>

                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="relative z-10 flex flex-col items-center gap-4"
                        >
                            {/* Nagłówek i Logo */}
                            <motion.div variants={itemVariants} className="text-center">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-5xl">
                                    Brain:<b className="bg-gradient-to-r from-amber-600 to-lime-600 bg-clip-text text-transparent ">ON</b>
                                </span>
                                <p className="font-sans text-purple-200/70 mt-2">Nawiguj do sukcesu</p>
                            </motion.div>

                            {/* Przyciski Menu */}
                            <div className="flex flex-col space-y-3">
                                {menuItems.map((item) => (
                                    <motion.div
                                        key={item.name}
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.05, x: 10 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="relative"
                                    >
                                        <button
                                            className={`relative overflow-hidden text-white text-xl py-5 px-8 rounded-2xl bg-gradient-to-r ${item.color} backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300 flex items-center space-x-4 min-w-[280px] justify-start shadow-2xl group`}
                                            onClick={() => handleNavigation(item.route)}
                                        >
                                            <div className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg flex items-center justify-center"><div className="w-2.5 h-2.5 bg-white/30 rounded-full"></div></div>
                                            <div className="absolute top-0 right-0 w-5 h-5 bg-black/10 transform rotate-45 translate-x-2.5 -translate-y-2.5"></div>
                                            <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300">
                                                <item.icon size={24} />
                                            </div>
                                            <span className="tracking-wide">{item.name}</span>
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                            
                            {/* Sekcja przycisków akcji */}
                            <motion.div variants={itemVariants} className="w-full max-w-[280px] mt-4 flex flex-col gap-3">
                                <button
                                    onClick={() => handleNavigation('/zacznij-teraz')}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 text-white shadow-lg text-lg font-sans hover:scale-105 transition-transform"
                                >
                                    <span>Zacznij Teraz</span>
                                    <FiArrowRight />
                                </button>
                                
                                {status === 'loading' && (
                                    <div className="w-full flex items-center justify-center p-3 rounded-xl bg-slate-700/50">
                                        <FiLoader className="animate-spin text-slate-400" />
                                    </div>
                                )}
                                
                                {status === 'unauthenticated' && (
                                    <button
                                        onClick={() => handleNavigation('/login')}
                                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white text-lg font-sans hover:bg-slate-700 transition-colors"
                                    >
                                        <FiLogIn />
                                        <span>Zaloguj się</span>
                                    </button>
                                )}

                                {status === 'authenticated' && (
                                    <button
                                        onClick={() => {
                                            signOut();
                                            setIsMenuClicked(false);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-lg font-sans hover:bg-red-500/30 transition-colors"
                                    >
                                        <FiLogOut />
                                        <span>Wyloguj się</span>
                                    </button>
                                )}
                            </motion.div>
                            
                            {/* Przycisk Zamknij */}
                            <motion.div variants={itemVariants}>
                                <button onClick={() => setIsMenuClicked(false)} className='w-full text-center py-2 mt-2 font-sans text-purple-300/80 hover:text-white transition-colors'>
                                    Zamknij
                                </button>
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
