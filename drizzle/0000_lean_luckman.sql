CREATE TABLE `completed_verses` (
	`verse_id` text PRIMARY KEY NOT NULL,
	`book_code` text NOT NULL,
	`weight` integer DEFAULT 1 NOT NULL,
	`best_cpm` integer DEFAULT 0 NOT NULL,
	`best_accuracy` real DEFAULT 0 NOT NULL,
	`completed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `practice_days` (
	`date` text PRIMARY KEY NOT NULL,
	`verses_completed` integer DEFAULT 0 NOT NULL,
	`sessions` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `practice_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`verse_id` text NOT NULL,
	`book_code` text NOT NULL,
	`cpm` integer NOT NULL,
	`accuracy` real NOT NULL,
	`duration_seconds` real NOT NULL,
	`completed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` text PRIMARY KEY NOT NULL,
	`daily_goal` integer DEFAULT 10 NOT NULL,
	`current_index` integer DEFAULT 0 NOT NULL,
	`total_sessions` integer DEFAULT 0 NOT NULL,
	`total_typed_chars` integer DEFAULT 0 NOT NULL,
	`correct_chars` integer DEFAULT 0 NOT NULL,
	`best_cpm` integer DEFAULT 0 NOT NULL,
	`best_accuracy` real DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
