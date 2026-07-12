import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

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

type AuthedHandler = (
  request: NextRequest,
  ctx: { userId: string; params: Record<string, string> }
) => Promise<Response>;

/**
 * Wrapper för API-routes: kräver inloggning, väntar in route-params
 * och hanterar fel enhetligt — zod-valideringsfel och trasig JSON blir 400,
 * övriga fel loggas och blir 500 med det angivna meddelandet.
 */
export function withAuth(errorMessage: string, handler: AuthedHandler) {
  return async (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<Response> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return unauthorizedResponse();

      const params = context ? await context.params : {};
      return await handler(request, { userId, params });
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: error.issues[0]?.message ?? "Ogiltiga uppgifter" },
          { status: 400 }
        );
      }
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: "Ogiltig JSON i förfrågan" },
          { status: 400 }
        );
      }
      console.error(errorMessage, error);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  };
}
