"use client";

import { motion } from 'framer-motion';

// Możesz umieścić ten komponent w osobnym pliku, np. /app/regulamin/page.tsx
export default function RegulaminPage() {
    
    // BARDZO WAŻNE: To jest tylko przykład struktury.
    // Całą treść musisz zastąpić swoim własnym, prawnie wiążącym regulaminem.
    const sections = [
        {
            id: "definicje",
            title: "§ 1. Definicje",
            content: [
                "Ilekroć w niniejszym regulaminie jest mowa o:",
                "1. **Serwisie** – rozumie się przez to platformę internetową Brain:ON dostępną pod adresem www.brain-on.pl.",
                "2. **Użytkowniku** – rozumie się przez to każdą osobę fizyczną, która korzysta z Serwisu.",
                "3. **Kursie** – rozumie się przez to zbiór materiałów edukacyjnych (wideo, tekstów, zadań) udostępnianych w ramach Serwisu.",
                "[UWAGA: Poniższy tekst to wypełniacz. Zastąp go właściwą treścią!]"
            ]
        },
        {
            id: "postanowienia-ogolne",
            title: "§ 2. Postanowienia ogólne",
            content: [
                "Niniejszy regulamin określa zasady korzystania z Serwisu Brain:ON, w tym warunki świadczenia usług drogą elektroniczną, zasady zawierania umów o dostarczenie treści cyfrowych oraz procedurę reklamacyjną.",
                "Każdy Użytkownik zobowiązany jest do zapoznania się z treścią Regulaminu przed rozpoczęciem korzystania z Usług.",
                "[UWAGA: Poniższy tekst to wypełniacz. Zastąp go właściwą treścią!]"
            ]
        },
        {
            id: "uslugi",
            title: "§ 3. Rodzaj i zakres usług",
            content: [
                "Serwis świadczy usługi drogą elektroniczną polegające na udostępnianiu Użytkownikom odpłatnych Kursów online z zakresu matematyki i informatyki.",
                "Dostęp do Kursów jest możliwy po założeniu konta oraz dokonaniu odpowiedniej opłaty, zgodnie z cennikiem dostępnym w Serwisie.",
                "[UWAGA: Poniższy tekst to wypełniacz. Zastąp go właściwą treścią!]"
            ]
        },
        {
            id: "platnosci",
            title: "§ 4. Płatności",
            content: [
                "Wszystkie ceny podane w Serwisie są cenami brutto, wyrażonymi w złotych polskich (PLN).",
                "Operatorem płatności jest [Nazwa Operatora Płatności], zapewniający bezpieczne transakcje online.",
                "[UWAGA: Poniższy tekst to wypełniacz. Zastąp go właściwą treścią!]"
            ]
        },
        {
            id: "reklamacje",
            title: "§ 5. Reklamacje i odstąpienie od umowy",
            content: [
                "Użytkownik ma prawo do złożenia reklamacji dotyczącej działania Serwisu oraz jakości udostępnianych Kursów.",
                "Szczegółowe informacje dotyczące procedury reklamacyjnej oraz warunków odstąpienia od umowy znajdują się w Załączniku nr 1 do niniejszego regulaminu.",
                "[UWAGA: Poniższy tekst to wypełniacz. Zastąp go właściwą treścią!]"
            ]
        },
        // Dodaj więcej sekcji w miarę potrzeb
    ];

    return (
        <div className="w-full bg-slate-900 text-white">
            {/* Tło strony */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-20">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-[100vw] h-[100vw] bg-gradient-to-br from-purple-900/80 to-transparent rounded-full blur-3xl" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 90, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 right-0 w-[100vw] h-[100vw] bg-gradient-to-tl from-cyan-900/60 to-transparent rounded-full blur-3xl" />
            </div>

            <main className="max-w-7xl mx-auto px-4 pt-32 pb-20">
                {/* Nagłówek */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl sm:text-6xl font-chewy bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                        Regulamin Serwisu Brain:ON
                    </h1>
                    <p className="mt-4 text-purple-200/70 font-sans">Ostatnia aktualizacja: 19 czerwca 2025 r.</p>
                </motion.div>

                {/* Główny layout */}
                <div className="grid lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Lewa kolumna: Nawigacja */}
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

                    {/* Prawa kolumna: Treść regulaminu */}
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
                                    <p className="text-sm text-yellow-500/70 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20 mt-4">
                                        <strong>Uwaga:</strong> Powyższy tekst jest jedynie przykładem demonstracyjnym. Należy go zastąpić oficjalną i prawnie wiążącą treścią regulaminu Twojego serwisu.
                                    </p>
                                </div>
                            </article>
                        ))}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}