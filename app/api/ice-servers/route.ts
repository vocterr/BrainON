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
        { urls: "stun:openrelay.metered.ca:80" },

        // Publiczne serwery TURN z Open Relay Project
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject",
        }
    ]

    return NextResponse.json({ iceServers });
}