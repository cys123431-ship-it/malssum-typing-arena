CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`display_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`progress_json` text DEFAULT '{}' NOT NULL,
	`total_score` integer DEFAULT 0 NOT NULL,
	`practice_score` integer DEFAULT 0 NOT NULL,
	`battle_score` integer DEFAULT 0 NOT NULL,
	`total_sessions` integer DEFAULT 0 NOT NULL,
	`best_score` integer DEFAULT 0 NOT NULL,
	`best_cpm` integer DEFAULT 0 NOT NULL,
	`best_accuracy` real DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `players_total_score_idx` ON `players` (`total_score`);--> statement-breakpoint
CREATE INDEX `players_practice_score_idx` ON `players` (`practice_score`);--> statement-breakpoint
CREATE INDEX `players_battle_score_idx` ON `players` (`battle_score`);--> statement-breakpoint
CREATE TABLE `ranked_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` text NOT NULL,
	`mode` text NOT NULL,
	`score` integer NOT NULL,
	`verse_id` text NOT NULL,
	`book_code` text NOT NULL,
	`cpm` integer NOT NULL,
	`accuracy` real NOT NULL,
	`combo` integer DEFAULT 0 NOT NULL,
	`stage_id` integer,
	`duration_seconds` real NOT NULL,
	`completed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ranked_sessions_player_idx` ON `ranked_sessions` (`player_id`);--> statement-breakpoint
CREATE INDEX `ranked_sessions_score_idx` ON `ranked_sessions` (`score`);--> statement-breakpoint
CREATE INDEX `ranked_sessions_completed_idx` ON `ranked_sessions` (`completed_at`);