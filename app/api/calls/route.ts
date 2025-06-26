// FILE: app/api/calls/route.ts

import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Make sure this path is correct

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
        }

        const body = await request.json();
        const { studentId } = body;

        if (!studentId) {
            return NextResponse.json({ error: 'Brak ID studenta' }, { status: 400 });
        }
        
        // Create the call room, which generates a unique ID (this will be our roomId)
        const callRoom = await prisma.callRoom.create({
            data: {
                adminId: session.user.id,
                studentId: studentId,
                status: 'waiting'
            }
        });

        // Also create a persistent record for history
        await prisma.callRecord.create({
            data: {
                id: callRoom.id, // Use the same ID for easy reference
                adminId: session.user.id,
                studentId: studentId,
                status: 'INITIATED',
            }
        });

        return NextResponse.json({ 
            id: callRoom.id,
            studentId: studentId,
            createdAt: callRoom.createdAt
        });

    } catch (error) {
        console.error("Błąd podczas tworzenia pokoju rozmowy:", error);
        return NextResponse.json({ error: 'Wystąpił wewnętrzny błąd serwera' }, { status: 500 });
    }
}