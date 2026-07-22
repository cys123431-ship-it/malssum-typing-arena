import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { players } from "../../db/schema";

export type AuthenticatedPlayer = typeof players.$inferSelect;

export function normalizePlayerId(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("ko-KR");
}

export function isValidPlayerId(value: string) {
  return /^[a-z0-9가-힣_-]{2,12}$/u.test(value);
}

export async function hashPlayerToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createPlayerToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function authenticatePlayer(request: Request): Promise<AuthenticatedPlayer | null> {
  const id = normalizePlayerId(request.headers.get("x-player-id") ?? "");
  const token = request.headers.get("x-player-token") ?? "";
  if (!id || !token) return null;

  const db = getDb();
  const [player] = await db.select().from(players).where(eq(players.id, id)).limit(1);
  if (!player) return null;

  const suppliedHash = await hashPlayerToken(token);
  return suppliedHash === player.tokenHash ? player : null;
}

export function unauthorizedPlayerResponse() {
  return Response.json({ error: "기록 모드를 사용하려면 선수 아이디를 만들어 주세요." }, { status: 401 });
}
