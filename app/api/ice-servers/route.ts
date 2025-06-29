// FILE: app/api/ice-servers/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const METERED_API_KEY = process.env.METERED_API_KEY;
    
    if (!METERED_API_KEY) {
        console.error('METERED_API_KEY not found in environment variables');
        // Return only STUN servers if no API key
        return NextResponse.json({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ]
        });
    }

    try {
        // Fetch credentials from Metered API
        const response = await fetch(
            `https://korki360.metered.live/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`
        );
        
        if (response.ok) {
            const meteredServers = await response.json();
            
            // Combine Google STUN servers with Metered TURN servers
            return NextResponse.json({ 
                iceServers: [
                    // Always include Google STUN servers
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    // Add Metered servers
                    ...meteredServers
                ]
            });
        } else {
            console.error('Failed to fetch Metered credentials:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching Metered credentials:', error);
    }

    // Fallback to just STUN servers
    return NextResponse.json({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ]
    });
}