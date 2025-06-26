"use client";

import { motion } from 'framer-motion';
import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from "next-auth/react";
import { FiMail, FiLock, FiLoader } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import Link from 'next/link';
import { useIsMobile } from '@/lib/useIsMobile'; // Załóżmy, że hook jest w tej lokalizacji

const LoginForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const callbackError = searchParams.get('error');
        if (callbackError) {
            setError('Logowanie nie powiodło się. Spróbuj ponownie.');
        }
    }, [searchParams]);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError("Nieprawidłowy email lub hasło.");
            } else if (result?.ok) {
                router.push('/');
            }
        } catch (err) {
            console.error("Błąd logowania:", err);
            setError("Wystąpił nieoczekiwany błąd.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGoogleLogin = () => {
        setIsLoading(true);
        signIn('google', { callbackUrl: '/' });
    };

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: { staggerChildren: isMobile ? 0 : 0.1, duration: 0.4 } 
        },
    };

    const itemVariants = {
        hidden: isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    };

    return (
        <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            className="w-full max-w-md p-8 sm:p-12 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-lg shadow-2xl relative top-20 md:top-0 z-10"
        >
            <motion.div variants={itemVariants} className="text-center mb-8">
                <h1 className="text-5xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 mb-2">Witaj z powrotem!</h1>
                <p className="font-sans text-purple-200/70">Włącz swój umysł i kontynuuj naukę.</p>
            </motion.div>
            <motion.button variants={itemVariants} onClick={handleGoogleLogin} disabled={isLoading} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="w-full flex cursor-pointer items-center justify-center gap-3 p-4 mb-6 rounded-xl bg-slate-700/50 border border-white/20 hover:bg-white/10 transition-colors">
                <FcGoogle className="w-6 h-6" />
                <span className="font-sans font-semibold text-white">Zaloguj się z Google</span>
            </motion.button>
            <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6">
                <hr className="w-full border-slate-700" />
                <span className="text-slate-500 font-sans text-xs">LUB</span>
                <hr className="w-full border-slate-700" />
            </motion.div>
            <form onSubmit={handleLogin} className="flex flex-col gap-6">
                <motion.div variants={itemVariants} className="relative font-sans flex items-center">
                    <FiMail className="absolute left-4 text-slate-500" />
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-12 pr-4 py-4 bg-slate-700/50 rounded-xl border border-transparent text-white outline-none focus:border-purple-400 transition-all" />
                </motion.div>
                <motion.div variants={itemVariants} className="relative font-sans flex items-center">
                    <FiLock className="absolute left-4 text-slate-500" />
                    <input type="password" placeholder="Hasło" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-12 pr-4 py-4 bg-slate-700/50 rounded-xl border border-transparent text-white outline-none focus:border-purple-400 transition-all" />
                </motion.div>
                <motion.div variants={itemVariants} className="text-right">
                    <Link href="/zapomnialem-hasla" className="font-sans text-sm text-purple-300 hover:underline">Nie pamiętasz hasła?</Link>
                </motion.div>
                {error && (
                    <motion.p initial={{opacity:0}} animate={{opacity:1}} className="font-sans text-red-400 text-center">{error}</motion.p>
                )}
                <motion.button variants={itemVariants} type="submit" disabled={isLoading} whileHover={{ scale: 1.02, boxShadow: "0px 8px 25px -8px rgba(251, 191, 36, 0.6)" }} whileTap={{ scale: 0.98 }} className="flex items-center cursor-pointer justify-center gap-2 w-full p-4 rounded-xl bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 text-white text-xl shadow-lg hover:shadow-orange-500/40 transition-shadow disabled:opacity-60">
                    {isLoading ? (
                        <motion.div animate={{rotate: 360}} transition={{duration: 1, repeat: Infinity, ease: 'linear'}}><FiLoader /></motion.div>
                    ) : (
                        <span>Zaloguj się</span>
                    )}
                </motion.button>
            </form>

            {/* ===== DODANY LINK DO REJESTRACJI ===== */}
            <motion.p variants={itemVariants} className="text-center mt-8 font-sans text-sm text-slate-400">
                Nie masz jeszcze konta?{' '}
                <Link href="/rejestracja" className="font-bold text-purple-300 hover:underline">
                    Zarejestruj się
                </Link>
            </motion.p>
        </motion.div>
    );
}

export default function LoginPage() {
    return (
        <main className="w-full min-h-screen flex items-center justify-center bg-slate-900 text-white font-chewy p-4 relative">
            <div className="absolute inset-0 z-0 opacity-40 hidden md:block">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} className="absolute top-[-50%] left-[-50%] w-[150vw] h-[150vw] bg-gradient-to-br from-purple-800/80 via-indigo-700/60 to-pink-700/40 rounded-full blur-3xl" />
            </div>
            <Suspense fallback={<div className="w-12 h-12"><FiLoader className="w-full h-full animate-spin"/></div>}>
                <LoginForm />
            </Suspense>
        </main>
    );
}