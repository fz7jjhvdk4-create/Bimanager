/**
 * Enkel mejlhjälp via Resend (https://resend.com).
 * Kräver RESEND_API_KEY i miljövariablerna; annars hoppas utskicket över.
 */

interface MejlParams {
  till: string;
  amne: string;
  text: string;
  svarTill?: string;
}

export async function skickaMejl({
  till,
  amne,
  text,
  svarTill,
}: MejlParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "RESEND_API_KEY saknas – mejl skickas inte. Skapa en nyckel på resend.com."
    );
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "BiManager <onboarding@resend.dev>",
      to: [till],
      reply_to: svarTill || undefined,
      subject: amne,
      text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend svarade ${response.status}: ${errorText}`);
  }

  return true;
}
