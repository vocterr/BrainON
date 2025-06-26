"use client"; // <--- DODAJ TĘ JEDNĄ LINIJKĘ NA SAMEJ GÓRZE

import * as React from 'react';

interface ResetPasswordEmailProps {
  resetLink: string;
}

export const ResetPasswordEmail: React.FC<Readonly<ResetPasswordEmailProps>> = ({ resetLink }) => (
  <div>
    <h1>Resetowanie hasła dla Twojego konta</h1>
    <p>
      Otrzymaliśmy prośbę o zresetowanie hasła. Kliknij poniższy link, aby ustawić nowe hasło:
    </p>
    <a href={resetLink}>
      Zresetuj hasło
    </a>
    <p>
      Jeśli nie prosiłeś/aś o zresetowanie hasła, zignoruj tę wiadomość.
    </p>
    <p>
      Link jest ważny przez 1 godzinę.
    </p>
  </div>
);