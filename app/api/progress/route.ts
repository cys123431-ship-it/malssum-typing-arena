import { eq, gt, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { players, rankedSessions } from "../../../db/schema";
import { authenticatePlayer, unauthorizedPlayerResponse } from "../player-auth";

type PracticeMode = "standard" | "battle";

type StoredProgress = {
  completedIds: string[];
  currentIndex: number;
  dailyGoal: number;
  totalSessions: number;
  totalTypedChars: number;
  correctChars: number;
  bestCpm: number;
  bestAccuracy: number;
  days: Array<{ date: string; versesCompleted: number; sessions: number }>;
  recent: Array<{
    verseId: string;
    bookCode: string;
    cpm: number;
    accuracy: number;
    durationSeconds: number;
    completedAt: string;
    mode?: PracticeMode;
    score?: number;
  }>;
};

const EMPTY_PROGRESS: StoredProgress = {
  completedIds: [],
  currentIndex: 0,
  dailyGoal: 10,
  totalSessions: 0,
  totalTypedChars: 0,
  correctChars: 0,
  bestCpm: 0,
  bestAccuracy: 0,
  days: [],
  recent: [],
};

function parseProgress(value: string): StoredProgress {
  try {
    const parsed = JSON.parse(value) as Partial<StoredProgress>;
    return {
      ...EMPTY_PROGRESS,
      ...parsed,
      completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds : [],
      days: Array.isArray(parsed.days) ? parsed.days : [],
      recent: Array.isArray(parsed.recent) ? parsed.recent : [],
    };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

function calculateSessionScore(input: {
  mode: PracticeMode;
  cpm: number;
  accuracy: number;
  typedChars: number;
  correctChars: number;
  combo: number;
  stageId: number | null;
}) {
  const accuracyFactor = Math.pow(input.accuracy / 100, 2);
  const speedPoints = Math.min(3000, input.cpm) * 4;
  const lengthPoints = input.correctChars * 12;
  const comboPoints = Math.min(1000, input.combo) * 3;
  const battleBonus = input.mode === "battle" ? 500 + ((input.stageId ?? 1) * 80) : 0;
  const mistakePenalty = Math.max(0, input.typedChars - input.correctChars) * 25;
  return Math.max(0, Math.round(((speedPoints + lengthPoints + comboPoints + battleBonus) * accuracyFactor) - mistakePenalty));
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "기록을 저장하지 못했습니다.";
  const unavailable = message.includes("no such table") || message.includes("binding `DB`");
  return Response.json(
    { error: unavailable ? "랭킹 저장소를 준비 중입니다." : message },
    { status: unavailable ? 503 : 500 },
  );
}

export async function GET(request: Request) {
  try {
    const player = await authenticatePlayer(request);
    if (!player) return unauthorizedPlayerResponse();
    return Response.json({ ...parseProgress(player.progressJson), synced: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const player = await authenticatePlayer(request);
    if (!player) return unauthorizedPlayerResponse();

    const payload = await request.json() as {
      verseId?: string;
      bookCode?: string;
      weight?: number;
      cpm?: number;
      accuracy?: number;
      durationSeconds?: number;
      typedChars?: number;
      correctChars?: number;
      currentIndex?: number;
      localDate?: string;
      mode?: PracticeMode;
      combo?: number;
      stageId?: number;
    };

    const verseId = payload.verseId?.trim() ?? "";
    const bookCode = payload.bookCode?.trim() ?? "";
    const localDate = payload.localDate?.trim() ?? "";
    const mode: PracticeMode = payload.mode === "battle" ? "battle" : "standard";
    const weight = Math.max(1, Math.min(20, Math.round(payload.weight ?? 1)));
    const cpm = Math.max(0, Math.min(3000, Math.round(payload.cpm ?? 0)));
    const accuracy = Math.max(0, Math.min(100, Number(payload.accuracy ?? 0)));
    const durationSeconds = Math.max(0.1, Math.min(3600, Number(payload.durationSeconds ?? 0)));
    const typedChars = Math.max(0, Math.min(10000, Math.round(payload.typedChars ?? 0)));
    const correctChars = Math.max(0, Math.min(typedChars, Math.round(payload.correctChars ?? 0)));
    const currentIndex = Math.max(0, Math.round(payload.currentIndex ?? 0));
    const combo = Math.max(0, Math.min(1000, Math.round(payload.combo ?? 0)));
    const stageId = mode === "battle" ? Math.max(1, Math.min(25, Math.round(payload.stageId ?? 1))) : null;

    if (!verseId || !bookCode || !/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
      return Response.json({ error: "올바르지 않은 연습 결과입니다." }, { status: 400 });
    }

    const score = calculateSessionScore({ mode, cpm, accuracy, typedChars, correctChars, combo, stageId });
    const completedAt = new Date().toISOString();
    const previous = parseProgress(player.progressJson);
    const completedIds = previous.completedIds.includes(verseId)
      ? previous.completedIds
      : [...previous.completedIds, verseId];
    const days = [...previous.days];
    const dayIndex = days.findIndex((day) => day.date === localDate);
    const previousDay = dayIndex >= 0 ? days[dayIndex] : { date: localDate, versesCompleted: 0, sessions: 0 };
    const updatedDay = {
      ...previousDay,
      versesCompleted: previousDay.versesCompleted + weight,
      sessions: previousDay.sessions + 1,
    };
    if (dayIndex >= 0) days[dayIndex] = updatedDay;
    else days.unshift(updatedDay);

    const updatedProgress: StoredProgress = {
      ...previous,
      completedIds,
      currentIndex,
      totalSessions: previous.totalSessions + 1,
      totalTypedChars: previous.totalTypedChars + typedChars,
      correctChars: previous.correctChars + correctChars,
      bestCpm: Math.max(previous.bestCpm, cpm),
      bestAccuracy: Math.max(previous.bestAccuracy, accuracy),
      days: days.slice(0, 366),
      recent: [{ verseId, bookCode, cpm, accuracy, durationSeconds, completedAt, mode, score }, ...previous.recent].slice(0, 20),
    };

    const nextTotalScore = player.totalScore + score;
    const nextPracticeScore = player.practiceScore + (mode === "standard" ? score : 0);
    const nextBattleScore = player.battleScore + (mode === "battle" ? score : 0);
    const nextBestScore = Math.max(player.bestScore, score);
    const db = getDb();
    await db.batch([
      db.insert(rankedSessions).values({
        playerId: player.id,
        mode,
        score,
        verseId,
        bookCode,
        cpm,
        accuracy,
        combo,
        stageId,
        durationSeconds,
        completedAt,
      }),
      db.update(players).set({
        progressJson: JSON.stringify(updatedProgress),
        totalScore: nextTotalScore,
        practiceScore: nextPracticeScore,
        battleScore: nextBattleScore,
        totalSessions: player.totalSessions + 1,
        bestScore: nextBestScore,
        bestCpm: Math.max(player.bestCpm, cpm),
        bestAccuracy: Math.max(player.bestAccuracy, accuracy),
        updatedAt: completedAt,
      }).where(eq(players.id, player.id)),
    ]);

    const [higher] = await db
      .select({ count: sql<number>`count(*)` })
      .from(players)
      .where(gt(players.totalScore, nextTotalScore));

    return Response.json({
      ok: true,
      synced: true,
      score,
      player: {
        id: player.displayId,
        totalScore: nextTotalScore,
        practiceScore: nextPracticeScore,
        battleScore: nextBattleScore,
        totalSessions: player.totalSessions + 1,
        bestScore: nextBestScore,
        bestCpm: Math.max(player.bestCpm, cpm),
        bestAccuracy: Math.max(player.bestAccuracy, accuracy),
        rank: Number(higher?.count ?? 0) + 1,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
