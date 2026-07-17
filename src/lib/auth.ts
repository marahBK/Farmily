/**
 * Browser-only auth utilities.
 * SHA-256 via Web Crypto — passwords and PINs are never stored as plain text.
 */

export async function hashText(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text.trim());
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Random 4-digit PIN string, e.g. "3871" */
export function generatePIN(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const AVATARS = ["🦊", "🐰", "🐻", "🐼", "🦁", "🐸", "🐨", "🐯", "🦄", "🐺"];
export function pickAvatar(index: number): string {
  return AVATARS[index % AVATARS.length];
}
