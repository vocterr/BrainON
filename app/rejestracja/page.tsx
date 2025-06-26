// FILE: app/rejestracja/page.tsx

"use client";

import { motion } from 'framer-motion';
import { useState, FormEvent } from 'react';
import { FiUser, FiMail, FiLock, FiLoader } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useIsMobile } from '@/lib/useIsMobile'; // KROK 1: Import

export default function RegisterPage() {
    const router = useRouter();
    const isMobile = useIsMobile(); // KROK 2: Użycie hooka
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Hasła nie są identyczne.");
            return;
        }
        if (!agreedToTerms) {
            setError("Musisz zaakceptować regulamin.");
            return;
        }
        
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            if (res.ok) {
                router.push('/login');
            } else {
                const errorData = await res.json();
                setError(errorData.message || 'Wystąpił błąd podczas rejestracji.');
            }
        } catch (error) {
            setError('Nie udało się połączyć z serwerem. Spróbuj ponownie później.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGoogleRegister = async () => {
        // Logika logowania przez Google
    };
    
    // KROK 3: Warunkowe animacje
    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: { staggerChildren: isMobile ? 0 : 0.08 }
        },
    };

    const itemVariants = {
        hidden: isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0},
    };

    return (
        <main className="w-full min-h-screen flex items-center justify-center bg-slate-900 text-white font-chewy p-4 relative top-20 md:top-0 overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-40 hidden md:block">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} className="absolute top-[-50%] left-[-50%] w-[150vw] h-[150vw] bg-gradient-to-br from-purple-800/80 via-indigo-700/60 to-cyan-700/40 rounded-full blur-3xl" />
            </div>

            <motion.div
                // KROK 4: Zastosowanie warunkowych animacji
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-md p-8 sm:p-12 sm:py-8 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-lg shadow-2xl relative z-10"
            >
                <motion.div variants={itemVariants} className="text-center mb-8">
                    <h1 className="text-5xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">Dołącz do korki24.pl</h1>
                    <p className="font-sans text-purple-200/70">Stwórz konto i odblokuj swój potencjał.</p>
                </motion.div>

                <motion.button
                    variants={itemVariants}
                    onClick={handleGoogleRegister}
                    disabled={isLoading}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex hover:cursor-pointer items-center justify-center gap-3 p-4 mb-6 rounded-xl bg-slate-700/50 border border-white/20 hover:bg-white/10 transition-colors"
                >
                    <FcGoogle className="w-6 h-6" />
                    <span className="font-sans font-semibold text-white">Zarejestruj się z Google</span>
                </motion.button>

                <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6">
                    <hr className="w-full border-slate-700" />
                    <span className="text-slate-500 font-sans text-xs">LUB</span>
                    <hr className="w-full border-slate-700" />
                </motion.div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <motion.div variants={itemVariants} className="relative font-sans flex items-center">
                        <FiUser className="absolute left-4 text-slate-500" />
                        <input type="text" placeholder="Imię" value={name} onChange={(e) => setName(e.target.value)} required className="w-full pl-12 pr-4 py-4 bg-slate-700/50 rounded-xl border border-transparent text-white outline-none focus:border-purple-400 transition-all" />
                    </motion.div>
                    <motion.div variants={itemVariants} className="relative font-sans flex items-center">
                        <FiMail className="absolute left-4 text-slate-500" />
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-12 pr-4 py-4 bg-slate-700/50 rounded-xl border border-transparent text-white outline-none focus:border-purple-400 transition-all" />
                    </motion.div>
                    <motion.div variants={itemVariants} className="relative font-sans flex items-center">
                        <FiLock className="absolute left-4 text-slate-500" />
                        <input type="password" placeholder="Hasło" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-12 pr-4 py-4 bg-slate-700/50 rounded-xl border border-transparent text-white outline-none focus:border-purple-400 transition-all" />
                    </motion.div>
                    <motion.div variants={itemVariants} className="relative font-sans flex items-center">
                        <FiLock className="absolute left-4 text-slate-500" />
                        <input type="password" placeholder="Potwierdź hasło" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full pl-12 pr-4 py-4 bg-slate-700/50 rounded-xl border border-transparent text-white outline-none focus:border-purple-400 transition-all" />
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex items-center gap-3 font-sans text-sm">
                        <input type="checkbox" id="terms" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="h-4 w-4 accent-purple-500"/>
                        <label htmlFor="terms" className="text-slate-400">
                            Akceptuję <Link href="/regulamin" className="text-purple-300 hover:underline">regulamin</Link> serwisu.
                        </label>
                    </motion.div>
                    
                    {error && (
                        <motion.p initial={{opacity:0}} animate={{opacity:1}} className="font-sans text-red-400 text-center">{error}</motion.p>
                    )}

                    <motion.button
                        variants={itemVariants}
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ scale: 1.02, boxShadow: "0px 8px 25px -8px rgba(192, 132, 252, 0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center hover:cursor-pointer justify-center gap-2 w-full p-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xl shadow-lg hover:shadow-purple-500/40 transition-shadow disabled:opacity-60"
                    >
                        {isLoading ? (
                            <motion.div animate={{rotate: 360}} transition={{duration: 1, repeat: Infinity, ease: 'linear'}}><FiLoader /></motion.div>
                        ) : (
                            <span>Stwórz konto</span>
                        )}
                    </motion.button>
                </form>

                <motion.p variants={itemVariants} className="text-center mt-8 font-sans text-sm text-slate-400">
                    Masz już konto?{' '}
                    <Link href="/login" className="font-bold text-purple-300 hover:underline">Zaloguj się</Link>
                </motion.p>
            </motion.div>
        </main>
    );
}