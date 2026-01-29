import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Hämtar den inloggade användarens ID från sessionen.
 * Returnerar null om användaren inte är inloggad.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Kräver att användaren är inloggad och returnerar användar-ID.
 * Kastar fel om användaren inte är inloggad.
 */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

/**
 * Skapar ett 401 Unauthorized-svar.
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Du måste vara inloggad" },
    { status: 401 }
  );
}
