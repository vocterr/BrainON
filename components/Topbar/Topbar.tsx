"use client";

import { useState, useEffect, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiMenu, FiArrowRight, FiUser } from "react-icons/fi";
import { MenuTopbar } from "./MenuTopbar";
import { useRouter } from "next/navigation";
import LoadingScreen from "../LoadingScreen";
import { UserButton } from "./UserButton";
import { SessionProvider } from "next-auth/react";
// UWAGA: SessionProvider jest teraz w layout.tsx, więc nie jest już tutaj potrzebny.

export default function Topbar() {
    const router = useRouter();
    const [routeLoading, startTransition] = useTransition();
    const [isMenuClicked, setIsMenuClicked] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [scrolled, setScrolled] = useState(false);

    const changeRoute = (route: string) => {
        startTransition(() => {
            router.push(route);
        });
    }

    // Navbar scroll control
    useEffect(() => {
        const controlNavbar = () => {
            const currentScrollY = window.scrollY;
            setIsVisible(currentScrollY <= lastScrollY || currentScrollY < 100);
            setScrolled(currentScrollY > 20);
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', controlNavbar);
        return () => window.removeEventListener('scroll', controlNavbar);
    }, [lastScrollY]);

    // Staggered animation for nav items
    const topbarVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const navItemVariants = {
        hidden: { y: -20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
    };

    return (
        <SessionProvider>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: isVisible ? 0 : -100 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className={`fixed flex items-center justify-center top-0 left-1/2 -translate-x-1/2 w-full h-20 z-50 font-chewy transition-all duration-300 ${scrolled
                        ? 'bg-slate-900/60 backdrop-blur-lg'
                        : 'bg-transparent'
                    }`}
            >
                {/* Subtle bottom border that appears on scroll */}
                <motion.div
                    animate={{ opacity: scrolled ? 1 : 0 }}
                    className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"
                />

                <motion.div
                    variants={topbarVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full h-full max-w-[1400px]  flex items-center justify-between px-4 md:px-6"
                >
                    {/* ===== LEFT SECTION: LOGO ===== */}
                    <motion.div variants={navItemVariants}>
                        <motion.button
                            onClick={() => changeRoute("/")}
                            whileHover="hover"
                            className="flex items-center gap-2 text-3xl text-white drop-shadow-lg cursor-pointer"
                        >
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600">
                                Brain:<b className="bg-gradient-to-r from-amber-600 to-lime-600 bg-clip-text text-transparent ">ON</b>
                            </span>
                        </motion.button>
                    </motion.div>

                    {/* ===== CENTER SECTION: DESKTOP NAV ===== */}
                    <NavLinks changeRoute={changeRoute} />

                    {/* ===== RIGHT SECTION: ACTIONS ===== */}
                    <motion.div variants={navItemVariants} className="flex items-center gap-6">
                        <motion.button
                            onClick={() => changeRoute("zacznij-teraz")}
                            whileHover={{ scale: 1.05, boxShadow: "0px 5px 20px -5px rgba(251, 191, 36, 0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            className="hidden md:flex hover:cursor-pointer items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 text-white shadow-lg text-base"
                        >
                            Zacznij Teraz
                            <FiArrowRight />
                        </motion.button>
                        <UserButton changeRoute={changeRoute}/>
                        

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsMenuClicked(true)}
                                className="p-3 rounded-full bg-white/5 border border-white/20 backdrop-blur-sm"
                            >
                                <FiMenu className="text-white h-6 w-6" />
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <MenuTopbar isMenuClicked={isMenuClicked} setIsMenuClicked={setIsMenuClicked} />
            {routeLoading && (
                <LoadingScreen />
            )}
        </SessionProvider>
    );
}

// Sub-component for the navigation links to keep the main component clean
const NavLinks = ({ changeRoute }: { changeRoute: (route: string) => void }) => {
    const [hoveredLink, setHoveredLink] = useState<string | null>(null);
    const links = ["Matematyka", "INF.02", "O mnie", "Kontakt"];

    const navItemVariants = {
        hidden: { y: -20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
    };

    return (
        <motion.div
            variants={navItemVariants}
            className="hidden md:flex  items-center justify-center gap-2 lg:gap-6 2xl:gap-12 relative bg-white/5 p-2 rounded-full border lg:w-1/2 xl:w-[60%]  border-white/10"
        >
            {links.map((link) => (
                <button
                    key={link}
                    onClick={() => changeRoute(link == "O mnie" ? "o-mnie" : link.trim().toLowerCase())}
                    onMouseEnter={() => setHoveredLink(link)}
                    onMouseLeave={() => setHoveredLink(null)}
                    className="relative hover:cursor-pointer px-4 py-2 text-sm 2xl:tracking-widest text-purple-200/80 hover:text-white transition-colors duration-300"
                >
                    {link}
                    {hoveredLink === link && (
                        <motion.div
                            layoutId="nav-underline"
                            className="absolute inset-0 bg-white/10 rounded-full"
                        />
                    )}
                </button>
            ))}
        </motion.div>
    );
};
