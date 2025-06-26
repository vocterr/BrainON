import { NextResponse } from 'next/server';
import prisma from '@/prisma/prisma';
import { Resend } from 'resend';
import { randomUUID } from 'crypto';

// Nie importujemy już szablonu React ani biblioteki do renderowania

const resend = new Resend(process.env.RESEND_API_KEY);
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            return NextResponse.json({ message: 'If an account with this email exists, a password reset link has been sent.' }, { status: 200 });
        }

        const token = randomUUID();
        const expires = new Date(new Date().getTime() + 3600 * 1000); // Token ważny 1 godzinę

        // Zapisujemy token w bazie danych tak jak wcześniej
        await prisma.passwordResetToken.create({
            data: {
                email,
                token,
                expires,
            }
        });

        const resetLink = `${baseUrl}/reset-hasla/${token}`;

        // NOWA METODA: Tworzymy HTML jako zwykły string
        const emailHtml = `
            <div>
                <h1>Resetowanie hasła dla Twojego konta na korki24.pl</h1>
                <p>Otrzymaliśmy prośbę o zresetowanie Twojego hasła. Kliknij poniższy link, aby ustawić nowe:</p>
                <a 
                    href="${resetLink}" 
                    style="display: inline-block; padding: 12px 24px; font-size: 16px; color: white; background-color: #7c3aed; text-decoration: none; border-radius: 8px;"
                >
                    Zresetuj hasło
                </a>
                <p>Jeśli nie prosiłeś/aś o zresetowanie hasła, możesz bezpiecznie zignorować tę wiadomość.</p>
                <p>Link jest ważny przez 1 godzinę.</p>
            </div>
        `;

        // Używamy właściwości 'html' z naszym stringiem
        await resend.emails.send({
            from: 'korki24.pl <onboarding@resend.dev>',
            to: email,
            subject: 'Resetowanie hasła na korki24.pl',
            html: emailHtml,
        });

        return NextResponse.json({ message: 'If an account with this email exists, a password reset link has been sent.' }, { status: 200 });

    } catch (error) {
        console.error('Password reset request error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}