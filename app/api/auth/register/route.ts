import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";

const registerSchema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().toLowerCase().email("Ogiltig e-postadress"),
  password: z.string().min(8, "Lösenordet måste vara minst 8 tecken"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message || "Ogiltiga uppgifter";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    // Kontrollera om användaren redan finns
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "En användare med denna e-post finns redan" },
        { status: 400 }
      );
    }

    // Hasha lösenordet
    const hashedPassword = await bcrypt.hash(password, 12);

    // Skapa användare och standardinställningar i samma transaktion
    // så att användaren aldrig blir halvskapad.
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          hashedPassword,
        },
      });

      await tx.settings.create({
        data: {
          userId: createdUser.id,
        },
      });

      return createdUser;
    });

    return NextResponse.json(
      { message: "Kontot skapades!", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registreringsfel:", error);
    return NextResponse.json(
      { error: "Något gick fel vid registrering" },
      { status: 500 }
    );
  }
}
