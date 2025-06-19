"use client"

import {motion} from "framer-motion"

const LoadingScreen = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='fixed top-0 left-0 z-[9999] inset-0 bg-slate-900 flex flex-col items-center justify-center gap-6'
        >
            {/* Animowana rakieta */}
            <motion.div
                animate={{
                    y: [0, -30, 0],
                    rotate: [0, 3, -3, 0]
                }}
                transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <span className="text-7xl drop-shadow-2xl">🚀</span>
            </motion.div>

            {/* Animowane cząsteczki "dymu" */}
            <div className="relative w-24 h-24">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: 0, scale: 1, opacity: 1 }}
                        animate={{
                            y: [20, 100],
                            scale: [1, 0],
                            opacity: [1, 0]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: "easeOut"
                        }}
                        style={{
                            position: 'absolute',
                            left: `${40 + Math.random() * 20}%`, // Losowa pozycja w poziomie
                        }}
                        className="w-3 h-3 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full"
                    />
                ))}
            </div>

            {/* Pulsujący tekst */}
            <motion.p
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="font-chewy text-2xl text-purple-200"
            >
                Odpalamy silniki...
            </motion.p>
        </motion.div>
    );
};
export default LoadingScreen