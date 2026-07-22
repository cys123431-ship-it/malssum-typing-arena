import { eq, gt, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { players } from "../../../db/schema";
import {
  authenticatePlayer,
  createPlayerToken,
  hashPlayerToken,
  isValidPlayerId,
  normalizePlayerId,
  unauthorizedPlayerResponse,
} from "../player-auth";

function publicPlayer(player: typeof players.$inferSelect, rank: number) {
  return {
    id: player.displayId,
    totalScore: player.totalScore,
    practiceScore: player.practiceScore,
    battleScore: player.battleScore,
    totalSessions: player.totalSessions,
    bestScore: player.bestScore,
    bestCpm: player.bestCpm,
    bestAccuracy: player.bestAccuracy,
    rank,
  };
}

async function rankFor(totalScore: number) {
  const db = getDb();
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(players)
    .where(gt(players.totalScore, totalScore));
  return Number(result?.count ?? 0) + 1;
}

export async function GET(request: Request) {
  try {
    const player = await authenticatePlayer(request);
    if (!player) return unauthorizedPlayerResponse();
    return Response.json({ player: publicPlayer(player, await rankFor(player.totalScore)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "선수 정보를 불러오지 못했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { id?: string };
    const displayId = (payload.id ?? "").normalize("NFKC").trim();
    const id = normalizePlayerId(displayId);
    if (!isValidPlayerId(id)) {
      return Response.json({ error: "아이디는 한글·영문·숫자·밑줄·하이픈으로 2~12자까지 사용할 수 있습니다." }, { status: 400 });
    }

    const token = createPlayerToken();
    const tokenHash = await hashPlayerToken(token);
    const db = getDb();
    await db.insert(players).values({ id, displayId, tokenHash });
    const [created] = await db.select().from(players).where(eq(players.id, id)).limit(1);
    if (!created) throw new Error("아이디를 만든 뒤 선수 정보를 확인하지 못했습니다.");

    return Response.json({
      token,
      player: publicPlayer(created, await rankFor(created.totalScore)),
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "아이디를 만들지 못했습니다.";
    const duplicate = /unique|constraint|primary/i.test(message);
    return Response.json(
      { error: duplicate ? "이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요." : message },
      { status: duplicate ? 409 : 500 },
    );
  }
}
