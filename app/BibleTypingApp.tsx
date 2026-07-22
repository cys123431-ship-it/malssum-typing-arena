"use client";

import {
  type ChangeEvent,
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ListIcon,
  MoonIcon,
  SunIcon,
  XIcon,
} from "@phosphor-icons/react";

type View = "home" | "library" | "battle-select" | "practice" | "progress";
type VisualTheme = "classic" | "type-console";
type PracticeMode = "standard" | "battle";
type BattleFighterId = "seoha" | "mira" | "yuna" | "riel" | "hana" | "arin";

type BattleFighter = {
  id: BattleFighterId;
  name: string;
  role: string;
  weapon: string;
  tagline: string;
  asset: string;
  width: number;
  height: number;
  accent: string;
};

type BattleFeedback = {
  id: number;
  kind: "hit" | "miss";
  strength: 1 | 2 | 3;
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

const STORAGE_KEY = "bible-typing-progress-v1";
const VISUAL_THEME_STORAGE_KEY = "bible-typing-visual-theme";
const BATTLE_FIGHTER_STORAGE_KEY = "bible-typing-battle-fighter";
const BATTLE_FIGHTERS: BattleFighter[] = [
  {
    id: "seoha",
    name: "서하",
    role: "선봉",
    weapon: "레일 스태프",
    tagline: "빠르고 균형 잡힌 말씀 사격",
    asset: "/game-assets/fighters/fighter-seoha.webp",
    width: 800,
    height: 1200,
    accent: "#f0a32f",
  },
  {
    id: "mira",
    name: "미라",
    role: "정밀",
    weapon: "초승달 활",
    tagline: "정확한 한 글자를 멀리 보냅니다",
    asset: "/game-assets/fighters/fighter-mira.webp",
    width: 900,
    height: 1200,
    accent: "#7ac8ff",
  },
  {
    id: "yuna",
    name: "유나",
    role: "중화력",
    weapon: "공명 포",
    tagline: "묵직한 타격으로 어둠을 흔듭니다",
    asset: "/game-assets/fighters/fighter-yuna.webp",
    width: 800,
    height: 1200,
    accent: "#e35f62",
  },
  {
    id: "riel",
    name: "리엘",
    role: "관통",
    weapon: "펜 랜스",
    tagline: "문장을 꿰뚫는 날카로운 집중",
    asset: "/game-assets/fighters/fighter-riel.webp",
    width: 1200,
    height: 800,
    accent: "#a47bff",
  },
  {
    id: "hana",
    name: "하나",
    role: "연타",
    weapon: "쌍 말씀봉",
    tagline: "콤보가 쌓일수록 빛나는 연속타",
    asset: "/game-assets/fighters/fighter-hana.webp",
    width: 1200,
    height: 800,
    accent: "#e5bf45",
  },
  {
    id: "arin",
    name: "아린",
    role: "저격",
    weapon: "말씀 소총",
    tagline: "흔들림 없이 약점을 겨눕니다",
    asset: "/game-assets/fighters/fighter-arin.webp",
    width: 900,
    height: 1200,
    accent: "#51d5ca",
  },
];

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
  const [battleFeedback, setBattleFeedback] = useState<BattleFeedback | null>(null);
  const [battleEffectsEnabled, setBattleEffectsEnabled] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState("기기 저장");
  const [loadingError, setLoadingError] = useState("");

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const startedAtRef = useRef<number | null>(null);
  const keystrokesRef = useRef(0);
  const errorsRef = useRef(0);
  const isComposingRef = useRef(false);
  const compositionBaseRef = useRef("");
  const sessionResultShownRef = useRef(false);
  const completionLockRef = useRef(false);
  const battleFeedbackIdRef = useRef(0);

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

        let remote: Partial<ProgressState> | null = null;
        try {
          const progressResponse = await fetch("/api/progress", { cache: "no-store" });
          if (progressResponse.ok) {
            remote = await progressResponse.json() as Partial<ProgressState>;
            setSyncStatus("동기화됨");
          }
        } catch {
          setSyncStatus("기기 저장");
        }

        if (!cancelled) {
          const nextProgress = mergeProgress(local, remote);
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
  const battleCorrectTyped = currentUnit
    ? Array.from(typed).reduce((sum, character, index) => sum + (character === currentUnit.t[index] ? 1 : 0), 0)
    : 0;
  const battleHealth = result || !currentUnit
    ? 0
    : Math.max(0, Math.round(100 - ((battleCorrectTyped / Math.max(1, currentUnit.t.length)) * 100)));
  const battleScore = Math.max(0, (liveCorrectKeystrokes * 120) + (currentCombo * 25) - (errors * 80));
  const battlePower = currentCombo >= 20 ? "MAX" : currentCombo >= 8 ? "강화" : "충전";

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
    openPractice(battleStartIndex, true, "battle");
  }, [battleStartIndex, openPractice]);

  const continuePractice = useCallback((index: number) => {
    openPractice(index, false);
  }, [openPractice]);

  const beginBook = useCallback((book: BibleBook) => {
    const indices = indicesByBook.get(book.code) ?? [];
    const firstIncomplete = indices.find((index) => bible && !completedSet.has(bible.units[index].id));
    beginPractice(firstIncomplete ?? indices[0] ?? 0);
  }, [beginPractice, bible, completedSet, indicesByBook]);

  const finishPractice = useCallback((finalKeystrokes: number, finalErrors: number, start: number) => {
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

    setSyncStatus("저장 중");
    void fetch("/api/progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
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
      }),
    }).then((response) => {
      setSyncStatus(response.ok ? "동기화됨" : "기기 저장");
    }).catch(() => setSyncStatus("기기 저장"));

    if (navigator.vibrate) navigator.vibrate([25, 35, 25]);
    if (!shouldShowResult) continuePractice(nextIndex);
  }, [bible, completedSet, continuePractice, currentIndex, currentUnit, result]);

  const applyTypedValue = useCallback((value: string, baseline: string) => {
    if (!currentUnit || result) return;
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
    if (nextValue.length > baseline.length) {
      for (let index = baseline.length; index < nextValue.length; index += 1) {
        nextKeystrokes += 1;
        if (nextValue[index] !== currentUnit.t[index]) {
          nextErrors += 1;
          newestFeedback = "miss";
        } else {
          newestFeedback = "hit";
        }
      }
      keystrokesRef.current = nextKeystrokes;
      errorsRef.current = nextErrors;
      setKeystrokes(nextKeystrokes);
      setErrors(nextErrors);

      if (practiceMode === "battle" && newestFeedback) {
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
    if (start && nextValue.length === currentUnit.t.length) {
      finishPractice(nextKeystrokes, nextErrors, start);
    }
  }, [currentUnit, finishPractice, practiceMode, result]);

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

  useEffect(() => {
    if (visualTheme !== "type-console" && view !== "battle-select" && !(practiceMode === "battle" && view === "practice")) return;

    function handleConsoleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isInteractive = target?.matches("input, textarea, select, button, a, [contenteditable='true']") ?? false;

      if (event.key === "Escape" && (view === "practice" || view === "battle-select")) {
        event.preventDefault();
        setView("home");
        return;
      }

      if (view === "battle-select" && event.key === "Enter" && !isInteractive) {
        event.preventDefault();
        startSelectedBattle();
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
  }, [beginBattle, beginPractice, bible, currentIndex, practiceMode, progress.currentIndex, startSelectedBattle, visualTheme, view]);

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
  ];

  return (
    <div className={`app-frame app-frame--${view} ${view === "practice" || view === "battle-select" ? "app-frame--practice" : ""} visual-theme--${visualTheme}`}>
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
        {visualTheme === "type-console" && view !== "practice" && view !== "battle-select" && (
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
                      <small>{selectedFighter.role} / {selectedFighter.weapon}</small>
                      <h2>{selectedFighter.name}</h2>
                      <p>{selectedFighter.tagline}</p>
                    </div>
                    <button className="fighter-select__start" onClick={startSelectedBattle} aria-keyshortcuts="Enter">
                      <span>[ ENTER ]</span>
                      이 전투원으로 시작
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
                        <em>{fighter.weapon}</em>
                      </span>
                    </button>
                  ))}
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
                    <button onClick={() => setView("home")} aria-label="말씀 전투를 닫고 홈으로" aria-keyshortcuts="Escape">[ ESC ] 나가기</button>
                    <div>
                      <span>{selectedFighter.name} / {selectedFighter.role}</span>
                      <h1>{referenceFor(currentUnit, currentBook)}</h1>
                    </div>
                    <p>오늘 <strong>{todayCompleted}/{progress.dailyGoal}</strong>절</p>
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

                  {!result ? (
                    <div className="battle-shell">
                      <section className="battle-arena" aria-label={`어둠의 시험 체력 ${battleHealth}%`}>
                        <div className="battle-boss-bar">
                          <div>
                            <span>어둠의 시험</span>
                            <strong>{battleHealth}<small>%</small></strong>
                          </div>
                          <div className="battle-health-track" role="progressbar" aria-label="마귀 남은 체력" aria-valuemin={0} aria-valuemax={100} aria-valuenow={battleHealth}>
                            <i style={{ width: `${battleHealth}%` }} />
                          </div>
                        </div>

                        <div className="battle-field">
                          <div
                            className={`battle-fighter-wrap ${battleFeedback?.kind === "hit" ? "is-attacking" : battleFeedback?.kind === "miss" ? "is-recoiling" : ""}`}
                            key={`fighter-${selectedFighter.id}-${battleFeedback?.id ?? 0}`}
                          >
                            <div className="battle-fighter-name">
                              <small>{selectedFighter.role}</small>
                              <strong>{selectedFighter.name}</strong>
                            </div>
                            <Image
                              className="battle-fighter"
                              src={selectedFighter.asset}
                              width={selectedFighter.width}
                              height={selectedFighter.height}
                              sizes="(max-width: 820px) 44vw, 30vw"
                              priority
                              alt={`${selectedFighter.weapon}을 든 전투원 ${selectedFighter.name}`}
                            />
                          </div>

                          <aside className="battle-power-meter" aria-label="말씀 전투 점수">
                            <span>말씀의 힘</span>
                            <strong>{formatNumber(battleScore)}</strong>
                            <small>{battlePower}</small>
                            <div><b>{currentCombo}</b> COMBO</div>
                          </aside>

                          <div className="battle-enemy-wrap" key={`enemy-${battleFeedback?.id ?? 0}`}>
                            <span>WEAK POINT</span>
                            <Image
                              className="battle-enemy"
                              src="/game-assets/word-battle-enemy.png"
                              width={720}
                              height={576}
                              priority
                              alt="말씀의 힘에 맞서는 돌 마귀"
                            />
                          </div>

                          {battleEffectsEnabled && battleFeedback?.kind === "hit" && (
                            <div className={`battle-hit-fx is-strength-${battleFeedback.strength}`} key={`hit-${battleFeedback.id}`} aria-hidden="true">
                              <Image className="battle-projectile" src="/game-assets/word-projectile-streak.webp" width={960} height={167} alt="" />
                              <Image className="battle-impact" src="/game-assets/word-impact-burst.webp" width={560} height={543} alt="" />
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
                                          src="/game-assets/word-impact-burst.webp"
                                          width={560}
                                          height={543}
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
                          <button onClick={goRandom}>다른 구절</button>
                        </div>
                      </section>
                    </div>
                  ) : (
                    <div className="battle-victory" aria-live="polite">
                      <div className="battle-victory__visual" aria-hidden="true">
                        {battleEffectsEnabled && <Image className="battle-victory__burst" src="/game-assets/word-impact-burst.webp" width={560} height={543} alt="" />}
                        <Image className="battle-victory__enemy" src="/game-assets/word-battle-enemy.png" width={720} height={576} alt="" />
                        <Image
                          className="battle-victory__fighter"
                          src={selectedFighter.asset}
                          width={selectedFighter.width}
                          height={selectedFighter.height}
                          alt=""
                        />
                      </div>
                      <span>{selectedFighter.name} 승리 / {referenceFor(currentUnit, currentBook)}</span>
                      <h2>어둠을 물리쳤습니다.</h2>
                      <p>“{currentUnit.t}”</p>
                      <div className="battle-victory__stats">
                        <div><strong>{formatNumber(battleScore)}</strong><span>전투 점수</span></div>
                        <div><strong>{result.cpm}</strong><span>타/분</span></div>
                        <div><strong>{result.accuracy.toFixed(1)}</strong><span>정확도 %</span></div>
                      </div>
                      <div className="battle-victory__actions">
                        <button onClick={goToNext}>다음 전투</button>
                        <button onClick={resetPractice}>한 번 더</button>
                      </div>
                    </div>
                  )}
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
