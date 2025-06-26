"use client";

import { useState, useEffect } from 'react';

// Ten hook zwraca 'true', jeśli szerokość ekranu jest mniejsza niż zdefiniowany breakpoint (domyślnie 768px)
export const useIsMobile = (breakpoint = 768) => {
    // Używamy stanu, aby móc go bezpiecznie używać w renderowaniu
    // Sprawdzamy `window` tylko po stronie klienta, aby uniknąć błędów na serwerze
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);

    useEffect(() => {
        // Ta funkcja będzie uruchamiana za każdym razem, gdy zmieni się rozmiar okna
        const checkDevice = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        // Dodajemy nasłuchiwanie na zmianę rozmiaru
        window.addEventListener('resize', checkDevice);

        // Funkcja czyszcząca, która usuwa nasłuchiwanie, gdy komponent zniknie
        return () => {
            window.removeEventListener('resize', checkDevice);
        };
    }, [breakpoint]);

    return isMobile;
};