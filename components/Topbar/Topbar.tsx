"use client";

// OPTYMALIZACJA: Importujemy useEffect do stworzenia hooka
import { useState, useEffect, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiMenu, FiArrowRight, FiUser } from "react-icons/fi";
import { MenuTopbar } from "./MenuTopbar";
import { usePathname, useRouter } from "next/navigation";
import LoadingScreen from "../LoadingScreen";
import { UserButton } from "./UserButton";

// OPTYMALIZACJA: Prosty hook, który sprawdza, czy ekran jest w wersji desktopowej.
// Używamy breakpointu `md` (768px), bo tam zmienia się Twoja nawigacja.
const useIsDesktop = () => {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    return isDesktop;
};


export default function Topbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [routeLoading, startTransition] = useTransition();
    const [isMenuClicked, setIsMenuClicked] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [scrolled, setScrolled] = useState(false);

    // OPTYMALIZACJA: Używamy naszego hooka w komponencie
    const isDesktop = useIsDesktop();

    const changeRoute = (route: string) => {
        startTransition(() => {
            router.push(route);
        });
    }

    // OPTYMALIZACJA: Cała logika chowania/pokazywania paska jest teraz warunkowa
    useEffect(() => {
        const controlNavbar = () => {
            const currentScrollY = window.scrollY;
            // Ta logika działa tylko na desktopie
            if (isDesktop) {
                setIsVisible(currentScrollY <= lastScrollY || currentScrollY < 100);
                setScrolled(currentScrollY > 20);
            }
            setLastScrollY(currentScrollY);
        };
        
        // Na mobile, ustawiamy od razu stan "przewinięty i widoczny"
        if (!isDesktop) {
            setIsVisible(true);
            setScrolled(true);
        }

        window.addEventListener('scroll', controlNavbar);
        return () => window.removeEventListener('scroll', controlNavbar);
    }, [lastScrollY, isDesktop]); // Dodajemy isDesktop do zależności

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
        <>
            {pathname?.startsWith("/student") ? (
                <></>
            ) : (
                <motion.nav
                    initial={{ y: 0 }} // Zaczynamy od widocznego paska
                    // OPTYMALIZACJA: Animacja chowania działa tylko na desktopie
                    animate={{ y: isDesktop && !isVisible ? -100 : 0 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    // OPTYMALIZACJA: Klasa tła jest nadawana na podstawie `scrolled` (desktop) lub na stałe (mobile)
                    className={`fixed flex items-center justify-center top-0 left-0 w-full h-20 z-50 font-chewy transition-all duration-300 ${scrolled || !isDesktop
                        ? 'bg-slate-900/60 backdrop-blur-lg'
                        : 'bg-transparent'
                        }`}
                >
                    {/* OPTYMALIZACJA: Kreska jest widoczna, gdy `scrolled` lub gdy jest to mobile */}
                    <motion.div
                        animate={{ opacity: scrolled || !isDesktop ? 1 : 0 }}
                        className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"
                    />

                    <motion.div
                        variants={topbarVariants}
                        initial="hidden"
                        animate="visible"
                        className="w-full h-full max-w-[1400px] flex items-center justify-between px-4 md:px-6"
                    >
                        {/* ===== LEFT SECTION: LOGO ===== */}
                        <motion.div variants={navItemVariants}>
                            <motion.button
                                onClick={() => changeRoute("/")}
                                whileHover="hover"
                                className="flex items-center gap-2 text-3xl text-white drop-shadow-lg cursor-pointer"
                            >
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600">
                                    korki24.<b className="bg-gradient-to-r from-amber-600 to-lime-600 bg-clip-text text-transparent ">pl</b>
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
                            <UserButton changeRoute={changeRoute} />


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
            )}

            <MenuTopbar isMenuClicked={isMenuClicked} setIsMenuClicked={setIsMenuClicked} />
            {routeLoading && (
                <LoadingScreen />
            )}
        </>
    );
}

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
            className="hidden md:flex items-center justify-center gap-2 lg:gap-6 2xl:gap-12 relative bg-white/5 p-2 rounded-full border lg:w-1/2 xl:w-[60%] border-white/10"
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