import { asc, desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { players } from "../../../db/schema";

type RankingScope = "overall" | "standard" | "battle";

export async function GET(request: Request) {
  try {
    const scope = (new URL(request.url).searchParams.get("scope") ?? "overall") as RankingScope;
    const safeScope: RankingScope = scope === "standard" || scope === "battle" ? scope : "overall";
    const scoreColumn = safeScope === "standard"
      ? players.practiceScore
      : safeScope === "battle" ? players.battleScore : players.totalScore;
    const db = getDb();
    const rows = await db
      .select({
        id: players.displayId,
        score: scoreColumn,
        totalScore: players.totalScore,
        totalSessions: players.totalSessions,
        bestScore: players.bestScore,
        bestCpm: players.bestCpm,
        bestAccuracy: players.bestAccuracy,
      })
      .from(players)
      .orderBy(desc(scoreColumn), desc(players.bestScore), asc(players.createdAt))
      .limit(50);

    return Response.json({
      scope: safeScope,
      entries: rows.map((row, index) => ({ ...row, rank: index + 1 })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "랭킹을 불러오지 못했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
