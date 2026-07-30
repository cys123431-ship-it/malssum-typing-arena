import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSourceUrl = new URL("../app/BibleTypingApp.tsx", import.meta.url);
const cssSourceUrl = new URL("../app/globals.css", import.meta.url);
const pageSourceUrl = new URL("../app/page.tsx", import.meta.url);
const nextConfigSourceUrl = new URL("../next.config.ts", import.meta.url);
const schemaSourceUrl = new URL("../db/schema.ts", import.meta.url);
const playerRouteSourceUrl = new URL("../app/api/player/route.ts", import.meta.url);
const progressRouteSourceUrl = new URL("../app/api/progress/route.ts", import.meta.url);
const leaderboardRouteSourceUrl = new URL("../app/api/leaderboard/route.ts", import.meta.url);
const migrationSourceUrl = new URL("../drizzle/0001_military_terror.sql", import.meta.url);

async function readSources() {
  const [app, css, page, nextConfig, schema, playerRoute, progressRoute, leaderboardRoute, migration] = await Promise.all([
    readFile(appSourceUrl, "utf8"),
    readFile(cssSourceUrl, "utf8"),
    readFile(pageSourceUrl, "utf8"),
    readFile(nextConfigSourceUrl, "utf8"),
    readFile(schemaSourceUrl, "utf8"),
    readFile(playerRouteSourceUrl, "utf8"),
    readFile(progressRouteSourceUrl, "utf8"),
    readFile(leaderboardRouteSourceUrl, "utf8"),
    readFile(migrationSourceUrl, "utf8"),
  ]);
  return { app, css, page, nextConfig, schema, playerRoute, progressRoute, leaderboardRoute, migration };
}

test("serves game artwork without the unavailable production image optimizer", async () => {
  const { app, nextConfig } = await readSources();

  assert.match(nextConfig, /images:\s*\{/);
  assert.match(nextConfig, /unoptimized:\s*true/);
  assert.match(app, /import NextImage, \{ type ImageProps \} from "next\/image"/);
  assert.match(app, /<NextImage \{\.\.\.props\} unoptimized \/>/);
});

test("adds the type-console theme without replacing the classic theme", async () => {
  const { app, page } = await readSources();

  assert.match(page, /<BibleTypingApp\s*\/>/);
  assert.match(app, /type VisualTheme = "classic" \| "type-console"/);
  assert.match(app, /VISUAL_THEME_STORAGE_KEY = "bible-typing-visual-theme"/);
  assert.match(app, /getItem\("bible-typing-theme"\)/);
  assert.match(app, /setItem\("bible-typing-theme", theme\)/);
  assert.match(app, /visual-theme--\$\{visualTheme\}/);
  assert.match(app, /aria-pressed=\{value === "classic"\}/);
  assert.match(app, /aria-pressed=\{value === "type-console"\}/);
});

test("defines the sharp light and dark console design tokens", async () => {
  const { css } = await readSources();

  assert.match(css, /\.visual-theme--type-console\s*\{/);
  assert.match(css, /--console-bg:\s*#e8efe8/i);
  assert.match(css, /--console-ink:\s*#071e19/i);
  assert.match(css, /--console-accent:\s*#c5ef3a/i);
  assert.match(css, /html\[data-theme="dark"\] \.visual-theme--type-console\s*\{/);
  assert.match(css, /--console-bg:\s*#061a15/i);
  assert.match(css, /\.console-home__index/);
  assert.match(css, /\.console-home__ticker/);
  assert.match(css, /\.console-word-stack/);
  assert.match(css, /\.console-input-bar/);
  assert.match(css, /@media \(max-width: 820px\)/);
});

test("connects the cursor stage to live word and character state", async () => {
  const { app } = await readSources();

  assert.match(app, /currentUnit\.t\.matchAll\(\/\\S\+\/g\)/);
  assert.match(app, /activeConsoleWordIndex/);
  assert.match(app, /visibleConsoleWords/);
  assert.match(app, /console-current-word/);
  assert.match(app, /is-input-position/);
  assert.match(app, /console-live-stats/);
  assert.match(app, /ref=\{inputRef\}/);
  assert.match(app, /onCompositionStart/);
  assert.match(app, /onCompositionEnd/);
});

test("preserves keyboard navigation and does not reserve Tab", async () => {
  const { app } = await readSources();

  assert.match(app, /event\.key === "Escape"/);
  assert.match(app, /event\.key === "Enter"/);
  assert.match(app, /event\.key\.toLowerCase\(\) === "r"/);
  assert.doesNotMatch(app, /event\.key === "Tab"/);
  assert.match(app, /inputRef\.current\?\.focus\(\)/);
});

test("adds the optional Bible word battle without replacing standard practice", async () => {
  const { app, css } = await readSources();

  assert.match(app, /type PracticeMode = "standard" \| "battle"/);
  assert.match(app, /const beginBattle = useCallback/);
  assert.match(app, /practiceMode === "battle"/);
  assert.match(app, />말씀 전투</);
  assert.match(app, /battleHealth/);
  assert.match(app, /battleScore/);
  assert.match(app, /enemy-shadow\.webp/);
  assert.match(app, /battle-muzzle-flash-v2\.webp/);
  assert.match(app, /battle-tracer-v2\.webp/);
  assert.match(app, /battle-impact-v2\.webp/);
  assert.doesNotMatch(app, /word-impact-burst\.webp/);
  assert.doesNotMatch(app, /word-projectile-streak\.webp/);
  assert.match(app, /battle-fighter--idle/);
  assert.match(app, /battle-fighter--aim/);
  assert.match(css, /\.battle-practice/);
  assert.match(css, /\.battle-health-track/);
  assert.match(css, /\.battle-hit-fx/);
  assert.match(css, /\.battle-miss-flash/);
  assert.match(css, /\.battle-current-word\.is-very-long-word/);
  assert.match(css, /battle-fighter-face-turn 960ms/);
  assert.match(css, /battle-fighter-aim-turn 960ms/);
  assert.match(css, /\.battle-fighter--aim\s*\{[^}]*scaleX\(-1\)/s);
  assert.match(css, /battle-depth-projectile 430ms/);
  assert.match(app, /window\.visualViewport/);
  assert.match(css, /data-battle-keyboard="open"/);
});

test("keeps battle typing connected to the existing accuracy and completion logic", async () => {
  const { app } = await readSources();

  assert.match(app, /nextErrors \+= 1/);
  assert.match(app, /errorsRef\.current = nextErrors/);
  assert.match(app, /setTyped\(nextValue\)/);
  assert.match(app, /currentCombo = typed\[index\] === currentUnit\.t\[index\] \? currentCombo \+ 1 : 0/);
  assert.match(app, /const cpm = Math\.round\(\(correctKeystrokes \/ durationSeconds\) \* 60\)/);
  assert.match(app, /finishPractice\(nextKeystrokes, nextErrors, start, finalCombo\)/);
  assert.doesNotMatch(app, /event\.key === "Tab"/);
});

test("adds unique player identities and server-backed ranked scoring", async () => {
  const { app, css, schema, playerRoute, progressRoute, leaderboardRoute, migration } = await readSources();

  assert.match(schema, /sqliteTable\("players"/);
  assert.match(schema, /sqliteTable\("ranked_sessions"/);
  assert.match(migration, /CREATE TABLE `players`/);
  assert.match(migration, /CREATE TABLE `ranked_sessions`/);
  assert.match(playerRoute, /status: duplicate \? 409 : 500/);
  assert.match(playerRoute, /createPlayerToken/);
  assert.match(progressRoute, /calculateSessionScore/);
  assert.match(progressRoute, /mode === "battle"/);
  assert.match(progressRoute, /db\.insert\(rankedSessions\)/);
  assert.match(leaderboardRoute, /\.limit\(50\)/);
  assert.match(leaderboardRoute, /players\.practiceScore/);
  assert.match(leaderboardRoute, /players\.battleScore/);
  assert.match(app, /PLAYER_SESSION_STORAGE_KEY/);
  assert.match(app, /RECORD MODE \/ LIVE RANKING/);
  assert.match(app, /기록 모드 ON/);
  assert.match(app, /랭킹 기록 점수/);
  assert.match(css, /\.leaderboard-table/);
  assert.match(css, /\.ranking-account/);
});

test("adds a persistent six-fighter chooser before Bible word battle", async () => {
  const { app, css } = await readSources();

  assert.match(app, /type BattleFighterId = "seoha" \| "mira" \| "yuna" \| "riel" \| "hana" \| "arin"/);
  assert.match(app, /BATTLE_FIGHTER_STORAGE_KEY = "bible-typing-battle-fighter"/);
  assert.match(app, /setView\("battle-select"\)/);
  assert.match(app, /fighter-select__roster/);
  assert.match(app, /aria-pressed=\{fighter\.id === selectedFighter\.id\}/);
  assert.match(app, /startSelectedBattle/);
  assert.match(app, /fighter-seoha-v2\.webp/);
  assert.match(app, /fighter-mira-v2\.webp/);
  assert.match(app, /fighter-yuna-v2\.webp/);
  assert.match(app, /fighter-riel-v2\.webp/);
  assert.match(app, /fighter-hana-v2\.webp/);
  assert.match(app, /fighter-arin-v2\.webp/);
  assert.match(app, /잿빛 기록의 배달자/);
  assert.match(app, /새벽별의 관측자/);
  assert.match(app, /깨어진 종의 대장장이/);
  assert.match(app, /금서고의 붉은 필경사/);
  assert.match(app, /푸른 성소의 수호자/);
  assert.match(app, /침묵 경계의 파수꾼/);
  assert.match(app, /fighter-select__lore/);
  assert.match(app, /fighter-select__traits/);
  assert.match(app, /selectedFighter\.traits\.map/);
  assert.match(css, /\.fighter-select/);
  assert.match(css, /\.fighter-select__portrait/);
  assert.match(css, /\.fighter-select__roster/);
  assert.match(css, /\.battle-fighter-wrap\.is-attacking/);
  assert.match(css, /grid-auto-flow:\s*column/);
});

test("adds a persistent 25-stage campaign with growth and a final Satan battle", async () => {
  const { app, css } = await readSources();

  assert.match(app, /BATTLE_CAMPAIGN_STORAGE_KEY = "bible-typing-battle-campaign-v1"/);
  assert.match(app, /const BATTLE_STAGES: BattleStage\[\]/);
  assert.match(app, /\["사탄 · 심연의 왕", "마지막 왕좌"\]/);
  assert.match(app, /enemy-satan\.webp/);
  assert.match(app, /highestUnlockedStage/);
  assert.match(app, /grantCampaignRewards/);
  assert.match(app, /weaponLevel/);
  assert.match(app, /setBattleDefeated\(true\)/);
  assert.match(app, /마지막 왕좌까지/);
  assert.match(app, /사탄을 물리쳤습니다/);
  assert.match(css, /\.campaign-map/);
  assert.match(css, /\.campaign-act/);
  assert.match(css, /\.campaign-growth/);
  assert.match(css, /\.battle-defeat/);
  assert.match(css, /\.battle-player-health/);
});
