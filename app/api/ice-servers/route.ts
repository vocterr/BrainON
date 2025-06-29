// UPEWNIJ SIĘ, ŻE TO JEST DOKŁADNA ZAWARTOŚĆ TWOJEGO PLIKU:
// app/api/ice-servers/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
    const username = process.env.METERED_TURN_USERNAME;
    const credential = process.env.METERED_TURN_CREDENTIAL;

    if (!username || !credential) {
        console.error("KRYTYCZNY BŁĄD: Zmienne METERED_TURN_USERNAME lub METERED_TURN_CREDENTIAL nie są ustawione na Vercel!");
        return NextResponse.json({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
            ],
        });
    }

    const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
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

    return NextResponse.json({ iceServers });
}