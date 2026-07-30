"use client";

import {
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import NextImage, { type ImageProps } from "next/image";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CrosshairIcon,
  ListIcon,
  MoonIcon,
  SunIcon,
  XIcon,
} from "@phosphor-icons/react";

type View = "home" | "library" | "battle-select" | "battle-map" | "practice" | "progress" | "ranking";
type VisualTheme = "classic" | "type-console";
type PracticeMode = "standard" | "battle";
type RankingScope = "overall" | "standard" | "battle";
type BattleFighterId = "seoha" | "mira" | "yuna" | "riel" | "hana" | "arin";

type BattleFighter = {
  id: BattleFighterId;
  name: string;
  title: string;
  role: string;
  weapon: string;
  tagline: string;
  story: string;
  personality: string;
  traits: [string, string, string];
  motto: string;
  asset: string;
  width: number;
  height: number;
  battleAsset: string;
  battleWidth: number;
  battleHeight: number;
  accent: string;
};

type BattleFeedback = {
  id: number;
  kind: "hit" | "miss";
  strength: 1 | 2 | 3;
};

type BattleStage = {
  id: number;
  act: number;
  region: string;
  enemy: string;
  title: string;
  asset: string;
  width: number;
  height: number;
  maxHealth: number;
  missDamage: number;
  characterXp: number;
  weaponXp: number;
  boss: boolean;
};

type FighterCampaignProgress = {
  level: number;
  xp: number;
  weaponLevel: number;
  weaponXp: number;
  clearedStages: number[];
};

type BattleCampaignState = Record<BattleFighterId, FighterCampaignProgress>;

type BattleReward = {
  characterXp: number;
  weaponXp: number;
  levelUps: number;
  weaponLevelUps: number;
  firstClear: boolean;
};

type BibleUnit = {
  id: string;
  b: string;
  c: number;
  v: number;
  e?: number;
  w: number;
  t: string;
};

type BibleBook = {
  code: string;
  name: string;
  testament: "구약" | "신약";
  order: number;
  chapters: number;
  units: number;
  verses: number;
};

type BibleData = {
  version: string;
  totalUnits: number;
  totalVerses: number;
  books: BibleBook[];
  units: BibleUnit[];
};

type PracticeDay = {
  date: string;
  versesCompleted: number;
  sessions: number;
};

type SessionResult = {
  id?: number;
  verseId: string;
  bookCode: string;
  cpm: number;
  accuracy: number;
  durationSeconds: number;
  completedAt: string;
  isNew?: boolean;
  mode?: PracticeMode;
  score?: number;
  scoreError?: boolean;
};

type PlayerSession = {
  id: string;
  token: string;
};

type PlayerSummary = {
  id: string;
  totalScore: number;
  practiceScore: number;
  battleScore: number;
  totalSessions: number;
  bestScore: number;
  bestCpm: number;
  bestAccuracy: number;
  rank: number;
};

type LeaderboardEntry = {
  id: string;
  score: number;
  totalScore: number;
  totalSessions: number;
  bestScore: number;
  bestCpm: number;
  bestAccuracy: number;
  rank: number;
};

type ProgressState = {
  completedIds: string[];
  currentIndex: number;
  dailyGoal: number;
  totalSessions: number;
  totalTypedChars: number;
  correctChars: number;
  bestCpm: number;
  bestAccuracy: number;
  days: PracticeDay[];
  recent: SessionResult[];
};

type WordRange = {
  text: string;
  start: number;
  end: number;
};

function Image(props: ImageProps) {
  return <NextImage {...props} unoptimized />;
}

function playerRequestHeaders(session: PlayerSession | null): Record<string, string> {
  return session
    ? { "x-player-id": session.id, "x-player-token": session.token }
    : {};
}

function readPlayerSession(): PlayerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PLAYER_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<PlayerSession>;
    return value.id && value.token ? { id: value.id, token: value.token } : null;
  } catch {
    window.localStorage.removeItem(PLAYER_SESSION_STORAGE_KEY);
    return null;
  }
}

const STORAGE_KEY = "bible-typing-progress-v1";
const VISUAL_THEME_STORAGE_KEY = "bible-typing-visual-theme";
const BATTLE_FIGHTER_STORAGE_KEY = "bible-typing-battle-fighter";
const BATTLE_CAMPAIGN_STORAGE_KEY = "bible-typing-battle-campaign-v1";
const PLAYER_SESSION_STORAGE_KEY = "bible-typing-player-session-v1";
const BATTLE_FIGHTERS: BattleFighter[] = [
  {
    id: "seoha",
    name: "서하",
    title: "잿빛 기록의 배달자",
    role: "선봉",
    weapon: "레일 스태프",
    tagline: "빠르고 균형 잡힌 말씀 사격",
    story: "말씀이 지워진 마을들을 오가며 마지막 기록을 운반하던 전령. 단 한 줄이라도 다음 사람에게 전해지면 어둠은 완전해질 수 없다는 믿음으로 가장 먼저 전장에 섭니다.",
    personality: "침착하고 다정한 책임가",
    traits: ["균형 잡힌 전개", "빠른 기동", "안정적인 연계"],
    motto: "한 줄을 지키면, 다음 길이 열린다.",
    asset: "/game-assets/fighters/fighter-seoha-v2.webp",
    width: 1024,
    height: 1536,
    battleAsset: "/game-assets/fighters/fighter-seoha-battle-v2.webp",
    battleWidth: 1024,
    battleHeight: 1536,
    accent: "#f0a32f",
  },
  {
    id: "mira",
    name: "미라",
    title: "새벽별의 관측자",
    role: "정밀",
    weapon: "초승달 활",
    tagline: "정확한 한 글자를 멀리 보냅니다",
    story: "침묵의 안개 속에서도 별빛처럼 남은 말씀의 흔적을 찾아내는 관측자. 서두르지 않고 정확한 한 글자를 골라, 멀리 숨어 있는 어둠의 핵을 꿰뚫습니다.",
    personality: "조용하고 섬세한 완벽주의자",
    traits: ["정확한 조준", "차분한 집중", "원거리 대응"],
    motto: "보이지 않아도, 말씀은 방향을 남긴다.",
    asset: "/game-assets/fighters/fighter-mira-v2.webp",
    width: 1403,
    height: 1121,
    battleAsset: "/game-assets/fighters/fighter-mira-battle-v2.webp",
    battleWidth: 1023,
    battleHeight: 1537,
    accent: "#7ac8ff",
  },
  {
    id: "yuna",
    name: "유나",
    title: "깨어진 종의 대장장이",
    role: "중화력",
    weapon: "공명 포",
    tagline: "묵직한 타격으로 어둠을 흔듭니다",
    story: "마을 예배당의 종이 부서진 날, 남은 금속과 말씀의 울림으로 공명 포를 만든 대장장이. 밝은 웃음 뒤에 강한 보호 본능을 품고 동료 앞을 든든히 지킵니다.",
    personality: "호쾌하고 따뜻한 보호자",
    traits: ["묵직한 타격", "강한 존재감", "든든한 압박"],
    motto: "다시 울리면 돼. 더 크게, 더 멀리.",
    asset: "/game-assets/fighters/fighter-yuna-v2.webp",
    width: 1536,
    height: 1024,
    battleAsset: "/game-assets/fighters/fighter-yuna-battle-v2.webp",
    battleWidth: 1024,
    battleHeight: 1536,
    accent: "#e35f62",
  },
  {
    id: "riel",
    name: "리엘",
    title: "금서고의 붉은 필경사",
    role: "관통",
    weapon: "펜 랜스",
    tagline: "문장을 꿰뚫는 날카로운 집중",
    story: "왜곡된 문장을 바로잡다 추방된 필경사로, 거대한 펜 랜스에 바른 구절을 새겨 싸웁니다. 규칙보다 진실을 먼저 택하며 막힌 문장과 방어선을 단숨에 돌파합니다.",
    personality: "대담하고 예리한 반골",
    traits: ["날카로운 관통", "과감한 돌파", "흔들림 없는 판단"],
    motto: "틀린 문장은, 바른 글로 꿰뚫는다.",
    asset: "/game-assets/fighters/fighter-riel-v2.webp",
    width: 1536,
    height: 1024,
    battleAsset: "/game-assets/fighters/fighter-riel-battle-v2.webp",
    battleWidth: 1024,
    battleHeight: 1536,
    accent: "#a47bff",
  },
  {
    id: "hana",
    name: "하나",
    title: "푸른 성소의 수호자",
    role: "연타",
    weapon: "쌍 말씀봉",
    tagline: "콤보가 쌓일수록 빛나는 연속타",
    story: "피난민들이 모인 작은 성소를 지키며 아이들에게 말씀과 호흡을 함께 가르친 수호자. 반복은 지루함이 아니라 마음을 단단하게 만드는 리듬이라고 믿습니다.",
    personality: "활기차고 긍정적인 훈련가",
    traits: ["경쾌한 연속타", "리듬감 있는 전투", "끈질긴 추격"],
    motto: "한 번 더. 마음에 새겨질 때까지.",
    asset: "/game-assets/fighters/fighter-hana-v2.webp",
    width: 1129,
    height: 1393,
    battleAsset: "/game-assets/fighters/fighter-hana-battle-v2.webp",
    battleWidth: 1007,
    battleHeight: 1562,
    accent: "#e5bf45",
  },
  {
    id: "arin",
    name: "아린",
    title: "침묵 경계의 파수꾼",
    role: "저격",
    weapon: "말씀 소총",
    tagline: "흔들림 없이 약점을 겨눕니다",
    story: "말소의 안개가 번지는 국경에서 홀로 신호를 지켜 온 파수꾼. 가장 어두운 순간에도 조급해하지 않고, 정확한 때가 오면 단 한 발로 길을 되찾습니다.",
    personality: "냉정해 보이지만 헌신적인 현실가",
    traits: ["약점 포착", "긴 호흡의 집중", "정밀한 마무리"],
    motto: "기다림도 전투다. 때가 오면 놓치지 않는다.",
    asset: "/game-assets/fighters/fighter-arin-v2.webp",
    width: 1570,
    height: 1002,
    battleAsset: "/game-assets/fighters/fighter-arin-battle-v2.webp",
    battleWidth: 992,
    battleHeight: 1586,
    accent: "#51d5ca",
  },
];

const BATTLE_STAGE_NAMES = [
  ["속삭이는 그림자", "첫 어둠의 흔적"],
  ["거짓의 잔상", "흔들리는 목소리"],
  ["탐욕의 짐승", "붙드는 검은 손"],
  ["공포의 파수꾼", "밤의 경계선"],
  ["검은 사도", "잿빛 들판의 주인"],
  ["침묵의 사냥개", "닫힌 문 앞에서"],
  ["쇠사슬 수문장", "무거운 속박"],
  ["절망의 기사", "빛을 잊은 갑옷"],
  ["망각의 성벽", "기억을 삼킨 벽"],
  ["침묵의 거인", "성벽의 마지막 문"],
  ["먹빛 사서", "검게 번진 기록"],
  ["왜곡의 필경사", "바뀌어 버린 문장"],
  ["탐식의 서고지기", "끝없는 두루마리"],
  ["거짓의 대심문관", "진실을 묻는 자"],
  ["찢긴 기록의 왕", "기록고의 봉인"],
  ["타락한 성가대", "금이 간 노래"],
  ["재의 집행자", "꺼지지 않는 심판"],
  ["교만의 대사제", "높아진 검은 제단"],
  ["멸망의 수호자", "무너지는 기둥"],
  ["무너진 성소의 군주", "성소의 마지막 밤"],
  ["심연의 눈", "문 너머의 시선"],
  ["유혹의 군주", "달콤한 거짓말"],
  ["붉은 용의 그림자", "타오르는 심연"],
  ["타락한 새벽별", "왕좌 앞의 수호자"],
  ["사탄 · 심연의 왕", "마지막 왕좌"],
] as const;

const BATTLE_REGIONS = ["잿빛 들판", "침묵의 성벽", "뒤틀린 기록고", "무너진 성소", "심연의 문"] as const;
const BATTLE_ENEMY_ASSETS = [
  { asset: "/game-assets/enemies/enemy-shadow.webp", width: 1402, height: 1122 },
  { asset: "/game-assets/enemies/enemy-gatekeeper.webp", width: 1402, height: 1122 },
  { asset: "/game-assets/enemies/enemy-scribe.webp", width: 1397, height: 1126 },
  { asset: "/game-assets/enemies/enemy-sanctum-lord.webp", width: 1402, height: 1122 },
  { asset: "/game-assets/enemies/enemy-fallen-star.webp", width: 1149, height: 1369 },
] as const;

const BATTLE_STAGES: BattleStage[] = BATTLE_STAGE_NAMES.map(([enemy, title], index) => {
  const id = index + 1;
  const act = Math.min(5, Math.floor(index / 5) + 1);
  const art = id === 25
    ? { asset: "/game-assets/enemies/enemy-satan.webp", width: 1122, height: 1402 }
    : BATTLE_ENEMY_ASSETS[act - 1];
  return {
    id,
    act,
    region: BATTLE_REGIONS[act - 1],
    enemy,
    title,
    ...art,
    maxHealth: id === 25 ? 5200 : 520 + (id * 128),
    missDamage: id === 25 ? 18 : 4 + Math.floor(id / 3),
    characterXp: id === 25 ? 720 : 70 + (id * 15),
    weaponXp: id === 25 ? 380 : 34 + (id * 7),
    boss: id % 5 === 0,
  };
});

function emptyFighterCampaign(): FighterCampaignProgress {
  return { level: 1, xp: 0, weaponLevel: 1, weaponXp: 0, clearedStages: [] };
}

function emptyBattleCampaign(): BattleCampaignState {
  return Object.fromEntries(BATTLE_FIGHTERS.map((fighter) => [fighter.id, emptyFighterCampaign()])) as BattleCampaignState;
}

function readBattleCampaign(): BattleCampaignState {
  const fallback = emptyBattleCampaign();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(BATTLE_CAMPAIGN_STORAGE_KEY);
    if (!raw) return fallback;
    const saved = JSON.parse(raw) as Partial<BattleCampaignState>;
    for (const fighter of BATTLE_FIGHTERS) {
      const value = saved[fighter.id];
      if (!value) continue;
      fallback[fighter.id] = {
        level: Math.max(1, Math.min(25, Number(value.level) || 1)),
        xp: Math.max(0, Number(value.xp) || 0),
        weaponLevel: Math.max(1, Math.min(10, Number(value.weaponLevel) || 1)),
        weaponXp: Math.max(0, Number(value.weaponXp) || 0),
        clearedStages: Array.from(new Set(Array.isArray(value.clearedStages) ? value.clearedStages : []))
          .map(Number)
          .filter((stage) => stage >= 1 && stage <= 25),
      };
    }
  } catch {
    window.localStorage.removeItem(BATTLE_CAMPAIGN_STORAGE_KEY);
  }
  return fallback;
}

function characterXpTarget(level: number) {
  return 100 + (level * 45);
}

function weaponXpTarget(level: number) {
  return 150 + (level * 85);
}

function highestUnlockedStage(progress: FighterCampaignProgress) {
  let cleared = 0;
  while (progress.clearedStages.includes(cleared + 1)) cleared += 1;
  return Math.min(25, cleared + 1);
}

function grantCampaignRewards(progress: FighterCampaignProgress, stage: BattleStage, firstClear: boolean) {
  const characterXpGained = Math.max(1, Math.round(stage.characterXp * (firstClear ? 1 : 0.35)));
  const weaponXpGained = Math.max(1, Math.round(stage.weaponXp * (firstClear ? 1 : 0.35)));
  let level = progress.level;
  let xp = progress.xp + characterXpGained;
  let levelUps = 0;
  while (level < 25 && xp >= characterXpTarget(level)) {
    xp -= characterXpTarget(level);
    level += 1;
    levelUps += 1;
  }
  if (level >= 25) xp = 0;

  let weaponLevel = progress.weaponLevel;
  let weaponXp = progress.weaponXp + weaponXpGained;
  let weaponLevelUps = 0;
  while (weaponLevel < 10 && weaponXp >= weaponXpTarget(weaponLevel)) {
    weaponXp -= weaponXpTarget(weaponLevel);
    weaponLevel += 1;
    weaponLevelUps += 1;
  }
  if (weaponLevel >= 10) weaponXp = 0;

  return {
    progress: {
      level,
      xp,
      weaponLevel,
      weaponXp,
      clearedStages: firstClear ? [...progress.clearedStages, stage.id].sort((a, b) => a - b) : progress.clearedStages,
    },
    reward: { characterXp: characterXpGained, weaponXp: weaponXpGained, levelUps, weaponLevelUps, firstClear } satisfies BattleReward,
  };
}

function emptyProgress(): ProgressState {
  return {
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
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function referenceFor(unit: BibleUnit, book?: BibleBook) {
  const verse = unit.e ? `${unit.v}-${unit.e}` : `${unit.v}`;
  return `${book?.name ?? unit.b} ${unit.c}:${verse}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(Math.round(value));
}

function formatToday(date = new Date()) {
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}. ${weekdays[date.getDay()]}`;
}

function mergeProgress(local: ProgressState, remote: Partial<ProgressState> | null) {
  if (!remote) return local;
  const remoteHasHistory = (remote.totalSessions ?? 0) > 0;
  const completedIds = [...new Set([...(local.completedIds ?? []), ...(remote.completedIds ?? [])])];
  const dayMap = new Map<string, PracticeDay>();

  for (const day of [...(local.days ?? []), ...(remote.days ?? [])]) {
    const previous = dayMap.get(day.date);
    if (!previous || day.sessions >= previous.sessions) dayMap.set(day.date, day);
  }

  return {
    completedIds,
    currentIndex: remoteHasHistory ? (remote.currentIndex ?? local.currentIndex) : local.currentIndex,
    dailyGoal: remote.dailyGoal ?? local.dailyGoal,
    totalSessions: Math.max(local.totalSessions, remote.totalSessions ?? 0),
    totalTypedChars: Math.max(local.totalTypedChars, remote.totalTypedChars ?? 0),
    correctChars: Math.max(local.correctChars, remote.correctChars ?? 0),
    bestCpm: Math.max(local.bestCpm, remote.bestCpm ?? 0),
    bestAccuracy: Math.max(local.bestAccuracy, remote.bestAccuracy ?? 0),
    days: [...dayMap.values()].sort((a, b) => b.date.localeCompare(a.date)),
    recent: remoteHasHistory && remote.recent?.length ? remote.recent : local.recent,
  };
}

function calculateStreak(days: PracticeDay[]) {
  const active = new Set(days.filter((day) => day.sessions > 0).map((day) => day.date));
  const cursor = new Date();
  if (!active.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;

  while (active.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function ProgressRing({ percent, value, caption, compact = false }: {
  percent: number;
  value: string;
  caption: string;
  compact?: boolean;
}) {
  const style = { "--ring-progress": `${Math.min(100, Math.max(0, percent)) * 3.6}deg` } as CSSProperties;
  return (
    <div className={`progress-ring ${compact ? "progress-ring--compact" : ""}`} style={style}>
      <div className="progress-ring__center">
        <strong>{value}</strong>
        <span>{caption}</span>
      </div>
    </div>
  );
}

function ThemeFamilyPicker({ value, onChange, compact = false }: {
  value: VisualTheme;
  onChange: (value: VisualTheme) => void;
  compact?: boolean;
}) {
  return (
    <div className={`theme-family-picker ${compact ? "is-compact" : ""}`} role="group" aria-label="디자인 테마 선택">
      <button className={value === "classic" ? "is-active" : ""} onClick={() => onChange("classic")} aria-pressed={value === "classic"}>
        기존 테마
      </button>
      <button className={value === "type-console" ? "is-active" : ""} onClick={() => onChange("type-console")} aria-pressed={value === "type-console"}>
        활자 콘솔
      </button>
    </div>
  );
}

export function BibleTypingApp() {
  const [bible, setBible] = useState<BibleData | null>(null);
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);
  const [view, setView] = useState<View>("home");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [clock, setClock] = useState(0);
  const [keystrokes, setKeystrokes] = useState(0);
  const [errors, setErrors] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [libraryTestament, setLibraryTestament] = useState<"전체" | "구약" | "신약">("전체");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [visualTheme, setVisualTheme] = useState<VisualTheme>("classic");
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("standard");
  const [selectedFighterId, setSelectedFighterId] = useState<BattleFighterId>(() => {
    if (typeof window === "undefined") return "seoha";
    const savedFighter = window.localStorage.getItem(BATTLE_FIGHTER_STORAGE_KEY);
    return BATTLE_FIGHTERS.some((fighter) => fighter.id === savedFighter)
      ? savedFighter as BattleFighterId
      : "seoha";
  });
  const [battleStartIndex, setBattleStartIndex] = useState(0);
  const [selectedBattleStage, setSelectedBattleStage] = useState(1);
  const [battleCampaign, setBattleCampaign] = useState<BattleCampaignState>(readBattleCampaign);
  const [battleEnemyHp, setBattleEnemyHp] = useState(BATTLE_STAGES[0].maxHealth);
  const [battlePlayerHp, setBattlePlayerHp] = useState(100);
  const [battleDefeated, setBattleDefeated] = useState(false);
  const [battleReward, setBattleReward] = useState<BattleReward | null>(null);
  const [battleFeedback, setBattleFeedback] = useState<BattleFeedback | null>(null);
  const [battleEffectsEnabled, setBattleEffectsEnabled] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState("기기 저장");
  const [loadingError, setLoadingError] = useState("");
  const [playerSession, setPlayerSession] = useState<PlayerSession | null>(readPlayerSession);
  const [playerSummary, setPlayerSummary] = useState<PlayerSummary | null>(null);
  const [playerIdDraft, setPlayerIdDraft] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [accountBusy, setAccountBusy] = useState(false);
  const [rankingScope, setRankingScope] = useState<RankingScope>("overall");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardBusy, setLeaderboardBusy] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const startedAtRef = useRef<number | null>(null);
  const keystrokesRef = useRef(0);
  const errorsRef = useRef(0);
  const isComposingRef = useRef(false);
  const compositionBaseRef = useRef("");
  const sessionResultShownRef = useRef(false);
  const completionLockRef = useRef(false);
  const battleFeedbackIdRef = useRef(0);
  const battlePlayerHpRef = useRef(100);
  const battleEnemyHpRef = useRef(BATTLE_STAGES[0].maxHealth);
  const battleRewardedRef = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    if (view !== "practice" || practiceMode !== "battle") {
      delete root.dataset.battleKeyboard;
      root.style.removeProperty("--battle-viewport-height");
      root.style.removeProperty("--battle-viewport-top");
      return;
    }

    const viewport = window.visualViewport;
    const battleInput = inputRef.current;
    let baselineHeight = Math.max(window.innerHeight, viewport?.height ?? 0);
    let scrollFrame = 0;

    const syncBattleViewport = () => {
      const viewportHeight = Math.round(viewport?.height ?? window.innerHeight);
      const viewportWidth = Math.round(viewport?.width ?? window.innerWidth);
      const viewportTop = Math.round(viewport?.offsetTop ?? 0);
      const inputFocused = document.activeElement === battleInput;

      if (!inputFocused && viewportHeight > baselineHeight - 80) {
        baselineHeight = Math.max(baselineHeight, viewportHeight);
      }

      const keyboardOpen = viewportWidth <= 820
        && inputFocused
        && baselineHeight - viewportHeight > Math.max(120, baselineHeight * 0.18);

      root.dataset.battleKeyboard = keyboardOpen ? "open" : "closed";
      root.style.setProperty("--battle-viewport-height", `${viewportHeight}px`);
      root.style.setProperty("--battle-viewport-top", `${viewportTop}px`);

      if (keyboardOpen) {
        window.cancelAnimationFrame(scrollFrame);
        scrollFrame = window.requestAnimationFrame(() => window.scrollTo(0, 0));
      }
    };

    syncBattleViewport();
    viewport?.addEventListener("resize", syncBattleViewport);
    viewport?.addEventListener("scroll", syncBattleViewport);
    window.addEventListener("resize", syncBattleViewport);
    battleInput?.addEventListener("focus", syncBattleViewport);
    battleInput?.addEventListener("blur", syncBattleViewport);

    return () => {
      window.cancelAnimationFrame(scrollFrame);
      viewport?.removeEventListener("resize", syncBattleViewport);
      viewport?.removeEventListener("scroll", syncBattleViewport);
      window.removeEventListener("resize", syncBattleViewport);
      battleInput?.removeEventListener("focus", syncBattleViewport);
      battleInput?.removeEventListener("blur", syncBattleViewport);
      delete root.dataset.battleKeyboard;
      root.style.removeProperty("--battle-viewport-height");
      root.style.removeProperty("--battle-viewport-top");
    };
  }, [practiceMode, view]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("bible-typing-theme");
    const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    // Hydrate the existing persisted preference after the client mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(savedTheme === "dark" || (!savedTheme && preferredDark) ? "dark" : "light");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("bible-typing-theme", theme);
  }, [theme]);

  useEffect(() => {
    const savedVisualTheme = window.localStorage.getItem(VISUAL_THEME_STORAGE_KEY);
    // Match the existing light/dark preference hydration pattern without changing its storage behavior.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedVisualTheme === "type-console") setVisualTheme("type-console");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.visualTheme = visualTheme;
    window.localStorage.setItem(VISUAL_THEME_STORAGE_KEY, visualTheme);
  }, [visualTheme]);

  useEffect(() => {
    window.localStorage.setItem(BATTLE_FIGHTER_STORAGE_KEY, selectedFighterId);
  }, [selectedFighterId]);

  useEffect(() => {
    window.localStorage.setItem(BATTLE_CAMPAIGN_STORAGE_KEY, JSON.stringify(battleCampaign));
  }, [battleCampaign]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const bibleResponse = await fetch("/data/bible.json");
        if (!bibleResponse.ok) throw new Error("성경 데이터를 읽지 못했습니다.");
        const bibleData = await bibleResponse.json() as BibleData;

        let local = emptyProgress();
        try {
          const cached = window.localStorage.getItem(STORAGE_KEY);
          if (cached) local = { ...local, ...JSON.parse(cached) } as ProgressState;
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }

        if (!cancelled) {
          const nextProgress = local;
          setBible(bibleData);
          setProgress(nextProgress);
          setCurrentIndex(Math.min(nextProgress.currentIndex, bibleData.units.length - 1));
        }
      } catch (error) {
        if (!cancelled) setLoadingError(error instanceof Error ? error.message : "앱을 준비하지 못했습니다.");
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!playerSession) return;

    let cancelled = false;
    const headers = playerRequestHeaders(playerSession);
    Promise.all([
      fetch("/api/player", { headers, cache: "no-store" }),
      fetch("/api/progress", { headers, cache: "no-store" }),
    ]).then(async ([playerResponse, progressResponse]) => {
      if (playerResponse.status === 401 || progressResponse.status === 401) {
        window.localStorage.removeItem(PLAYER_SESSION_STORAGE_KEY);
        if (!cancelled) {
          setPlayerSession(null);
          setPlayerSummary(null);
          setSyncStatus("기기 저장");
          setAccountMessage("이 기기의 선수 인증이 만료되어 기록 모드가 해제됐습니다.");
        }
        return;
      }
      if (playerResponse.ok) {
        const payload = await playerResponse.json() as { player: PlayerSummary };
        if (!cancelled) setPlayerSummary(payload.player);
      }
      if (progressResponse.ok) {
        const remote = await progressResponse.json() as Partial<ProgressState>;
        if (!cancelled) {
          setProgress((local) => mergeProgress(local, remote));
          setSyncStatus("기록 모드");
        }
      }
    }).catch(() => {
      if (!cancelled) setSyncStatus("기기 저장");
    });

    return () => { cancelled = true; };
  }, [playerSession]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/leaderboard?scope=${rankingScope}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("랭킹을 불러오지 못했습니다.");
        const payload = await response.json() as { entries: LeaderboardEntry[] };
        if (!cancelled) setLeaderboard(payload.entries);
      })
      .catch(() => {
        if (!cancelled) setLeaderboard([]);
      })
      .finally(() => {
        if (!cancelled) setLeaderboardBusy(false);
      });
    return () => { cancelled = true; };
  }, [rankingScope, playerSummary?.totalScore]);

  useEffect(() => {
    if (!bible) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [bible, progress]);

  useEffect(() => {
    if (!startedAt || result) return;
    const timer = window.setInterval(() => setClock(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [result, startedAt]);

  const booksByCode = useMemo(
    () => new Map(bible?.books.map((book) => [book.code, book]) ?? []),
    [bible],
  );
  const unitById = useMemo(
    () => new Map(bible?.units.map((unit) => [unit.id, unit]) ?? []),
    [bible],
  );
  const indicesByBook = useMemo(() => {
    const map = new Map<string, number[]>();
    bible?.units.forEach((unit, index) => {
      const indices = map.get(unit.b) ?? [];
      indices.push(index);
      map.set(unit.b, indices);
    });
    return map;
  }, [bible]);

  const completedSet = useMemo(() => new Set(progress.completedIds), [progress.completedIds]);
  const completedVerses = useMemo(
    () => progress.completedIds.reduce((sum, id) => sum + (unitById.get(id)?.w ?? 0), 0),
    [progress.completedIds, unitById],
  );
  const overallPercent = bible ? (completedVerses / bible.totalVerses) * 100 : 0;
  const today = progress.days.find((day) => day.date === localDateKey());
  const todayCompleted = today?.versesCompleted ?? 0;
  const streak = calculateStreak(progress.days);
  const averageAccuracy = progress.totalTypedChars
    ? (progress.correctChars / progress.totalTypedChars) * 100
    : 0;
  const currentUnit = bible?.units[currentIndex];
  const currentBook = currentUnit ? booksByCode.get(currentUnit.b) : undefined;
  const homeUnit = bible?.units[progress.currentIndex] ?? bible?.units[0];
  const homeBook = homeUnit ? booksByCode.get(homeUnit.b) : undefined;
  const selectedFighter = BATTLE_FIGHTERS.find((fighter) => fighter.id === selectedFighterId) ?? BATTLE_FIGHTERS[0];
  const selectedFighterNumber = BATTLE_FIGHTERS.findIndex((fighter) => fighter.id === selectedFighter.id) + 1;
  const fighterCampaign = battleCampaign[selectedFighter.id];
  const unlockedBattleStage = highestUnlockedStage(fighterCampaign);
  const activeBattleStage = BATTLE_STAGES[selectedBattleStage - 1] ?? BATTLE_STAGES[0];
  const battlePlayerMaxHp = 100 + ((fighterCampaign.level - 1) * 7) + ((fighterCampaign.weaponLevel - 1) * 3);
  const battleStartUnit = bible?.units[battleStartIndex];
  const battleStartBook = battleStartUnit ? booksByCode.get(battleStartUnit.b) : undefined;
  const elapsedSeconds = startedAt ? Math.max(0.1, (clock - startedAt) / 1000) : 0;
  const liveCorrectKeystrokes = Math.max(0, keystrokes - errors);
  const liveCpm = startedAt ? Math.round((liveCorrectKeystrokes / elapsedSeconds) * 60) : 0;
  const liveAccuracy = keystrokes ? Math.max(0, ((keystrokes - errors) / keystrokes) * 100) : 100;
  const verseProgress = currentUnit ? Math.min(1, typed.length / Math.max(1, currentUnit.t.length)) : 0;
  const activeSegment = Math.min(10, Math.floor(verseProgress * 10) + 1);
  const consoleWords = useMemo<WordRange[]>(() => {
    if (!currentUnit) return [];
    return Array.from(currentUnit.t.matchAll(/\S+/g)).map((match) => ({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    }));
  }, [currentUnit]);
  const activeConsoleWordIndex = Math.max(0, consoleWords.findIndex((word) => typed.length <= word.end));
  const visibleConsoleWords = consoleWords.slice(activeConsoleWordIndex, activeConsoleWordIndex + 5);
  let currentCombo = 0;
  if (currentUnit) {
    for (let index = 0; index < typed.length; index += 1) {
      currentCombo = typed[index] === currentUnit.t[index] ? currentCombo + 1 : 0;
    }
  }
  const battleHealth = result
    ? 0
    : Math.max(0, Math.round((battleEnemyHp / Math.max(1, activeBattleStage.maxHealth)) * 100));
  const battleScore = Math.max(0, (liveCorrectKeystrokes * 120) + (currentCombo * 25) - (errors * 80));
  const battlePower = currentCombo >= 20 ? "MAX" : currentCombo >= 8 ? "강화" : `무기 ${fighterCampaign.weaponLevel}`;

  const bookProgress = useMemo(() => {
    const map = new Map<string, { completed: number; percent: number }>();
    for (const book of bible?.books ?? []) {
      const completed = (indicesByBook.get(book.code) ?? []).reduce((sum, index) => {
        const unit = bible?.units[index];
        return sum + (unit && completedSet.has(unit.id) ? unit.w : 0);
      }, 0);
      map.set(book.code, { completed, percent: book.verses ? (completed / book.verses) * 100 : 0 });
    }
    return map;
  }, [bible, completedSet, indicesByBook]);

  const resetPractice = useCallback(() => {
    setTyped("");
    setStartedAt(null);
    setClock(Date.now());
    setKeystrokes(0);
    setErrors(0);
    setResult(null);
    setBattleFeedback(null);
    startedAtRef.current = null;
    keystrokesRef.current = 0;
    errorsRef.current = 0;
    isComposingRef.current = false;
    compositionBaseRef.current = "";
    completionLockRef.current = false;
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }, []);

  const openPractice = useCallback((index: number, startsNewSession: boolean, mode?: PracticeMode) => {
    if (!bible) return;
    const safeIndex = Math.max(0, Math.min(index, bible.units.length - 1));
    if (startsNewSession) sessionResultShownRef.current = false;
    if (mode) setPracticeMode(mode);
    setCurrentIndex(safeIndex);
    setProgress((previous) => ({ ...previous, currentIndex: safeIndex }));
    setView("practice");
    resetPractice();
  }, [bible, resetPractice]);

  const beginPractice = useCallback((index: number) => {
    openPractice(index, true, "standard");
  }, [openPractice]);

  const beginBattle = useCallback((index: number) => {
    if (!bible) return;
    setBattleStartIndex(Math.max(0, Math.min(index, bible.units.length - 1)));
    setView("battle-select");
  }, [bible]);

  const startSelectedBattle = useCallback(() => {
    setSelectedBattleStage(highestUnlockedStage(battleCampaign[selectedFighterId]));
    setView("battle-map");
  }, [battleCampaign, selectedFighterId]);

  const startBattleStage = useCallback((stageNumber: number) => {
    if (!bible || stageNumber < 1 || stageNumber > unlockedBattleStage) return;
    const stage = BATTLE_STAGES[stageNumber - 1];
    const verseIndex = (battleStartIndex + ((stageNumber - 1) * 37)) % bible.units.length;
    setSelectedBattleStage(stageNumber);
    setBattleEnemyHp(stage.maxHealth);
    setBattlePlayerHp(battlePlayerMaxHp);
    setBattleDefeated(false);
    setBattleReward(null);
    battleEnemyHpRef.current = stage.maxHealth;
    battlePlayerHpRef.current = battlePlayerMaxHp;
    battleRewardedRef.current = false;
    openPractice(verseIndex, true, "battle");
  }, [battlePlayerMaxHp, battleStartIndex, bible, openPractice, unlockedBattleStage]);

  const openBattleMap = useCallback(() => {
    setBattleDefeated(false);
    setBattleFeedback(null);
    setView("battle-map");
  }, []);

  const continuePractice = useCallback((index: number) => {
    openPractice(index, false);
  }, [openPractice]);

  const beginBook = useCallback((book: BibleBook) => {
    const indices = indicesByBook.get(book.code) ?? [];
    const firstIncomplete = indices.find((index) => bible && !completedSet.has(bible.units[index].id));
    beginPractice(firstIncomplete ?? indices[0] ?? 0);
  }, [beginPractice, bible, completedSet, indicesByBook]);

  async function createPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (accountBusy) return;
    setAccountBusy(true);
    setAccountMessage("");
    try {
      const response = await fetch("/api/player", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: playerIdDraft }),
      });
      const payload = await response.json() as { player?: PlayerSummary; token?: string; error?: string };
      if (!response.ok || !payload.player || !payload.token) {
        throw new Error(payload.error ?? "아이디를 만들지 못했습니다.");
      }
      const session = { id: payload.player.id, token: payload.token };
      window.localStorage.setItem(PLAYER_SESSION_STORAGE_KEY, JSON.stringify(session));
      setPlayerSession(session);
      setPlayerSummary(payload.player);
      setPlayerIdDraft("");
      setSyncStatus("기록 모드");
      setAccountMessage(`${payload.player.id} 아이디로 기록 모드가 시작됐습니다.`);
    } catch (error) {
      setAccountMessage(error instanceof Error ? error.message : "아이디를 만들지 못했습니다.");
    } finally {
      setAccountBusy(false);
    }
  }

  const finishPractice = useCallback((finalKeystrokes: number, finalErrors: number, start: number, finalCombo: number) => {
    if (!bible || !currentUnit || result || completionLockRef.current) return;
    completionLockRef.current = true;
    const durationSeconds = Math.max(0.1, (Date.now() - start) / 1000);
    const correctKeystrokes = Math.max(0, finalKeystrokes - finalErrors);
    const cpm = Math.round((correctKeystrokes / durationSeconds) * 60);
    const accuracy = Math.max(0, Number(((correctKeystrokes / Math.max(1, finalKeystrokes)) * 100).toFixed(1)));
    const nextIndex = (currentIndex + 1) % bible.units.length;
    const isNew = !completedSet.has(currentUnit.id);
    const completedAt = new Date().toISOString();
    const session: SessionResult = {
      verseId: currentUnit.id,
      bookCode: currentUnit.b,
      cpm,
      accuracy,
      durationSeconds,
      completedAt,
      isNew,
      mode: practiceMode,
    };

    const shouldShowResult = !sessionResultShownRef.current;
    if (shouldShowResult) {
      sessionResultShownRef.current = true;
      setResult(session);
      setClock(Date.now());
    }
    setProgress((previous) => {
      const ids = isNew ? [...previous.completedIds, currentUnit.id] : previous.completedIds;
      const dayKey = localDateKey();
      const days = [...previous.days];
      const dayIndex = days.findIndex((day) => day.date === dayKey);
      const dayValue = dayIndex >= 0 ? days[dayIndex] : { date: dayKey, versesCompleted: 0, sessions: 0 };
      const updatedDay = {
        ...dayValue,
        versesCompleted: dayValue.versesCompleted + currentUnit.w,
        sessions: dayValue.sessions + 1,
      };
      if (dayIndex >= 0) days[dayIndex] = updatedDay;
      else days.unshift(updatedDay);

      return {
        ...previous,
        completedIds: ids,
        currentIndex: nextIndex,
        totalSessions: previous.totalSessions + 1,
        totalTypedChars: previous.totalTypedChars + finalKeystrokes,
        correctChars: previous.correctChars + Math.max(0, finalKeystrokes - finalErrors),
        bestCpm: Math.max(previous.bestCpm, cpm),
        bestAccuracy: Math.max(previous.bestAccuracy, accuracy),
        days,
        recent: [session, ...previous.recent].slice(0, 12),
      };
    });

    if (playerSession) {
      setSyncStatus("점수 계산 중");
      void fetch("/api/progress", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...playerRequestHeaders(playerSession),
        },
        body: JSON.stringify({
          verseId: currentUnit.id,
          bookCode: currentUnit.b,
          weight: currentUnit.w,
          cpm,
          accuracy,
          durationSeconds,
          typedChars: finalKeystrokes,
          correctChars: Math.max(0, finalKeystrokes - finalErrors),
          currentIndex: nextIndex,
          localDate: localDateKey(),
          mode: practiceMode,
          combo: finalCombo,
          stageId: practiceMode === "battle" ? activeBattleStage.id : undefined,
        }),
      }).then(async (response) => {
        const payload = await response.json() as { score?: number; player?: PlayerSummary };
        if (!response.ok || payload.score === undefined || !payload.player) {
          setSyncStatus("기기 저장");
          setResult((previous) => previous?.completedAt === completedAt ? { ...previous, scoreError: true } : previous);
          return;
        }
        setPlayerSummary(payload.player);
        setResult((previous) => previous?.completedAt === completedAt ? { ...previous, score: payload.score } : previous);
        setSyncStatus("기록 모드");
      }).catch(() => {
        setSyncStatus("기기 저장");
        setResult((previous) => previous?.completedAt === completedAt ? { ...previous, scoreError: true } : previous);
      });
    } else {
      setSyncStatus("기기 저장");
    }

    if (navigator.vibrate) navigator.vibrate([25, 35, 25]);
    if (!shouldShowResult) continuePractice(nextIndex);
  }, [activeBattleStage.id, bible, completedSet, continuePractice, currentIndex, currentUnit, playerSession, practiceMode, result]);

  useEffect(() => {
    if (!result || practiceMode !== "battle" || battleRewardedRef.current) return;
    battleRewardedRef.current = true;
    const firstClear = !fighterCampaign.clearedStages.includes(activeBattleStage.id);
    const outcome = grantCampaignRewards(fighterCampaign, activeBattleStage, firstClear);
    setBattleCampaign((previous) => ({ ...previous, [selectedFighter.id]: outcome.progress }));
    setBattleReward(outcome.reward);
    setBattleEnemyHp(0);
    battleEnemyHpRef.current = 0;
  }, [activeBattleStage, fighterCampaign, practiceMode, result, selectedFighter.id]);

  const applyTypedValue = useCallback((value: string, baseline: string) => {
    if (!currentUnit || result || battleDefeated) return;
    const nextValue = value.slice(0, currentUnit.t.length);
    let start = startedAtRef.current;
    if (!start && nextValue.length > 0) {
      start = Date.now();
      startedAtRef.current = start;
      setStartedAt(start);
      setClock(start);
    }

    let nextKeystrokes = keystrokesRef.current;
    let nextErrors = errorsRef.current;
    let newestFeedback: "hit" | "miss" | null = null;
    let correctAdded = 0;
    let errorsAdded = 0;
    if (nextValue.length > baseline.length) {
      for (let index = baseline.length; index < nextValue.length; index += 1) {
        nextKeystrokes += 1;
        if (nextValue[index] !== currentUnit.t[index]) {
          nextErrors += 1;
          errorsAdded += 1;
          newestFeedback = "miss";
        } else {
          correctAdded += 1;
          newestFeedback = "hit";
        }
      }
      keystrokesRef.current = nextKeystrokes;
      errorsRef.current = nextErrors;
      setKeystrokes(nextKeystrokes);
      setErrors(nextErrors);

      if (practiceMode === "battle" && newestFeedback) {
        if (correctAdded > 0) {
          const damagePerCharacter = Math.max(
            1,
            Math.ceil(activeBattleStage.maxHealth / Math.max(1, currentUnit.t.length))
              + Math.floor(fighterCampaign.level / 6)
              + fighterCampaign.weaponLevel,
          );
          const enemyHp = Math.max(0, battleEnemyHpRef.current - (correctAdded * damagePerCharacter));
          battleEnemyHpRef.current = enemyHp;
          setBattleEnemyHp(enemyHp);
        }
        if (errorsAdded > 0) {
          const armorReduction = Math.floor((fighterCampaign.level - 1) / 7) + Math.floor((fighterCampaign.weaponLevel - 1) / 3);
          const receivedDamage = Math.max(2, activeBattleStage.missDamage - armorReduction) * errorsAdded;
          const playerHp = Math.max(0, battlePlayerHpRef.current - receivedDamage);
          battlePlayerHpRef.current = playerHp;
          setBattlePlayerHp(playerHp);
          if (playerHp === 0) setBattleDefeated(true);
        }
        let nextCombo = 0;
        for (let index = 0; index < nextValue.length; index += 1) {
          nextCombo = nextValue[index] === currentUnit.t[index] ? nextCombo + 1 : 0;
        }
        battleFeedbackIdRef.current += 1;
        setBattleFeedback({
          id: battleFeedbackIdRef.current,
          kind: newestFeedback,
          strength: nextCombo >= 20 ? 3 : nextCombo >= 8 ? 2 : 1,
        });
      }
    }

    setTyped(nextValue);
    if (start && nextValue.length === currentUnit.t.length && battlePlayerHpRef.current > 0) {
      let finalCombo = 0;
      for (let index = 0; index < nextValue.length; index += 1) {
        finalCombo = nextValue[index] === currentUnit.t[index] ? finalCombo + 1 : 0;
      }
      finishPractice(nextKeystrokes, nextErrors, start, finalCombo);
    }
  }, [activeBattleStage, battleDefeated, currentUnit, fighterCampaign.level, fighterCampaign.weaponLevel, finishPractice, practiceMode, result]);

  function handleInput(event: ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    if (isComposingRef.current) {
      setTyped(value.slice(0, currentUnit?.t.length ?? value.length));
      return;
    }
    applyTypedValue(value, typed);
  }

  function goToNext() {
    if (!bible) return;
    continuePractice((currentIndex + 1) % bible.units.length);
  }

  function getRandomIndex() {
    if (!bible) return;
    let index = Math.floor(Math.random() * bible.units.length);
    if (index === currentIndex) index = (index + 1) % bible.units.length;
    return index;
  }

  function startRandomPractice() {
    const index = getRandomIndex();
    if (index !== undefined) beginPractice(index);
  }

  function goRandom() {
    const index = getRandomIndex();
    if (index !== undefined) continuePractice(index);
  }

  function continueBattleCampaign() {
    if (activeBattleStage.id >= 25) openBattleMap();
    else startBattleStage(activeBattleStage.id + 1);
  }

  useEffect(() => {
    if (visualTheme !== "type-console" && view !== "battle-select" && view !== "battle-map" && !(practiceMode === "battle" && view === "practice")) return;

    function handleConsoleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isInteractive = target?.matches("input, textarea, select, button, a, [contenteditable='true']") ?? false;

      if (event.key === "Escape" && (view === "practice" || view === "battle-select" || view === "battle-map")) {
        event.preventDefault();
        if (view === "practice" && practiceMode === "battle") openBattleMap();
        else if (view === "battle-map") setView("battle-select");
        else setView("home");
        return;
      }

      if (view === "battle-select" && event.key === "Enter" && !isInteractive) {
        event.preventDefault();
        startSelectedBattle();
        return;
      }

      if (view === "battle-map" && !isInteractive) {
        if (event.key === "Enter") {
          event.preventDefault();
          startBattleStage(selectedBattleStage);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const direction = event.key === "ArrowRight" ? 1 : -1;
          setSelectedBattleStage((stage) => Math.max(1, Math.min(unlockedBattleStage, stage + direction)));
        }
        return;
      }

      if (visualTheme !== "type-console") return;
      if (view !== "home" || isInteractive || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Enter") {
        event.preventDefault();
        beginPractice(progress.currentIndex);
      } else if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        if (!bible) return;
        let index = Math.floor(Math.random() * bible.units.length);
        if (index === currentIndex) index = (index + 1) % bible.units.length;
        beginPractice(index);
      } else if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        beginBattle(progress.currentIndex);
      }
    }

    window.addEventListener("keydown", handleConsoleShortcut);
    return () => window.removeEventListener("keydown", handleConsoleShortcut);
  }, [beginBattle, beginPractice, bible, currentIndex, openBattleMap, practiceMode, progress.currentIndex, selectedBattleStage, startBattleStage, startSelectedBattle, unlockedBattleStage, visualTheme, view]);

  const achievements = [
    { title: "첫 문장", description: "첫 구절을 완주했어요", unlocked: completedVerses >= 1, mark: "01" },
    { title: "열 걸음", description: "성경 10절을 따라 썼어요", unlocked: completedVerses >= 10, mark: "10" },
    { title: "정확한 손", description: "정확도 95%를 달성했어요", unlocked: progress.bestAccuracy >= 95, mark: "A+" },
    { title: "백 절의 길", description: "성경 100절을 완주했어요", unlocked: completedVerses >= 100, mark: "100" },
    { title: "꾸준한 사흘", description: "3일 연속 연습했어요", unlocked: streak >= 3, mark: "3D" },
    { title: "천 절의 숲", description: "성경 1,000절을 완주했어요", unlocked: completedVerses >= 1000, mark: "1K" },
  ];
  const unlockedCount = achievements.filter((item) => item.unlocked).length;

  if (loadingError) {
    return (
      <main className="loading-screen">
        <div className="loading-mark">말씀</div>
        <h1>성경 데이터를 열지 못했습니다.</h1>
        <p>{loadingError}</p>
        <button className="button button--primary" onClick={() => window.location.reload()}>다시 불러오기</button>
      </main>
    );
  }

  if (!bible) {
    return (
      <main className="loading-screen" aria-live="polite">
        <div className="loading-mark loading-mark--pulse">말씀</div>
        <h1>말씀을 펼치는 중</h1>
        <p>66권의 타자연습을 준비하고 있어요.</p>
      </main>
    );
  }

  const navItems: { id: View; label: string; short: string }[] = [
    { id: "home", label: "오늘", short: "오늘" },
    { id: "library", label: "성경 선택", short: "성경" },
    { id: "progress", label: "나의 기록", short: "기록" },
    { id: "ranking", label: "랭킹", short: "랭킹" },
  ];

  return (
    <div className={`app-frame app-frame--${view} ${view === "practice" || view === "battle-select" || view === "battle-map" ? "app-frame--practice" : ""} visual-theme--${visualTheme}`}>
      <aside className="sidebar">
        <button className="brand" onClick={() => setView("home")} aria-label="말씀타자 홈">
          <span className="brand__wordmark">말씀타자</span>
        </button>

        <nav className="side-nav" aria-label="주요 메뉴">
          {navItems.map((item, index) => (
            <button
              key={item.id}
              className={view === item.id ? "is-active" : ""}
              onClick={() => setView(item.id)}
              aria-current={view === item.id ? "page" : undefined}
            >
              <span>{`${index + 1}`.padStart(2, "0")}</span>{item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className={`player-status ${playerSummary ? "is-recording" : ""}`} onClick={() => setView("ranking")}>
            <span>{playerSummary ? "기록 모드 ON" : "기록 모드 OFF"}</span>
            <strong>{playerSummary ? `${playerSummary.id} · #${playerSummary.rank}` : "선수 아이디 만들기"}</strong>
          </button>
          <ThemeFamilyPicker value={visualTheme} onChange={setVisualTheme} />
          <button
            className="theme-switch"
            onClick={() => setTheme((value) => value === "light" ? "dark" : "light")}
            aria-label={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
          >
            {theme === "light" ? <MoonIcon size={18} aria-hidden="true" /> : <SunIcon size={18} aria-hidden="true" />}
            {theme === "light" ? "다크 모드" : "라이트 모드"}
          </button>
          <small><span className={`sync-dot ${syncStatus === "동기화됨" ? "is-synced" : ""}`} />{syncStatus}</small>
        </div>
      </aside>

      <div className="workspace">
        {visualTheme === "type-console" && view !== "practice" && view !== "battle-select" && view !== "battle-map" && (
          <header className="console-topbar">
            <button className="console-wordmark" onClick={() => setView("home")} aria-label="말씀타자 홈">말씀타자</button>
            <nav className="console-topbar__nav" aria-label="활자 콘솔 주요 메뉴">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={view === item.id ? "is-active" : ""}
                  onClick={() => setView(item.id)}
                  aria-current={view === item.id ? "page" : undefined}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="console-topbar__meta">
              <span>{formatToday()}</span>
              <button className={`console-player-status ${playerSummary ? "is-recording" : ""}`} onClick={() => setView("ranking")}>
                {playerSummary ? `${playerSummary.id} #${playerSummary.rank}` : "아이디 만들기"}
              </button>
              <ThemeFamilyPicker value={visualTheme} onChange={setVisualTheme} compact />
              <button
                className="console-mode-switch"
                onClick={() => setTheme((value) => value === "light" ? "dark" : "light")}
                aria-label={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
              >
                {theme === "light" ? "밝게" : "어둡게"}
                {theme === "light" ? <SunIcon size={19} aria-hidden="true" /> : <MoonIcon size={19} aria-hidden="true" />}
              </button>
            </div>
            <button
              className="console-menu-button"
              onClick={() => setMobileMenuOpen((value) => !value)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            >
              {mobileMenuOpen ? <XIcon size={28} aria-hidden="true" /> : <ListIcon size={29} aria-hidden="true" />}
            </button>
            {mobileMenuOpen && (
              <div className="console-mobile-menu">
                <nav aria-label="활자 콘솔 모바일 메뉴">
                  {navItems.map((item) => (
                    <button key={item.id} className={view === item.id ? "is-active" : ""} onClick={() => { setView(item.id); setMobileMenuOpen(false); }}>
                      {item.label}
                    </button>
                  ))}
                </nav>
                <ThemeFamilyPicker value={visualTheme} onChange={(value) => { setVisualTheme(value); setMobileMenuOpen(false); }} compact />
                <button className="console-mobile-mode" onClick={() => { setTheme((value) => value === "light" ? "dark" : "light"); setMobileMenuOpen(false); }}>
                  {theme === "light" ? <MoonIcon size={18} aria-hidden="true" /> : <SunIcon size={18} aria-hidden="true" />}
                  {theme === "light" ? "다크 모드" : "라이트 모드"}
                </button>
              </div>
            )}
          </header>
        )}
        <header className="mobile-header">
          <div className="mobile-header__top">
            <button className="brand" onClick={() => setView("home")} aria-label="말씀타자 홈">
              <span className="brand__wordmark">말씀타자</span>
            </button>
            <button
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen((value) => !value)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            >
              {mobileMenuOpen ? <XIcon size={29} aria-hidden="true" /> : <ListIcon size={31} aria-hidden="true" />}
            </button>
          </div>
          <nav className="mobile-tabs" aria-label="모바일 주요 메뉴">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={view === item.id ? "is-active" : ""}
                onClick={() => { setView(item.id); setMobileMenuOpen(false); }}
                aria-current={view === item.id ? "page" : undefined}
              >
                {item.label}
              </button>
            ))}
          </nav>
          {mobileMenuOpen && (
            <div className="mobile-menu-panel">
              <ThemeFamilyPicker value={visualTheme} onChange={(value) => { setVisualTheme(value); setMobileMenuOpen(false); }} compact />
              <button onClick={() => { setTheme((value) => value === "light" ? "dark" : "light"); setMobileMenuOpen(false); }}>
                {theme === "light" ? <MoonIcon size={18} aria-hidden="true" /> : <SunIcon size={18} aria-hidden="true" />}
                {theme === "light" ? "다크 모드로 보기" : "라이트 모드로 보기"}
              </button>
              <span><i className={`sync-dot ${syncStatus === "동기화됨" ? "is-synced" : ""}`} />{syncStatus}</span>
            </div>
          )}
        </header>

        <main className="main-content">
          {view === "home" && (
            <div className="page page--home">
              {visualTheme === "type-console" ? (
                <section className="console-home">
                  <aside className="console-home__index" aria-label={`오늘 ${todayCompleted}/${progress.dailyGoal}절`}>
                    <div>
                      <strong>{`${todayCompleted}`.padStart(2, "0")}</strong>
                      <span>/ {progress.dailyGoal} 오늘</span>
                    </div>
                    <ArrowRightIcon size={48} weight="light" aria-hidden="true" />
                  </aside>
                  <div className="console-home__body">
                    <div className="console-home__headline">
                      <h1><span>읽고,</span><span>따라 쓰며,</span></h1>
                    </div>
                    <div className="console-home__band">마음에 오래.</div>
                    <div className="console-home__lower">
                      <article className="console-home__verse">
                        {homeUnit && <h2>{referenceFor(homeUnit, homeBook)}</h2>}
                        {homeUnit && <p>{homeUnit.t}</p>}
                      </article>
                      <section className="console-home__commands" aria-label="연습 명령">
                        <button onClick={() => beginPractice(progress.currentIndex)} aria-keyshortcuts="Enter">
                          <small>[ ENTER ]</small>
                          <strong>이어서 연습</strong>
                        </button>
                        <div className="console-command-secondary">
                          <button className="console-random-command" onClick={startRandomPractice} aria-keyshortcuts="R">
                            <b>R</b> 무작위 한 절
                          </button>
                          <button className="console-battle-command" onClick={() => beginBattle(progress.currentIndex)} aria-keyshortcuts="B">
                            <b>B</b> 말씀 전투
                          </button>
                        </div>
                      </section>
                    </div>
                    <section className="console-home__ticker" aria-label="연습 요약">
                      <span>진도 <strong>{formatNumber(completedVerses)}</strong>/{formatNumber(bible.totalVerses)}절</span>
                      <i aria-hidden="true" />
                      <span>정확도 <strong>{averageAccuracy ? averageAccuracy.toFixed(1) : "—"}</strong>{averageAccuracy ? "%" : ""}</span>
                      <i aria-hidden="true" />
                      <span>최고 <strong>{progress.bestCpm || "—"}</strong>{progress.bestCpm ? "타/분" : ""}</span>
                    </section>
                  </div>
                </section>
              ) : (
                <section className="home-editorial">
                  <p className="home-date">{formatToday()}</p>

                  <div className="home-feature">
                    <div className="home-feature__copy">
                      <span className="home-kicker">오늘의 말씀</span>
                      <h1>읽고, 따라 쓰며,<br />마음에 오래.</h1>
                      {homeUnit && <p className="home-reference">{referenceFor(homeUnit, homeBook)}</p>}
                      {homeUnit && <p className="home-verse-preview">{homeUnit.t}</p>}
                      <span className="home-accent-line" aria-hidden="true" />
                      <div className="home-actions">
                        <button className="home-primary" onClick={() => beginPractice(progress.currentIndex)}>
                          이어서 연습하기 <ArrowRightIcon size={21} weight="regular" aria-hidden="true" />
                        </button>
                        <button className="home-random" onClick={startRandomPractice}>한 절 무작위</button>
                        <button className="home-battle" onClick={() => beginBattle(progress.currentIndex)}>말씀 전투</button>
                      </div>
                    </div>

                    <div className="home-goal" aria-label={`오늘 ${todayCompleted}/${progress.dailyGoal}절`}>
                      <p>오늘 <strong>{todayCompleted}/{progress.dailyGoal}</strong></p>
                      <ol>
                        {Array.from({ length: progress.dailyGoal }, (_, index) => (
                          <li className={index < todayCompleted ? "is-complete" : ""} key={index + 1}>
                            <span>{index + 1}</span><i />
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <section className="home-summary" aria-label="연습 요약">
                    <div><span>전체 진도</span><strong>{formatNumber(completedVerses)}<small>/{formatNumber(bible.totalVerses)}절</small></strong></div>
                    <div><span>평균 정확도</span><strong>{averageAccuracy ? averageAccuracy.toFixed(1) : "—"}<small>{averageAccuracy ? "%" : ""}</small></strong></div>
                    <div><span>최고 타수</span><strong>{progress.bestCpm || "—"}<small>{progress.bestCpm ? "타/분" : ""}</small></strong></div>
                  </section>
                </section>
              )}
            </div>
          )}

          {view === "battle-select" && (
            <div className="page page--battle-select">
              <section
                className="fighter-select"
                style={{ "--fighter-accent": selectedFighter.accent } as CSSProperties}
                aria-labelledby="fighter-select-title"
              >
                <header className="fighter-select__header">
                  <button onClick={() => setView("home")} aria-keyshortcuts="Escape">[ ESC ] 돌아가기</button>
                  <div>
                    <span>말씀 전투 / 전투원 선택</span>
                    <strong>{battleStartUnit ? referenceFor(battleStartUnit, battleStartBook) : "오늘의 말씀"}</strong>
                  </div>
                  <p><strong>{`${selectedFighterNumber}`.padStart(2, "0")}</strong> / {`${BATTLE_FIGHTERS.length}`.padStart(2, "0")}</p>
                </header>

                <div className="fighter-select__stage">
                  <div className="fighter-select__copy">
                    <span className="fighter-select__eyebrow">SELECT YOUR FIGHTER</span>
                    <h1 id="fighter-select-title">누구와 함께<br />싸울까요?</h1>
                    <div className="fighter-select__identity" aria-live="polite">
                      <small>{selectedFighter.title}</small>
                      <h2>{selectedFighter.name}</h2>
                      <p>{selectedFighter.role} / {selectedFighter.weapon} · {selectedFighter.tagline}</p>
                    </div>
                    <div className="fighter-select__lore" aria-live="polite">
                      <p>{selectedFighter.story}</p>
                      <div className="fighter-select__personality">
                        <span>성격</span><strong>{selectedFighter.personality}</strong>
                      </div>
                      <div className="fighter-select__traits" aria-label={`${selectedFighter.name}의 특징`}>
                        {selectedFighter.traits.map((trait, index) => (
                          <span key={trait}><b>{`${index + 1}`.padStart(2, "0")}</b>{trait}</span>
                        ))}
                      </div>
                      <blockquote>“{selectedFighter.motto}”</blockquote>
                    </div>
                    <button className="fighter-select__start" onClick={startSelectedBattle} aria-keyshortcuts="Enter">
                      <span>[ ENTER ]</span>
                      이 전투원으로 작전 선택
                      <ArrowRightIcon size={22} weight="bold" aria-hidden="true" />
                    </button>
                  </div>

                  <div className={`fighter-select__portrait fighter-select__portrait--${selectedFighter.id}`} key={selectedFighter.id} aria-hidden="true">
                    <span className="fighter-select__index">{`${selectedFighterNumber}`.padStart(2, "0")}</span>
                    <Image
                      src={selectedFighter.asset}
                      width={selectedFighter.width}
                      height={selectedFighter.height}
                      sizes="(max-width: 820px) 92vw, 48vw"
                      priority
                      alt=""
                    />
                    <i />
                  </div>
                </div>

                <div className="fighter-select__roster" role="group" aria-label="전투원 목록">
                  {BATTLE_FIGHTERS.map((fighter, index) => (
                    <button
                      type="button"
                      className={fighter.id === selectedFighter.id ? "is-selected" : ""}
                      onClick={() => setSelectedFighterId(fighter.id)}
                      aria-pressed={fighter.id === selectedFighter.id}
                      key={fighter.id}
                    >
                      <span className="fighter-select__thumb">
                        <Image src={fighter.asset} width={fighter.width} height={fighter.height} sizes="120px" alt="" />
                      </span>
                      <span className="fighter-select__roster-copy">
                        <small>{`${index + 1}`.padStart(2, "0")} / {fighter.role}</small>
                        <strong>{fighter.name}</strong>
                        <em>LV.{battleCampaign[fighter.id].level} · 무기 {battleCampaign[fighter.id].weaponLevel}</em>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {view === "battle-map" && (
            <div className="page page--battle-map">
              <section
                className="campaign-map"
                style={{ "--fighter-accent": selectedFighter.accent } as CSSProperties}
                aria-labelledby="campaign-map-title"
              >
                <header className="campaign-map__header">
                  <button onClick={() => setView("battle-select")} aria-keyshortcuts="Escape">[ ESC ] 전투원 변경</button>
                  <div>
                    <span>25 STAGE CAMPAIGN</span>
                    <strong>{selectedFighter.name} · {selectedFighter.weapon}</strong>
                  </div>
                  <p>완료 <strong>{fighterCampaign.clearedStages.length}</strong> / 25</p>
                </header>

                <div className="campaign-map__body">
                  <div className="campaign-map__route">
                    <div className="campaign-map__intro">
                      <span>WORD BATTLE / OPERATION MAP</span>
                      <h1 id="campaign-map-title">마지막 왕좌까지<br />25번의 전투</h1>
                      <p>말씀을 정확히 입력해 적을 밀어내고, 전투원과 무기를 성장시키세요.</p>
                    </div>

                    <div className="campaign-map__acts">
                      {BATTLE_REGIONS.map((region, actIndex) => (
                        <section className="campaign-act" key={region} aria-labelledby={`campaign-act-${actIndex + 1}`}>
                          <header>
                            <span>ACT {`${actIndex + 1}`.padStart(2, "0")}</span>
                            <h2 id={`campaign-act-${actIndex + 1}`}>{region}</h2>
                          </header>
                          <ol>
                            {BATTLE_STAGES.slice(actIndex * 5, (actIndex + 1) * 5).map((stage) => {
                              const isCleared = fighterCampaign.clearedStages.includes(stage.id);
                              const isUnlocked = stage.id <= unlockedBattleStage;
                              const isSelected = stage.id === activeBattleStage.id;
                              return (
                                <li key={stage.id}>
                                  <button
                                    type="button"
                                    className={`${isCleared ? "is-cleared" : ""} ${isSelected ? "is-selected" : ""} ${stage.boss ? "is-boss" : ""}`}
                                    onClick={() => setSelectedBattleStage(stage.id)}
                                    disabled={!isUnlocked}
                                    aria-current={isSelected ? "step" : undefined}
                                    aria-label={`${stage.id}단계 ${stage.enemy}${isCleared ? ", 완료" : isUnlocked ? ", 도전 가능" : ", 잠김"}`}
                                  >
                                    <span>{`${stage.id}`.padStart(2, "0")}</span>
                                    <small>{isCleared ? "CLEAR" : isUnlocked ? stage.boss ? "BOSS" : "OPEN" : "LOCK"}</small>
                                  </button>
                                </li>
                              );
                            })}
                          </ol>
                        </section>
                      ))}
                    </div>
                  </div>

                  <aside className="campaign-brief" aria-live="polite">
                    <div className="campaign-brief__stage">
                      <span>STAGE {`${activeBattleStage.id}`.padStart(2, "0")} / 25 · ACT {`${activeBattleStage.act}`.padStart(2, "0")}</span>
                      <strong>{activeBattleStage.region}</strong>
                    </div>
                    <div className={`campaign-brief__enemy ${activeBattleStage.id === 25 ? "is-final" : ""}`}>
                      <Image
                        key={activeBattleStage.asset}
                        src={activeBattleStage.asset}
                        width={activeBattleStage.width}
                        height={activeBattleStage.height}
                        sizes="(max-width: 820px) 60vw, 32vw"
                        priority
                        alt={`${activeBattleStage.enemy} 전신`}
                      />
                      <span>ENEMY POWER {formatNumber(activeBattleStage.maxHealth)}</span>
                    </div>
                    <div className="campaign-brief__copy">
                      <span>{activeBattleStage.boss ? activeBattleStage.id === 25 ? "FINAL BOSS" : "REGION BOSS" : "ENCOUNTER"}</span>
                      <h2>{activeBattleStage.enemy}</h2>
                      <p>{activeBattleStage.title}</p>
                    </div>

                    <div className="campaign-growth">
                      <div>
                        <span>전투원</span>
                        <strong>LV.{fighterCampaign.level}</strong>
                        <div><i style={{ width: `${fighterCampaign.level >= 25 ? 100 : (fighterCampaign.xp / characterXpTarget(fighterCampaign.level)) * 100}%` }} /></div>
                        <small>{fighterCampaign.level >= 25 ? "MAX" : `${fighterCampaign.xp} / ${characterXpTarget(fighterCampaign.level)} XP`}</small>
                      </div>
                      <div>
                        <span>{selectedFighter.weapon}</span>
                        <strong>LV.{fighterCampaign.weaponLevel}</strong>
                        <div><i style={{ width: `${fighterCampaign.weaponLevel >= 10 ? 100 : (fighterCampaign.weaponXp / weaponXpTarget(fighterCampaign.weaponLevel)) * 100}%` }} /></div>
                        <small>{fighterCampaign.weaponLevel >= 10 ? "MAX" : `${fighterCampaign.weaponXp} / ${weaponXpTarget(fighterCampaign.weaponLevel)} XP`}</small>
                      </div>
                    </div>

                    <div className="campaign-brief__reward">
                      <span>첫 승리 보상</span>
                      <strong>전투원 +{activeBattleStage.characterXp} XP</strong>
                      <strong>무기 +{activeBattleStage.weaponXp} XP</strong>
                    </div>
                    <button className="campaign-brief__start" onClick={() => startBattleStage(activeBattleStage.id)} aria-keyshortcuts="Enter">
                      <span>[ ENTER ]</span>
                      {activeBattleStage.id === 25 ? "최종 결전 시작" : `${activeBattleStage.id}단계 시작`}
                      <ArrowRightIcon size={22} weight="bold" aria-hidden="true" />
                    </button>
                  </aside>
                </div>
              </section>
            </div>
          )}

          {view === "library" && (
            <div className="page page--library">
              <header className="page-heading">
                <div><span className="eyebrow">66권의 여정</span><h1>어디서 시작할까요?</h1></div>
                <p>책을 고르면 아직 쓰지 않은 첫 구절부터 이어집니다.</p>
              </header>
              <div className="segmented-control" role="group" aria-label="성경 구분">
                {(["전체", "구약", "신약"] as const).map((item) => (
                  <button key={item} className={libraryTestament === item ? "is-active" : ""} onClick={() => setLibraryTestament(item)}>{item}</button>
                ))}
              </div>
              <div className="book-library">
                {bible.books
                  .filter((book) => libraryTestament === "전체" || book.testament === libraryTestament)
                  .map((book) => {
                    const value = bookProgress.get(book.code) ?? { completed: 0, percent: 0 };
                    return (
                      <button key={book.code} className="library-book" onClick={() => beginBook(book)}>
                        <span className="library-book__number">{`${book.order + 1}`.padStart(2, "0")}</span>
                        <div><strong>{book.name}</strong><small>{book.chapters}장 · {formatNumber(book.verses)}절</small></div>
                        <div className="library-book__progress">
                          <span>{value.percent.toFixed(1)}%</span>
                          <div className="mini-track"><i style={{ width: `${value.percent}%` }} /></div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {view === "practice" && currentUnit && (
            <div className="page page--practice">
              {practiceMode === "battle" ? (
                <section
                  className={`battle-practice ${result ? "is-complete" : ""} ${battleFeedback ? `is-${battleFeedback.kind}` : ""}`}
                  style={{ "--fighter-accent": selectedFighter.accent } as CSSProperties}
                >
                  <header className="battle-header">
                    <button onClick={openBattleMap} aria-label="전투를 닫고 작전 지도로" aria-keyshortcuts="Escape">[ ESC ] 작전 지도</button>
                    <div>
                      <span>STAGE {`${activeBattleStage.id}`.padStart(2, "0")} / 25 · {selectedFighter.name} LV.{fighterCampaign.level}</span>
                      <h1>{referenceFor(currentUnit, currentBook)}</h1>
                    </div>
                    <p>{selectedFighter.weapon} <strong>LV.{fighterCampaign.weaponLevel}</strong></p>
                    <button
                      className="battle-fx-toggle"
                      onClick={() => {
                        setBattleEffectsEnabled((enabled) => !enabled);
                        window.setTimeout(() => inputRef.current?.focus(), 40);
                      }}
                      aria-pressed={battleEffectsEnabled}
                    >
                      FX {battleEffectsEnabled ? "ON" : "OFF"}
                    </button>
                  </header>

                  {!result && !battleDefeated ? (
                    <div className="battle-shell">
                      <section className="battle-arena" aria-label={`${activeBattleStage.enemy} 체력 ${battleHealth}%`}>
                        <div className="battle-boss-bar">
                          <div>
                            <span>{activeBattleStage.enemy}</span>
                            <strong>{formatNumber(battleEnemyHp)}<small> / {formatNumber(activeBattleStage.maxHealth)}</small></strong>
                          </div>
                          <div className="battle-health-track" role="progressbar" aria-label={`${activeBattleStage.enemy} 남은 체력`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={battleHealth}>
                            <i style={{ width: `${battleHealth}%` }} />
                          </div>
                        </div>

                        <div className="battle-field">
                          <Image
                            className="battle-arena-backdrop"
                            src="/game-assets/battlefield-sanctuary-v2.webp"
                            width={1680}
                            height={945}
                            sizes="100vw"
                            priority
                            alt=""
                            aria-hidden="true"
                          />
                          <div
                            className={`battle-fighter-wrap battle-fighter-wrap--${selectedFighter.id} ${battleFeedback?.kind === "hit" ? "is-attacking" : battleFeedback?.kind === "miss" ? "is-recoiling" : ""}`}
                            key={`fighter-${selectedFighter.id}-${battleFeedback?.id ?? 0}`}
                          >
                            <div className="battle-fighter-name">
                              <small>{selectedFighter.role}</small>
                              <strong>{selectedFighter.name}</strong>
                            </div>
                            <Image
                              className="battle-fighter battle-fighter--idle"
                              src={selectedFighter.asset}
                              width={selectedFighter.width}
                              height={selectedFighter.height}
                              sizes="(max-width: 820px) 78vw, 38vw"
                              priority
                              alt={`${selectedFighter.name} 전투원`}
                            />
                            <Image
                              className="battle-fighter battle-fighter--aim"
                              src={selectedFighter.battleAsset}
                              width={selectedFighter.battleWidth}
                              height={selectedFighter.battleHeight}
                              sizes="(max-width: 820px) 78vw, 38vw"
                              priority
                              alt=""
                              aria-hidden="true"
                            />
                          </div>

                          <aside className="battle-power-meter" aria-label="말씀 전투 점수">
                            <span>말씀의 힘</span>
                            <strong>{formatNumber(battleScore)}</strong>
                            <small>{battlePower}</small>
                            <div><b>{currentCombo}</b> COMBO</div>
                            <div className="battle-player-health">
                              <span>HP {battlePlayerHp} / {battlePlayerMaxHp}</span>
                              <i><b style={{ width: `${(battlePlayerHp / battlePlayerMaxHp) * 100}%` }} /></i>
                            </div>
                          </aside>

                          <div className="battle-enemy-wrap" key={`enemy-${battleFeedback?.id ?? 0}`}>
                            <div className="battle-target-lock" aria-hidden="true">
                              <CrosshairIcon weight="thin" />
                              <span>LOCKED</span>
                            </div>
                            <Image
                              className="battle-enemy"
                              src={activeBattleStage.asset}
                              width={activeBattleStage.width}
                              height={activeBattleStage.height}
                              priority
                              alt={`말씀의 힘에 맞서는 ${activeBattleStage.enemy}`}
                            />
                          </div>

                          {battleEffectsEnabled && battleFeedback?.kind === "hit" && (
                            <div className={`battle-hit-fx is-strength-${battleFeedback.strength}`} key={`hit-${battleFeedback.id}`} aria-hidden="true">
                              <Image className="battle-muzzle" src="/game-assets/effects/battle-muzzle-flash-v2.webp" width={515} height={488} alt="" />
                              <Image className="battle-projectile" src="/game-assets/effects/battle-tracer-v2.webp" width={1187} height={638} alt="" />
                              <Image className="battle-impact" src="/game-assets/effects/battle-impact-v2.webp" width={760} height={714} alt="" />
                              <strong className="battle-hit-callout">{battleFeedback.strength === 3 ? "PERFECT" : battleFeedback.strength === 2 ? "POWER HIT" : "HIT"}</strong>
                            </div>
                          )}
                          {battleEffectsEnabled && battleFeedback?.kind === "miss" && <div className="battle-miss-flash" key={`miss-${battleFeedback.id}`} aria-hidden="true" />}
                        </div>
                      </section>

                      <section className="battle-type-stage">
                        <div className="battle-live-stats" aria-live="polite">
                          <span>콤보 <strong>{currentCombo}</strong></span>
                          <span>타수 <strong>{liveCpm || 0}</strong></span>
                          <span>정확도 <strong>{keystrokes ? liveAccuracy.toFixed(0) : 100}%</strong></span>
                        </div>

                        <div className="battle-word-queue" aria-label={`따라 쓸 구절: ${currentUnit.t}`} aria-live="polite">
                          {visibleConsoleWords.slice(0, 3).map((word, queueIndex) => {
                            const cursorOffset = Math.max(0, typed.length - word.start);
                            const wordLength = Array.from(word.text).length;
                            const wordLengthClass = wordLength > 10 ? "is-very-long-word" : wordLength > 7 ? "is-long-word" : "";
                            return queueIndex === 0 ? (
                              <div className={`battle-current-word ${wordLengthClass}`} key={`${word.start}-${word.text}`}>
                                {Array.from(word.text).map((character, offset) => {
                                  const absoluteIndex = word.start + offset;
                                  const state = absoluteIndex < typed.length
                                    ? typed[absoluteIndex] === character ? "is-correct" : "is-wrong"
                                    : offset === cursorOffset ? "is-current" : "is-upcoming";
                                  const isLatestHit = absoluteIndex === typed.length - 1 && battleFeedback?.kind === "hit";
                                  const isLatestMiss = absoluteIndex === typed.length - 1 && battleFeedback?.kind === "miss";
                                  return (
                                    <span className={`${state} ${isLatestHit ? "is-latest-hit" : ""} ${isLatestMiss ? "is-latest-miss" : ""}`} key={`${absoluteIndex}-${character}`}>
                                      {character}
                                      {battleEffectsEnabled && isLatestHit && (
                                        <Image
                                          className="battle-letter-impact"
                                          key={`letter-hit-${battleFeedback?.id ?? 0}`}
                                          src="/game-assets/effects/battle-impact-v2.webp"
                                          width={760}
                                          height={714}
                                          alt=""
                                          aria-hidden="true"
                                        />
                                      )}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className={`battle-next-word battle-next-word--${queueIndex}`} key={`${word.start}-${word.text}`}>{word.text}</div>
                            );
                          })}
                        </div>

                        <div className="battle-input-bar">
                          <label className="sr-only" htmlFor="battle-typing-input">말씀을 그대로 입력하세요</label>
                          <textarea
                            ref={inputRef}
                            id="battle-typing-input"
                            value={typed}
                            onChange={handleInput}
                            onCompositionStart={() => {
                              isComposingRef.current = true;
                              compositionBaseRef.current = typed;
                            }}
                            onCompositionEnd={(event) => {
                              isComposingRef.current = false;
                              applyTypedValue(event.currentTarget.value, compositionBaseRef.current);
                            }}
                            onPaste={(event) => event.preventDefault()}
                            placeholder="말씀을 입력해 어둠을 물리치세요"
                            autoCapitalize="off"
                            autoCorrect="off"
                            autoComplete="off"
                            spellCheck={false}
                            rows={1}
                          />
                          <button onClick={openBattleMap}>작전 지도</button>
                        </div>
                      </section>
                    </div>
                  ) : battleDefeated ? (
                    <div className="battle-defeat" aria-live="assertive">
                      <div className="battle-defeat__visual" aria-hidden="true">
                        <Image src={activeBattleStage.asset} width={activeBattleStage.width} height={activeBattleStage.height} alt="" />
                      </div>
                      <span>STAGE {`${activeBattleStage.id}`.padStart(2, "0")} · {activeBattleStage.enemy}</span>
                      <h2>전열을 다시 가다듬으세요.</h2>
                      <p>오타 피해로 체력이 모두 소진됐습니다.<br />이 단계에서는 오타 한 글자마다 최대 {activeBattleStage.missDamage}의 피해를 받습니다.</p>
                      <div className="battle-defeat__actions">
                        <button onClick={() => startBattleStage(activeBattleStage.id)}>다시 도전</button>
                        <button onClick={openBattleMap}>작전 지도</button>
                      </div>
                    </div>
                  ) : result ? (
                    <div className="battle-victory" aria-live="polite">
                      <div className="battle-victory__visual" aria-hidden="true">
                        {battleEffectsEnabled && <Image className="battle-victory__burst" src="/game-assets/effects/battle-impact-v2.webp" width={760} height={714} alt="" />}
                        <Image className="battle-victory__enemy" src={activeBattleStage.asset} width={activeBattleStage.width} height={activeBattleStage.height} alt="" />
                        <Image
                          className="battle-victory__fighter"
                          src={selectedFighter.asset}
                          width={selectedFighter.width}
                          height={selectedFighter.height}
                          alt=""
                        />
                      </div>
                      <span>STAGE {`${activeBattleStage.id}`.padStart(2, "0")} · {selectedFighter.name} 승리</span>
                      <h2>{activeBattleStage.id === 25 ? "사탄을 물리쳤습니다." : `${activeBattleStage.enemy}을 물리쳤습니다.`}</h2>
                      <p>“{currentUnit.t}”<br /><small>{selectedFighter.motto}</small></p>
                      <div className="battle-victory__stats">
                        <div><strong>{formatNumber(battleScore)}</strong><span>전투 점수</span></div>
                        <div><strong>{result.cpm}</strong><span>타/분</span></div>
                        <div><strong>{result.accuracy.toFixed(1)}</strong><span>정확도 %</span></div>
                      </div>
                      <div className={`record-mode-score ${result.score !== undefined ? "is-scored" : ""}`}>
                        <div>
                          <span>{playerSession ? "랭킹 기록 점수" : "기록 모드 OFF"}</span>
                          <strong>{result.score !== undefined ? `+${formatNumber(result.score)}점` : result.scoreError ? "기록 실패 · 다시 완주해 주세요" : playerSession ? "점수 계산 중" : "아이디를 만들면 점수가 기록됩니다"}</strong>
                        </div>
                        <button onClick={() => setView("ranking")}>{playerSession ? "랭킹 보기" : "아이디 만들기"}</button>
                      </div>
                      {battleReward && (
                        <div className="battle-victory__reward">
                          <span>{battleReward.firstClear ? "첫 승리 보상" : "재도전 보상"}</span>
                          <strong>전투원 +{battleReward.characterXp} XP</strong>
                          <strong>무기 +{battleReward.weaponXp} XP</strong>
                          {(battleReward.levelUps > 0 || battleReward.weaponLevelUps > 0) && (
                            <em>{battleReward.levelUps > 0 ? `전투원 LV +${battleReward.levelUps}` : ""}{battleReward.levelUps > 0 && battleReward.weaponLevelUps > 0 ? " · " : ""}{battleReward.weaponLevelUps > 0 ? `무기 LV +${battleReward.weaponLevelUps}` : ""}</em>
                          )}
                        </div>
                      )}
                      <div className="battle-victory__actions">
                        <button onClick={continueBattleCampaign}>{activeBattleStage.id === 25 ? "작전 지도" : "다음 단계"}</button>
                        <button onClick={() => startBattleStage(activeBattleStage.id)}>한 번 더</button>
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : visualTheme === "type-console" ? (
                <section className={`console-practice ${result ? "is-complete" : ""}`}>
                  <header className="console-practice__header">
                    <button onClick={() => setView("home")} aria-label="연습을 닫고 홈으로" aria-keyshortcuts="Escape">[ ESC ] 나가기</button>
                    <h1>{referenceFor(currentUnit, currentBook)}</h1>
                    <p>오늘 <strong>{todayCompleted}/{progress.dailyGoal}</strong>절</p>
                    <p>연속 <strong>{streak}</strong>일</p>
                  </header>

                  {!result ? (
                    <>
                      <ol className="console-segments" aria-label={`현재 ${activeSegment}구간, 전체 10구간`}>
                        {Array.from({ length: 10 }, (_, index) => {
                          const segment = index + 1;
                          return (
                            <li className={segment === activeSegment ? "is-active" : segment < activeSegment ? "is-complete" : ""} key={segment}>
                              <span>{`${segment}`.padStart(2, "0")}</span>
                              {segment === activeSegment && <strong>{segment}구간</strong>}
                            </li>
                          );
                        })}
                      </ol>

                      <div className="console-stage-grid">
                        <div className="console-word-stack" aria-label={`따라 쓸 구절: ${currentUnit.t}`} aria-live="polite">
                          {visibleConsoleWords.map((word, queueIndex) => {
                            const cursorOffset = Math.max(0, typed.length - word.start);
                            return queueIndex === 0 ? (
                              <div className="console-current-word" key={`${word.start}-${word.text}`}>
                                {Array.from(word.text).map((character, offset) => {
                                  const absoluteIndex = word.start + offset;
                                  const state = absoluteIndex < typed.length
                                    ? typed[absoluteIndex] === character ? "is-correct" : "is-wrong"
                                    : "is-upcoming";
                                  return (
                                    <span className={`${state} ${offset === cursorOffset ? "is-input-position" : ""}`} key={`${absoluteIndex}-${character}`}>
                                      {character}
                                    </span>
                                  );
                                })}
                                {cursorOffset >= word.text.length && <span className="console-word-cursor" aria-hidden="true" />}
                              </div>
                            ) : (
                              <div className={`console-next-word console-next-word--${queueIndex}`} key={`${word.start}-${word.text}`}>{word.text}</div>
                            );
                          })}
                        </div>

                        <aside className="console-live-stats" aria-label="현재 타자 기록" aria-live="polite">
                          <div><span>콤보</span><strong>{currentCombo}</strong></div>
                          <div><span>타수</span><strong>{liveCpm || 0}</strong></div>
                          <div><span>정확도</span><strong>{keystrokes ? liveAccuracy.toFixed(0) : 100}<small>%</small></strong></div>
                        </aside>
                      </div>

                      <div className="console-input-bar">
                        <label className="sr-only" htmlFor="typing-input">말씀을 그대로 입력하세요</label>
                        <textarea
                          ref={inputRef}
                          id="typing-input"
                          value={typed}
                          onChange={handleInput}
                          onCompositionStart={() => {
                            isComposingRef.current = true;
                            compositionBaseRef.current = typed;
                          }}
                          onCompositionEnd={(event) => {
                            isComposingRef.current = false;
                            applyTypedValue(event.currentTarget.value, compositionBaseRef.current);
                          }}
                          onPaste={(event) => event.preventDefault()}
                          placeholder="말씀을 입력하세요"
                          autoCapitalize="off"
                          autoCorrect="off"
                          autoComplete="off"
                          spellCheck={false}
                          rows={1}
                        />
                        <button onClick={goRandom}>다른 구절</button>
                      </div>
                    </>
                  ) : (
                    <div className="console-result" aria-live="polite">
                      <span>완주 / {referenceFor(currentUnit, currentBook)}</span>
                      <h2>{result.isNew ? "새로운 진도가 기록됐습니다." : "다시 쓴 구절도 좋은 연습이에요."}</h2>
                      <div className="console-result__stats">
                        <div><strong>{result.cpm}</strong><span>타/분</span></div>
                        <div><strong>{result.accuracy.toFixed(1)}</strong><span>정확도 %</span></div>
                        <div><strong>{result.durationSeconds.toFixed(1)}</strong><span>걸린 시간</span></div>
                      </div>
                      <div className={`record-mode-score ${result.score !== undefined ? "is-scored" : ""}`}>
                        <div>
                          <span>{playerSession ? "랭킹 기록 점수" : "기록 모드 OFF"}</span>
                          <strong>{result.score !== undefined ? `+${formatNumber(result.score)}점` : result.scoreError ? "기록 실패 · 다시 완주해 주세요" : playerSession ? "점수 계산 중" : "아이디를 만들면 점수가 기록됩니다"}</strong>
                        </div>
                        <button onClick={() => setView("ranking")}>{playerSession ? "랭킹 보기" : "아이디 만들기"}</button>
                      </div>
                      <p>“{currentUnit.t}”</p>
                      <div className="console-result__actions">
                        <button onClick={goToNext}>[ ENTER ] 다음 구절</button>
                        <button onClick={resetPractice}>한 번 더</button>
                      </div>
                    </div>
                  )}
                </section>
              ) : (
              <section className={`typing-stage ${result ? "is-complete" : ""}`}>
                <header className="practice-header">
                  <button className="practice-back" onClick={() => setView("home")} aria-label="연습을 닫고 홈으로">
                    <ArrowLeftIcon size={32} weight="regular" aria-hidden="true" />
                  </button>
                  <h1>{referenceFor(currentUnit, currentBook)}</h1>
                  <p className="practice-daily">오늘 <strong>{todayCompleted}/{progress.dailyGoal}</strong>절</p>
                  <p className="practice-streak">연속 <strong>{streak}</strong></p>
                </header>

                {!result ? (
                  <>
                    <ol
                      className="verse-segments"
                      style={{ "--segment-progress": `${((activeSegment - 1) / 9) * 100}%` } as CSSProperties}
                      aria-label={`현재 ${activeSegment}구간, 전체 10구간`}
                    >
                      {Array.from({ length: 10 }, (_, index) => {
                        const segment = index + 1;
                        const state = segment < activeSegment
                          ? "is-complete"
                          : segment === activeSegment ? "is-active" : "";
                        return (
                          <li className={state} key={segment}>
                            <span>{segment}</span>
                            {segment === activeSegment && <strong>{segment}구간</strong>}
                            {segment < 10 && <i aria-hidden="true" />}
                          </li>
                        );
                      })}
                    </ol>

                    <div className="live-stats" aria-live="polite">
                      <div><span>정확 콤보</span><strong>{currentCombo}</strong></div>
                      <div><strong>{liveCpm || 0}</strong><small>타/분</small></div>
                      <div><span>정확도</span><strong>{keystrokes ? liveAccuracy.toFixed(0) : 100}</strong><small>%</small></div>
                    </div>
                    <div className="verse-display" aria-label={`따라 쓸 구절: ${currentUnit.t}`}>
                      {Array.from(currentUnit.t).map((character, index) => {
                        const state = index < typed.length
                          ? typed[index] === character ? "is-correct" : "is-wrong"
                          : index === typed.length ? "is-current" : "";
                        return <span className={state} key={`${index}-${character}`}>{character}</span>;
                      })}
                    </div>
                    <div className="typing-input-wrap">
                      <label className="sr-only" htmlFor="typing-input">말씀을 그대로 입력하세요</label>
                      <textarea
                        ref={inputRef}
                        id="typing-input"
                        value={typed}
                        onChange={handleInput}
                        onCompositionStart={() => {
                          isComposingRef.current = true;
                          compositionBaseRef.current = typed;
                        }}
                        onCompositionEnd={(event) => {
                          isComposingRef.current = false;
                          applyTypedValue(event.currentTarget.value, compositionBaseRef.current);
                        }}
                        onPaste={(event) => event.preventDefault()}
                        placeholder="말씀을 따라 입력하세요"
                        autoCapitalize="off"
                        autoCorrect="off"
                        autoComplete="off"
                        spellCheck={false}
                        rows={1}
                      />
                    </div>
                    <div className="practice-actions">
                      <button className="text-button" onClick={goRandom}>다른 구절 <ArrowRightIcon size={20} weight="bold" aria-hidden="true" /></button>
                    </div>
                  </>
                ) : (
                  <div className="result-panel" aria-live="polite">
                    <div className="result-burst"><span>완주</span></div>
                    <span className="eyebrow">한 절을 마음에 새겼어요</span>
                    <h2>{result.isNew ? "새로운 진도가 기록됐습니다." : "다시 쓴 구절도 좋은 연습이에요."}</h2>
                    <div className="result-stats">
                      <div><strong>{result.cpm}</strong><span>타/분</span></div>
                      <div><strong>{result.accuracy.toFixed(1)}</strong><span>정확도 %</span></div>
                      <div><strong>{result.durationSeconds.toFixed(1)}</strong><span>걸린 시간</span></div>
                    </div>
                      <div className={`record-mode-score ${result.score !== undefined ? "is-scored" : ""}`}>
                        <div>
                          <span>{playerSession ? "랭킹 기록 점수" : "기록 모드 OFF"}</span>
                          <strong>{result.score !== undefined ? `+${formatNumber(result.score)}점` : result.scoreError ? "기록 실패 · 다시 완주해 주세요" : playerSession ? "점수 계산 중" : "아이디를 만들면 점수가 기록됩니다"}</strong>
                        </div>
                        <button onClick={() => setView("ranking")}>{playerSession ? "랭킹 보기" : "아이디 만들기"}</button>
                      </div>
                    <p className="result-verse">“{currentUnit.t}”</p>
                    <div className="button-row button-row--center">
                      <button className="button button--primary" onClick={goToNext}>다음 구절 <ArrowRightIcon size={18} weight="bold" aria-hidden="true" /></button>
                      <button className="button button--quiet" onClick={resetPractice}>한 번 더</button>
                    </div>
                  </div>
                )}
              </section>
              )}
            </div>
          )}

          {view === "ranking" && (
            <div className="page page--ranking">
              <header className="page-heading ranking-heading">
                <div><span className="eyebrow">RECORD MODE / LIVE RANKING</span><h1>말씀을 입력한 만큼<br />점수로 남깁니다.</h1></div>
                <p>일반 타자연습과 말씀 전투가 하나의 선수 기록으로 합산됩니다.</p>
              </header>

              <section className="ranking-account" aria-labelledby="ranking-account-title">
                {playerSummary ? (
                  <>
                    <div className="ranking-account__identity">
                      <span>기록 모드 ON</span>
                      <h2 id="ranking-account-title">{playerSummary.id}</h2>
                      <p>이 브라우저에서 완주한 모든 연습이 자동으로 랭킹에 반영됩니다.</p>
                    </div>
                    <div className="ranking-account__metrics">
                      <div><span>전체 순위</span><strong>#{formatNumber(playerSummary.rank)}</strong></div>
                      <div><span>누적 점수</span><strong>{formatNumber(playerSummary.totalScore)}</strong></div>
                      <div><span>최고 한 판</span><strong>{formatNumber(playerSummary.bestScore)}</strong></div>
                      <div><span>기록 횟수</span><strong>{formatNumber(playerSummary.totalSessions)}</strong></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="ranking-account__identity">
                      <span>기록 모드 시작</span>
                      <h2 id="ranking-account-title">중복 없는 선수 아이디를 만드세요.</h2>
                      <p>가입 절차 없이 아이디를 선점하면 이 브라우저에 전용 기록 키가 저장됩니다.</p>
                    </div>
                    <form className="ranking-account__form" onSubmit={createPlayer}>
                      <label htmlFor="player-id">선수 아이디</label>
                      <div>
                        <input
                          id="player-id"
                          value={playerIdDraft}
                          onChange={(event) => setPlayerIdDraft(event.target.value)}
                          minLength={2}
                          maxLength={12}
                          autoComplete="username"
                          placeholder="한글·영문·숫자 2~12자"
                          disabled={accountBusy}
                          required
                        />
                        <button type="submit" disabled={accountBusy}>{accountBusy ? "확인 중" : "아이디 생성"}</button>
                      </div>
                      <small>같은 아이디는 두 번 만들 수 없습니다. 현재 기기의 브라우저 데이터를 지우면 기록 키도 사라질 수 있습니다.</small>
                    </form>
                  </>
                )}
                {accountMessage && <p className="ranking-account__message" role="status">{accountMessage}</p>}
              </section>

              <section className="leaderboard-section" aria-labelledby="leaderboard-title">
                <header className="leaderboard-section__header">
                  <div><span>TOP 50</span><h2 id="leaderboard-title">말씀타자 랭킹</h2></div>
                  <div className="ranking-tabs" role="group" aria-label="랭킹 종류">
                    {([
                      ["overall", "통합"],
                      ["standard", "타자연습"],
                      ["battle", "말씀 전투"],
                    ] as const).map(([scope, label]) => (
                      <button key={scope} className={rankingScope === scope ? "is-active" : ""} onClick={() => { setLeaderboardBusy(true); setRankingScope(scope); }} aria-pressed={rankingScope === scope}>{label}</button>
                    ))}
                  </div>
                </header>

                <div className="leaderboard-table" aria-live="polite" aria-busy={leaderboardBusy}>
                  <div className="leaderboard-table__head" aria-hidden="true">
                    <span>순위</span><span>선수</span><span>점수</span><span>최고 타수</span><span>정확도</span><span>기록</span>
                  </div>
                  {leaderboardBusy ? (
                    <div className="leaderboard-empty">랭킹을 집계하고 있습니다.</div>
                  ) : leaderboard.length ? leaderboard.map((entry) => (
                    <article className={entry.id.toLocaleLowerCase("ko-KR") === playerSummary?.id.toLocaleLowerCase("ko-KR") ? "is-me" : ""} key={`${rankingScope}-${entry.id}`}>
                      <strong className="leaderboard-rank">{`${entry.rank}`.padStart(2, "0")}</strong>
                      <div><strong>{entry.id}</strong>{entry.rank <= 3 && <small>{entry.rank === 1 ? "GOLD" : entry.rank === 2 ? "SILVER" : "BRONZE"}</small>}</div>
                      <strong>{formatNumber(entry.score)}<small>점</small></strong>
                      <span>{formatNumber(entry.bestCpm)}<small>타/분</small></span>
                      <span>{entry.bestAccuracy.toFixed(1)}<small>%</small></span>
                      <span>{formatNumber(entry.totalSessions)}<small>회</small></span>
                    </article>
                  )) : (
                    <div className="leaderboard-empty">아직 등록된 기록이 없습니다. 첫 번째 순위의 주인공이 되어 보세요.</div>
                  )}
                </div>
              </section>

              <section className="score-rules" aria-label="점수 계산 방식">
                <span>점수 기준</span>
                <p>정확도 비중이 가장 크며 타수, 정확 콤보, 입력 길이를 함께 계산합니다. 말씀 전투는 단계 보너스가 추가되고 오타는 감점됩니다.</p>
                <strong>{playerSummary ? `현재 통합 ${formatNumber(playerSummary.totalScore)}점` : "아이디 생성 후 자동 기록"}</strong>
              </section>
            </div>
          )}

          {view === "progress" && (
            <div className="page page--progress">
              <header className="page-heading">
                <div><span className="eyebrow">나의 말씀 여정</span><h1>작은 반복이 쌓인 기록</h1></div>
                <p>속도보다 꾸준함을 먼저 보여드려요.</p>
              </header>

              <section className="progress-overview">
                <div className="progress-overview__ring">
                  <ProgressRing percent={overallPercent} value={`${overallPercent.toFixed(2)}%`} caption="전체 달성" />
                </div>
                <div className="progress-overview__copy">
                  <span className="eyebrow">성경 전체</span>
                  <h2>{formatNumber(completedVerses)}절을<br />손끝으로 읽었어요.</h2>
                  <p>앞으로 {formatNumber(Math.max(0, bible.totalVerses - completedVerses))}절이 남아 있습니다.</p>
                  <button className="button button--primary" onClick={() => beginPractice(progress.currentIndex)}>여정 계속하기</button>
                </div>
                <div className="progress-overview__metrics">
                  <div><span>연속 연습</span><strong>{streak}<small>일</small></strong></div>
                  <div><span>누적 완주</span><strong>{formatNumber(progress.totalSessions)}<small>회</small></strong></div>
                  <div><span>평균 정확도</span><strong>{averageAccuracy ? averageAccuracy.toFixed(1) : "—"}<small>{averageAccuracy ? "%" : ""}</small></strong></div>
                </div>
              </section>

              <section className="section-block">
                <div className="section-heading">
                  <div><span className="eyebrow">달성 배지</span><h2>{unlockedCount}/{achievements.length}개를 열었어요</h2></div>
                </div>
                <div className="achievement-grid">
                  {achievements.map((achievement) => (
                    <article className={achievement.unlocked ? "achievement is-unlocked" : "achievement"} key={achievement.title}>
                      <span className="achievement__mark">{achievement.mark}</span>
                      <div><strong>{achievement.title}</strong><p>{achievement.description}</p></div>
                      <small>{achievement.unlocked ? "달성" : "잠김"}</small>
                    </article>
                  ))}
                </div>
              </section>

              <section className="section-block">
                <div className="section-heading"><div><span className="eyebrow">최근 연습</span><h2>방금까지의 발자국</h2></div></div>
                {progress.recent.length ? (
                  <div className="recent-list">
                    {progress.recent.slice(0, 6).map((session, index) => {
                      const unit = unitById.get(session.verseId);
                      const book = booksByCode.get(session.bookCode);
                      return (
                        <article key={`${session.completedAt}-${index}`}>
                          <span className="recent-list__index">{`${index + 1}`.padStart(2, "0")}</span>
                          <div><strong>{unit ? referenceFor(unit, book) : session.verseId}</strong><small>{new Date(session.completedAt).toLocaleDateString("ko-KR")}</small></div>
                          <div><strong>{session.cpm}</strong><small>타/분</small></div>
                          <div><strong>{Number(session.accuracy).toFixed(1)}%</strong><small>정확도</small></div>
                        </article>
                      );
                    })}
                  </div>
                ) : <div className="empty-state">첫 구절을 완주하면 이곳에 기록이 쌓입니다.</div>}
              </section>
            </div>
          )}
        </main>

        <nav className="bottom-nav" aria-label="모바일 주요 메뉴">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "is-active" : ""}
              onClick={() => setView(item.id)}
              aria-current={view === item.id ? "page" : undefined}
            >
              <i />{item.short}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
