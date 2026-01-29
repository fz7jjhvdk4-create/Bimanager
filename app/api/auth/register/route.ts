import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-post och lösenord krävs" },
        { status: 400 }
      );
    }

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

    // Skapa användaren
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
      },
    });

    // Skapa standard-inställningar för användaren
    await prisma.settings.create({
      data: {
        userId: user.id,
      },
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
