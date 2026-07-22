import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSourceUrl = new URL("../app/BibleTypingApp.tsx", import.meta.url);
const cssSourceUrl = new URL("../app/globals.css", import.meta.url);
const pageSourceUrl = new URL("../app/page.tsx", import.meta.url);

async function readSources() {
  const [app, css, page] = await Promise.all([
    readFile(appSourceUrl, "utf8"),
    readFile(cssSourceUrl, "utf8"),
    readFile(pageSourceUrl, "utf8"),
  ]);
  return { app, css, page };
}

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
  assert.match(app, /word-impact-burst\.webp/);
  assert.match(app, /word-projectile-streak\.webp/);
  assert.match(css, /\.battle-practice/);
  assert.match(css, /\.battle-health-track/);
  assert.match(css, /\.battle-hit-fx/);
  assert.match(css, /\.battle-miss-flash/);
  assert.match(css, /\.battle-current-word\.is-very-long-word/);
});

test("keeps battle typing connected to the existing accuracy and completion logic", async () => {
  const { app } = await readSources();

  assert.match(app, /nextErrors \+= 1/);
  assert.match(app, /errorsRef\.current = nextErrors/);
  assert.match(app, /setTyped\(nextValue\)/);
  assert.match(app, /currentCombo = typed\[index\] === currentUnit\.t\[index\] \? currentCombo \+ 1 : 0/);
  assert.match(app, /const cpm = Math\.round\(\(correctKeystrokes \/ durationSeconds\) \* 60\)/);
  assert.match(app, /finishPractice\(nextKeystrokes, nextErrors, start\)/);
  assert.doesNotMatch(app, /event\.key === "Tab"/);
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
