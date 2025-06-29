// FILE: app/api/ice-servers/route.ts
// NOWA, UPROSZCZONA WERSJA

import { NextResponse } from 'next/server';

export async function GET() {
    // Odczytujemy nowe zmienne środowiskowe z Vercel
    const username = process.env.METERED_TURN_USERNAME;
    const credential = process.env.METERED_TURN_CREDENTIAL;

    // Sprawdzamy, czy zmienne istnieją. Jeśli nie, zwracamy tylko STUN.
    if (!username || !credential) {
        console.error("METERED_TURN_USERNAME or METERED_TURN_CREDENTIAL not set!");
        return NextResponse.json({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ],
        });
    }

    // Budujemy kompletną listę serwerów ICE
    // Zawiera ona publiczne serwery STUN (jako pierwszy wybór)
    // oraz serwery TURN od Metered (jako niezawodny fallback)
    const iceServers = [
        
        // Serwery TURN od Metered z Twoimi danymi
        // Adresy są standardowe dla regionu Global
        {
            urls: "turn:turn.metered.ca:80",
            username,
            credential,
        },
        {
            urls: "turn:turn.metered.ca:443",
            username,
            credential,
        },
        {
            urls: "turn:turn.metered.ca:443?transport=tcp",
            username,
            credential,
        }
    ];

    // Zwracamy kompletną konfigurację do frontendu
    return NextResponse.json({ iceServers });
}