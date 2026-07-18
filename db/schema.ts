import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
