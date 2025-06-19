// app/api/calls/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/prisma/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../login/route';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    // Zabezpieczenie: tylko admin może tworzyć rozmowy
    // Dodano sprawdzenie, czy istnieje session.user i session.user.id
    if (!session?.user?.id || session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
    }

    const { studentId } = await request.json();

    if (!studentId) {
        return NextResponse.json({ error: 'Brakuje ID ucznia' }, { status: 400 });
    }

    // Tworzymy pokój do rozmowy w bazie
    const newRoom = await prisma.callRoom.create({
        data: {
            adminId: session.user.id, // Teraz TypeScript wie, że to pole istnieje
            studentId: studentId,
        }
    });

    return NextResponse.json(newRoom);
}
