import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  completedVerses,
  practiceDays,
  practiceSessions,
  profile,
} from "../../../db/schema";

const PROFILE_ID = "owner";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "진도 데이터를 불러오지 못했습니다.";
  const unavailable = message.includes("no such table") || message.includes("binding `DB`");
  return Response.json(
    { error: unavailable ? "진도 저장소를 준비 중입니다." : message },
    { status: unavailable ? 503 : 500 },
  );
}

export async function GET() {
  try {
    const db = getDb();
    await db.insert(profile).values({ id: PROFILE_ID }).onConflictDoNothing();

    const [profileRow] = await db.select().from(profile).where(eq(profile.id, PROFILE_ID));
    const completedRows = await db
      .select({ id: completedVerses.verseId })
      .from(completedVerses);
    const days = await db
      .select()
      .from(practiceDays)
      .orderBy(desc(practiceDays.date))
      .limit(120);
    const recent = await db
      .select()
      .from(practiceSessions)
      .orderBy(desc(practiceSessions.id))
      .limit(12);

    return Response.json({
      completedIds: completedRows.map((row) => row.id),
      currentIndex: profileRow.currentIndex,
      dailyGoal: profileRow.dailyGoal,
      totalSessions: profileRow.totalSessions,
      totalTypedChars: profileRow.totalTypedChars,
      correctChars: profileRow.correctChars,
      bestCpm: profileRow.bestCpm,
      bestAccuracy: profileRow.bestAccuracy,
      days,
      recent,
      synced: true,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
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
    };

    const verseId = payload.verseId?.trim() ?? "";
    const bookCode = payload.bookCode?.trim() ?? "";
    const localDate = payload.localDate?.trim() ?? "";
    const weight = Math.max(1, Math.min(20, Math.round(payload.weight ?? 1)));
    const cpm = Math.max(0, Math.min(3000, Math.round(payload.cpm ?? 0)));
    const accuracy = Math.max(0, Math.min(100, Number(payload.accuracy ?? 0)));
    const durationSeconds = Math.max(0.1, Math.min(3600, Number(payload.durationSeconds ?? 0)));
    const typedChars = Math.max(0, Math.min(10000, Math.round(payload.typedChars ?? 0)));
    const correctChars = Math.max(0, Math.min(typedChars, Math.round(payload.correctChars ?? 0)));
    const currentIndex = Math.max(0, Math.round(payload.currentIndex ?? 0));

    if (!verseId || !bookCode || !/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
      return Response.json({ error: "올바르지 않은 연습 결과입니다." }, { status: 400 });
    }

    const db = getDb();
    const completedAt = new Date().toISOString();

    await db.insert(profile).values({ id: PROFILE_ID }).onConflictDoNothing();
    await db.insert(practiceSessions).values({
      verseId,
      bookCode,
      cpm,
      accuracy,
      durationSeconds,
      completedAt,
    });
    await db
      .insert(completedVerses)
      .values({ verseId, bookCode, weight, bestCpm: cpm, bestAccuracy: accuracy, completedAt })
      .onConflictDoUpdate({
        target: completedVerses.verseId,
        set: {
          bestCpm: sql`max(${completedVerses.bestCpm}, excluded.best_cpm)`,
          bestAccuracy: sql`max(${completedVerses.bestAccuracy}, excluded.best_accuracy)`,
        },
      });
    await db
      .insert(practiceDays)
      .values({ date: localDate, versesCompleted: weight, sessions: 1 })
      .onConflictDoUpdate({
        target: practiceDays.date,
        set: {
          versesCompleted: sql`${practiceDays.versesCompleted} + ${weight}`,
          sessions: sql`${practiceDays.sessions} + 1`,
        },
      });
    await db
      .update(profile)
      .set({
        currentIndex,
        totalSessions: sql`${profile.totalSessions} + 1`,
        totalTypedChars: sql`${profile.totalTypedChars} + ${typedChars}`,
        correctChars: sql`${profile.correctChars} + ${correctChars}`,
        bestCpm: sql`max(${profile.bestCpm}, ${cpm})`,
        bestAccuracy: sql`max(${profile.bestAccuracy}, ${accuracy})`,
        updatedAt: completedAt,
      })
      .where(eq(profile.id, PROFILE_ID));

    return Response.json({ ok: true, synced: true });
  } catch (error) {
    return errorResponse(error);
  }
}
