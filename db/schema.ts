import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const profile = sqliteTable("profile", {
  id: text("id").primaryKey(),
  dailyGoal: integer("daily_goal").notNull().default(10),
  currentIndex: integer("current_index").notNull().default(0),
  totalSessions: integer("total_sessions").notNull().default(0),
  totalTypedChars: integer("total_typed_chars").notNull().default(0),
  correctChars: integer("correct_chars").notNull().default(0),
  bestCpm: integer("best_cpm").notNull().default(0),
  bestAccuracy: real("best_accuracy").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const completedVerses = sqliteTable("completed_verses", {
  verseId: text("verse_id").primaryKey(),
  bookCode: text("book_code").notNull(),
  weight: integer("weight").notNull().default(1),
  bestCpm: integer("best_cpm").notNull().default(0),
  bestAccuracy: real("best_accuracy").notNull().default(0),
  completedAt: text("completed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const practiceDays = sqliteTable("practice_days", {
  date: text("date").primaryKey(),
  versesCompleted: integer("verses_completed").notNull().default(0),
  sessions: integer("sessions").notNull().default(0),
});

export const practiceSessions = sqliteTable("practice_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  verseId: text("verse_id").notNull(),
  bookCode: text("book_code").notNull(),
  cpm: integer("cpm").notNull(),
  accuracy: real("accuracy").notNull(),
  durationSeconds: real("duration_seconds").notNull(),
  completedAt: text("completed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  displayId: text("display_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  progressJson: text("progress_json").notNull().default("{}"),
  totalScore: integer("total_score").notNull().default(0),
  practiceScore: integer("practice_score").notNull().default(0),
  battleScore: integer("battle_score").notNull().default(0),
  totalSessions: integer("total_sessions").notNull().default(0),
  bestScore: integer("best_score").notNull().default(0),
  bestCpm: integer("best_cpm").notNull().default(0),
  bestAccuracy: real("best_accuracy").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("players_total_score_idx").on(table.totalScore),
  index("players_practice_score_idx").on(table.practiceScore),
  index("players_battle_score_idx").on(table.battleScore),
]);

export const rankedSessions = sqliteTable("ranked_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: text("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  mode: text("mode", { enum: ["standard", "battle"] }).notNull(),
  score: integer("score").notNull(),
  verseId: text("verse_id").notNull(),
  bookCode: text("book_code").notNull(),
  cpm: integer("cpm").notNull(),
  accuracy: real("accuracy").notNull(),
  combo: integer("combo").notNull().default(0),
  stageId: integer("stage_id"),
  durationSeconds: real("duration_seconds").notNull(),
  completedAt: text("completed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("ranked_sessions_player_idx").on(table.playerId),
  index("ranked_sessions_score_idx").on(table.score),
  index("ranked_sessions_completed_idx").on(table.completedAt),
]);
