import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET appointments for admin panel
export async function GET(request: Request) {
    try {
        // 1. Check session and verify admin role
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
        }

        // 2. Fetch appointments with proper filtering
        const appointments = await prisma.appointment.findMany({
            where: {
                OR: [
                    // Include upcoming appointments
                    {
                        status: 'UPCOMING',
                        date: {
                            gte: new Date(), // Future appointments
                        },
                    },
                    // Include recently completed appointments (last 30 days)
                    {
                        status: 'COMPLETED',
                        date: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                ],
            },
            orderBy: {
                date: 'asc', // Closest appointments first
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // 3. Return appointments
        return NextResponse.json(appointments);

    } catch (error) {
        console.error("Błąd podczas pobierania terminów dla admina:", error);
        return NextResponse.json({ error: 'Wystąpił wewnętrzny błąd serwera' }, { status: 500 });
    }
}