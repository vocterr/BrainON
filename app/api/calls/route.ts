import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Only admins can create call rooms
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
        }

        const body = await request.json();
        const { studentId } = body;

        if (!studentId) {
            return NextResponse.json({ error: 'Brak ID studenta' }, { status: 400 });
        }

        // Verify student exists
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            select: { id: true, name: true, email: true }
        });

        if (!student) {
            return NextResponse.json({ error: 'Student nie został znaleziony' }, { status: 404 });
        }

        // Create call room
        const callRoom = await prisma.callRoom.create({
            data: {
                adminId: session.user.id,
                studentId: studentId,
                status: 'waiting'
            }
        });

        // Create call record for tracking
        const callRecord = await prisma.callRecord.create({
            data: {
                id: callRoom.id, // Use same ID for easy reference
                adminId: session.user.id,
                studentId: studentId,
                status: 'INITIATED',
            }
        });

        return NextResponse.json({ 
            id: callRoom.id,
            student: student,
            createdAt: callRoom.createdAt
        });

    } catch (error) {
        console.error("Błąd podczas tworzenia pokoju rozmowy:", error);
        return NextResponse.json({ error: 'Wystąpił wewnętrzny błąd serwera' }, { status: 500 });
    }
}

// Update call status
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
        }

        const body = await request.json();
        const { callId, status, connectedAt, endedAt, duration } = body;

        const updateData: any = { status };
        if (connectedAt) updateData.connectedAt = new Date(connectedAt);
        if (endedAt) updateData.endedAt = new Date(endedAt);
        if (duration) updateData.duration = duration;

        const callRecord = await prisma.callRecord.update({
            where: { id: callId },
            data: updateData
        });

        return NextResponse.json(callRecord);

    } catch (error) {
        console.error("Błąd podczas aktualizacji statusu rozmowy:", error);
        return NextResponse.json({ error: 'Wystąpił wewnętrzny błąd serwera' }, { status: 500 });
    }
}

// Get call history
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
        }

        const callHistory = await prisma.callRecord.findMany({
            where: {
                adminId: session.user.id
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                startedAt: 'desc'
            },
            take: 50 // Last 50 calls
        });

        return NextResponse.json(callHistory);

    } catch (error) {
        console.error("Błąd podczas pobierania historii rozmów:", error);
        return NextResponse.json({ error: 'Wystąpił wewnętrzny błąd serwera' }, { status: 500 });
    }
}