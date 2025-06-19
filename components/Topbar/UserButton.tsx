"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { FiLoader } from 'react-icons/fi'; // Usunięto nieużywane ikony
import { useSession, signOut } from "next-auth/react";
import Image from 'next/image';

export const UserButton = ({ changeRoute }: { changeRoute: (route: string) => void }) => {
    const { data: session, status } = useSession();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Efekt do zamykania menu po kliknięciu poza nim
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Loader, gdy sesja jest w trakcie weryfikacji
    if (status === "loading") {
        return (
            <div className="hidden md:flex p-3 rounded-full bg-slate-700/50">
                <FiLoader className="h-6 w-6 text-slate-400 animate-spin" />
            </div>
        );
    }

    const isLoggedIn = status === "authenticated";

    // Przycisk dla użytkownika niezalogowanego
    if (!isLoggedIn) {
        return (
            <motion.button
                onClick={() => changeRoute('/login')}
                whileHover={{ scale: 1.05, boxShadow: "0px 5px 20px -5px rgba(251, 191, 36, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                // POPRAWKA: Usunięto ikonę i klasę 'gap-2'
                className="hidden cursor-pointer sm:flex items-center justify-center px-5 py-2.5 rounded-full bg-slate-700/50 border border-slate-600 hover:bg-slate-700 transition-colors"
            >
                <span className="font-sans text-sm text-white">Zaloguj się</span>
            </motion.button>
        );
    }

    // Komponent dla zalogowanego użytkownika z rozwijanym menu
    return (
        <div className="relative" ref={dropdownRef}>
            <motion.button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                whileTap={{ scale: 0.95 }}
                className="relative hidden sm:block"
            >
                <div className="w-12 cursor-pointer h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 p-0.5 shadow-lg">

                    <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-xl text-white">
                        {session.user?.name?.charAt(0).toUpperCase()}
                    </div>

                </div>
                {/* Zielona kropka statusu */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
            </motion.button>

            <AnimatePresence>
                {isDropdownOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 10, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full right-0 mt-2 w-64 origin-top-right z-50"
                    >
                        <div className="p-2 rounded-2xl bg-slate-800/80 border border-purple-500/30 backdrop-blur-lg shadow-2xl">
                            <div className="px-4 py-3 border-b border-slate-700">
                                <p className="font-sans text-sm text-slate-400">Zalogowano jako</p>
                                <p className="font-sans font-semibold text-white truncate">{session.user?.name || session.user?.email}</p>
                            </div>
                            <div className="py-2">
                                {/* POPRAWKA: Usunięto prop 'icon' */}
                                <MenuItem text="Moje terminy" onClick={() => { changeRoute('/moje-terminy'); setIsDropdownOpen(false); }} />
                            </div>
                            <div className="pt-2 border-t border-slate-700">
                                {/* POPRAWKA: Usunięto prop 'icon' */}
                                <MenuItem text="Wyloguj się" onClick={() => signOut()} isDestructive />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// POPRAWKA: Uproszczono sub-komponent MenuItem, usuwając z niego ikonę
const MenuItem = ({ text, onClick, isDestructive = false }: {
    text: string;
    onClick: () => void;
    isDestructive?: boolean;
}) => (
    <button
        onClick={onClick}
        className={`w-full cursor-pointer px-4 py-2.5 text-left text-sm rounded-lg transition-colors font-sans
            ${isDestructive
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-slate-300 hover:bg-purple-500/10 hover:text-white'
            }`}
    >
        {text}
    </button>
);
