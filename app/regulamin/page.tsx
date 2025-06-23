"use client";

import { motion } from 'framer-motion';

export default function RegulaminPage() {
    
    // ===== UPROSZCZONY REGULAMIN (WERSJA "NA START") =====
    // UWAGA: To jest absolutne minimum. Nadal zalecana jest konsultacja z prawnikiem w przyszłości.
    const sections = [
        {
            id: "wstep",
            title: "§ 1. O co tu chodzi? (Wersja dla ludzi)",
            content: [
                "Cześć! Prowadzę tę stronę samodzielnie i oferuję indywidualne korepetycje (zwane dalej 'Lekcjami') z matematyki i informatyki.",
                "Ten dokument to po prostu spis zasad naszej współpracy, żeby wszystko było jasne i przejrzyste zarówno dla Ciebie, jak i dla mnie. Rezerwując lekcję, zgadzasz się na te zasady."
            ]
        },
        {
            id: "rezerwacja",
            title: "§ 2. Jak zarezerwować i zapłacić za lekcję?",
            content: [
                "1. Wybierasz w kalendarzu pasujący Ci termin.",
                "2. W następnym kroku wybierasz przedmiot, formę zajęć (np. online) i podajesz swoje dane.",
                "3. Opłacasz rezerwację z góry przez bezpieczne płatności Stripe. Wszystkie podane ceny są cenami brutto (zawierają już podatki).",
                "4. Po opłaceniu, rezerwacja jest potwierdzona, a umowa między nami zawarta. Dostaniesz ode mnie maila z potwierdzeniem. Gotowe!",
            ]
        },
        {
            id: "odwolanie",
            title: "§ 3. Odwoływanie lekcji (Najważniejszy punkt!)",
            content: [
                "<strong>1. Jeśli Ty chcesz odwołać lekcję:</strong>",
                "Możesz bezpłatnie odwołać lekcję i otrzymać pełen zwrot pieniędzy, jeśli zrobisz to najpóźniej <strong>24 godziny</strong> przed jej zaplanowanym rozpoczęciem. Wystarczy, że do mnie napiszesz. Jeśli odwołasz lekcję później niż 24 godziny przed terminem lub nie pojawisz się na niej, opłata niestety przepada.",
                "<strong>2. Jeśli ja muszę odwołać lekcję:</strong>",
                "Jeśli z jakiegoś ważnego powodu (np. choroba) to ja będę musiał odwołać naszą lekcję, natychmiast Cię o tym poinformuję. W takiej sytuacji otrzymasz oczywiście <strong>100% zwrotu pieniędzy</strong> lub, jeśli wolisz, zaproponuję Ci inny, pasujący termin.",
                 "<strong>3. Spóźnienia:</strong>",
                "Szanujemy swój czas. Jeśli spóźnisz się na lekcję, niestety nie będę mógł jej przedłużyć. Jeśli Twoje spóźnienie przekroczy 20 minut, traktuję to jako nieobecność."
            ]
        },
        {
            id: "prywatnosc",
            title: "§ 4. Prywatność Twoich danych (RODO)",
            content: [
                "Twoje dane są u mnie bezpieczne. Administratorem Twoich danych osobowych (imienia, maila itp.) jestem ja, [Twoje Imię i Nazwisko].",
                "Potrzebuję ich tylko po to, by móc się z Tobą skontaktować i prawidłowo przeprowadzić naszą lekcję. Nie przekazuję ich nikomu innemu (poza operatorem płatności Stripe, który musi przetworzyć Twoją wpłatę).",
                "Masz pełne prawo do dostępu do swoich danych, ich poprawiania lub usunięcia. Wystarczy, że się ze mną skontaktujesz.",
                "<em>(Uwaga: Dobrą praktyką jest posiadanie osobnej strony 'Polityka Prywatności', która szerzej opisuje te kwestie. Na start ten zapis w regulaminie to absolutne minimum).</em>",
            ]
        },
        {
            id: "kontakt",
            title: "§ 5. Kontakt",
            content: [
                "W razie jakichkolwiek pytań lub wątpliwości, pisz śmiało na adres: [Twój Adres E-mail].",
            ]
        },
    ];

    return (
        <div className="w-full bg-slate-900 relative overflow-hidden text-white">
            <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-20">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-[100vw] h-[100vw] bg-gradient-to-br from-purple-900/80 to-transparent rounded-full blur-3xl" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 90, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 right-0 w-[100vw] h-[100vw] bg-gradient-to-tl from-cyan-900/60 to-transparent rounded-full blur-3xl" />
            </div>

            <main className="max-w-7xl relative mx-auto px-4 pt-32 pb-20">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl sm:text-6xl font-chewy bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                        Regulamin Lekcji
                    </h1>
                    <p className="mt-4 text-purple-200/70 font-sans">Ostatnia aktualizacja: 23 czerwca 2024 r.</p>
                </motion.div>

                <div className="grid lg:grid-cols-4 gap-8 lg:gap-12">
                    <aside className="hidden lg:block lg:col-span-1">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="sticky top-24 p-6 rounded-2xl bg-slate-800/50 border border-purple-500/20 backdrop-blur-sm"
                        >
                            <h3 className="font-chewy text-xl mb-4">Spis treści</h3>
                            <ul className="space-y-2 font-sans">
                                {sections.map((section) => (
                                    <li key={section.id}>
                                        <a href={`#${section.id}`} className="text-purple-300/80 hover:text-cyan-300 transition-colors">
                                            {section.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </aside>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="lg:col-span-3 space-y-12 font-sans"
                    >
                        {sections.map((section) => (
                            <article key={section.id} id={section.id} className="scroll-mt-24">
                                <h2 className="text-3xl font-chewy text-cyan-300 border-b border-cyan-500/20 pb-2 mb-4">
                                    {section.title}
                                </h2>
                                <div className="space-y-4 text-lg text-slate-300 leading-relaxed">
                                    {section.content.map((paragraph, index) => (
                                        <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
                                    ))}
                                </div>
                            </article>
                        ))}
                         <div className="text-base text-yellow-500/80 p-6 bg-yellow-500/10 rounded-2xl border-2 border-yellow-500/30 mt-12">
                            <strong className="text-yellow-400 block mb-2 text-lg">WAŻNA INFORMACJA</strong>
                            <p>Starałem się, aby te zasady były jak najbardziej proste i uczciwe. Pamiętaj jednak, że ten dokument to uproszczona forma regulaminu. Działam samodzielnie i na małą skalę, a te zasady mają nam pomóc we wzajemnej, dobrej współpracy.</p>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}