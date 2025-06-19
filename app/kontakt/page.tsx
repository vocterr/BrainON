"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { FiMail, FiInstagram, FiYoutube, FiSend, FiLoader, FiCheckCircle } from 'react-icons/fi';

// Możesz umieścić ten komponent w osobnym pliku, np. /app/kontakt/page.tsx
export default function ContactPage() {
  // Stan do przechowywania danych z formularza
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  // Stan do zarządzania procesem wysyłania
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Funkcja do obsługi zmian w polach formularza
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Funkcja do obsługi wysyłki formularza
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Tutaj w przyszłości umieścisz logikę wysyłania maila (np. przez API)
    console.log("Wysyłanie danych:", formData);
    
    // Symulacja opóźnienia sieciowego
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Resetowanie formularza po udanej wysyłce
    setTimeout(() => {
        setIsSubmitted(false);
        setFormData({ name: '', email: '', subject: '', message: '' });
    }, 4000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, duration: 0.5 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const socialLinks = [
    { icon: <FiInstagram />, href: "#" },
    { icon: <FiYoutube />, href: "#" },
    // Dodaj więcej linków, np. Facebook, TikTok
  ];

  return (
    <div className="w-full bg-slate-900 text-white font-chewy">
      <main className="relative w-full min-h-screen flex items-center justify-center overflow-hidden px-4 py-24 sm:py-32">
        {/* Tło strony */}
        <div className="absolute inset-0 z-0 opacity-50">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute top-[-30%] left-[-30%] w-[80vw] h-[80vw] bg-purple-600/30 rounded-full blur-3xl" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-30%] right-[-30%] w-[70vw] h-[70vw] bg-orange-500/20 rounded-full blur-3xl" />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl w-full mx-auto relative z-10"
        >
          {/* Nagłówek sekcji */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white drop-shadow-2xl">
              Nawiążmy <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">Kontakt</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-purple-200/80 font-sans font-medium">
              Masz pytania dotyczące kursów, sugestie, a może chcesz nawiązać współpracę? Wypełnij formularz lub napisz do nas bezpośrednio.
            </p>
          </motion.div>

          {/* Główny kontener z dwiema kolumnami */}
          <div className="grid md:grid-cols-2 gap-16 items-start">
            
            {/* Lewa kolumna: Informacje */}
            <motion.div variants={itemVariants} className="flex flex-col gap-8">
              <div className="p-8 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-4">
                  <FiMail className="w-8 h-8 text-purple-400" />
                  <h2 className="text-3xl">Napisz do nas</h2>
                </div>
                <p className="font-sans text-purple-200/70 mb-4">Preferujemy kontakt mailowy. Odpowiadamy na wszystkie wiadomości w ciągu 24 godzin.</p>
                <a href="mailto:kontakt@brainon.pl" className="font-sans text-lg text-yellow-400 hover:text-yellow-300 transition-colors">
                  kontakt@brainon.pl
                </a>
              </div>

              <div className="p-8 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-sm">
                <h2 className="text-3xl mb-4">Znajdź nas w sieci</h2>
                <p className="font-sans text-purple-200/70 mb-6">Śledź nas na mediach społecznościowych, aby być na bieżąco z nowościami i darmowymi materiałami.</p>
                <div className="flex items-center gap-4">
                  {socialLinks.map((social, index) => (
                    <motion.a 
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="p-3 bg-slate-700/50 rounded-full text-purple-300 hover:text-white transition-colors"
                    >
                      {social.icon}
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Prawa kolumna: Formularz */}
            <motion.div variants={itemVariants} className="p-8 rounded-3xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-sm relative">
              <AnimatePresence>
                {isSubmitted ? (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/80 backdrop-blur-md rounded-3xl text-center p-8">
                        <motion.div initial={{scale: 0}} animate={{scale: 1, rotate: 360}} transition={{type: 'spring', stiffness: 200, damping: 15}}>
                           <FiCheckCircle className="w-16 h-16 text-green-400 mb-4" />
                        </motion.div>
                        <h2 className="text-3xl mb-2">Dzięki!</h2>
                        <p className="font-sans text-purple-200/80">Twoja wiadomość została wysłana. Odpowiemy najszybciej, jak to możliwe!</p>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        {/* Imię */}
                        <div className="relative font-sans">
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="peer w-full p-4 bg-slate-700/50 rounded-xl border border-purple-500/40 text-white outline-none focus:border-purple-400 transition-all" />
                            <label htmlFor="name" className={`absolute left-4 transition-all text-purple-300/80 pointer-events-none ${formData.name ? 'top-[-10px] text-xs bg-slate-800 px-1' : 'top-4 text-base'}`}>Imię</label>
                        </div>
                        {/* Email */}
                        <div className="relative font-sans">
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="peer w-full p-4 bg-slate-700/50 rounded-xl border border-purple-500/40 text-white outline-none focus:border-purple-400 transition-all" />
                            <label htmlFor="email" className={`absolute left-4 transition-all text-purple-300/80 pointer-events-none ${formData.email ? 'top-[-10px] text-xs bg-slate-800 px-1' : 'top-4 text-base'}`}>Email</label>
                        </div>
                        {/* Temat */}
                        <div className="relative font-sans">
                            <select id="subject" name="subject" value={formData.subject} onChange={handleChange} required className="w-full p-4 bg-slate-700/50 rounded-xl border border-purple-500/40 text-white outline-none focus:border-purple-400 transition-all appearance-none">
                                <option value="" disabled>Wybierz temat...</option>
                                <option value="kursy">Pytanie o kursy</option>
                                <option value="wspolpraca">Współpraca</option>
                                <option value="techniczny">Problem techniczny</option>
                                <option value="inne">Inne</option>
                            </select>
                        </div>
                        {/* Wiadomość */}
                        <div className="relative font-sans">
                            <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows={5} className="peer w-full p-4 bg-slate-700/50 rounded-xl border border-purple-500/40 text-white outline-none focus:border-purple-400 transition-all resize-none" />
                            <label htmlFor="message" className={`absolute left-4 transition-all text-purple-300/80 pointer-events-none ${formData.message ? 'top-[-10px] text-xs bg-slate-800 px-1' : 'top-4 text-base'}`}>Twoja wiadomość</label>
                        </div>
                        {/* Przycisk */}
                        <motion.button 
                            type="submit"
                            disabled={isSubmitting}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center justify-center gap-2 w-full p-4 rounded-xl bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 text-white text-xl shadow-lg hover:shadow-orange-500/40 transition-shadow disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <motion.div animate={{rotate: 360}} transition={{duration: 1, repeat: Infinity, ease: 'linear'}}><FiLoader /></motion.div>
                                    <span>Wysyłanie...</span>
                                </>
                            ) : (
                                <>
                                    <span>Wyślij Wiadomość</span>
                                    <FiSend />
                                </>
                            )}
                        </motion.button>
                    </form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}