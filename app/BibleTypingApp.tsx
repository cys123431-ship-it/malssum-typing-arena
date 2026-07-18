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
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ListIcon,
  MoonIcon,
  SunIcon,
  XIcon,
} from "@phosphor-icons/react";

type View = "home" | "library" | "practice" | "progress";

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

const STORAGE_KEY = "bible-typing-progress-v1";

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

export function BibleTypingApp() {
  const [bible, setBible] = useState<BibleData | null>(null);
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);
  const [view, setView] = useState<View>("home");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [clock, setClock] = useState(Date.now());
  const [keystrokes, setKeystrokes] = useState(0);
  const [errors, setErrors] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [libraryTestament, setLibraryTestament] = useState<"전체" | "구약" | "신약">("전체");
  const [theme, setTheme] = useState<"light" | "dark">("light");
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

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("bible-typing-theme");
    const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(savedTheme === "dark" || (!savedTheme && preferredDark) ? "dark" : "light");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("bible-typing-theme", theme);
  }, [theme]);

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
  const todayPercent = Math.min(100, (todayCompleted / progress.dailyGoal) * 100);
  const streak = calculateStreak(progress.days);
  const averageAccuracy = progress.totalTypedChars
    ? (progress.correctChars / progress.totalTypedChars) * 100
    : 0;
  const currentUnit = bible?.units[currentIndex];
  const currentBook = currentUnit ? booksByCode.get(currentUnit.b) : undefined;
  const homeUnit = bible?.units[progress.currentIndex] ?? bible?.units[0];
  const homeBook = homeUnit ? booksByCode.get(homeUnit.b) : undefined;
  const elapsedSeconds = startedAt ? Math.max(0.1, (clock - startedAt) / 1000) : 0;
  const liveCorrectKeystrokes = Math.max(0, keystrokes - errors);
  const liveCpm = startedAt ? Math.round((liveCorrectKeystrokes / elapsedSeconds) * 60) : 0;
  const liveAccuracy = keystrokes ? Math.max(0, ((keystrokes - errors) / keystrokes) * 100) : 100;
  const verseProgress = currentUnit ? Math.min(1, typed.length / Math.max(1, currentUnit.t.length)) : 0;
  const activeSegment = Math.min(10, Math.floor(verseProgress * 10) + 1);
  let currentCombo = 0;
  if (currentUnit) {
    for (let index = 0; index < typed.length; index += 1) {
      currentCombo = typed[index] === currentUnit.t[index] ? currentCombo + 1 : 0;
    }
  }

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
    startedAtRef.current = null;
    keystrokesRef.current = 0;
    errorsRef.current = 0;
    isComposingRef.current = false;
    compositionBaseRef.current = "";
    completionLockRef.current = false;
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }, []);

  const openPractice = useCallback((index: number, startsNewSession: boolean) => {
    if (!bible) return;
    const safeIndex = Math.max(0, Math.min(index, bible.units.length - 1));
    if (startsNewSession) sessionResultShownRef.current = false;
    setCurrentIndex(safeIndex);
    setProgress((previous) => ({ ...previous, currentIndex: safeIndex }));
    setView("practice");
    resetPractice();
  }, [bible, resetPractice]);

  const beginPractice = useCallback((index: number) => {
    openPractice(index, true);
  }, [openPractice]);

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
    if (nextValue.length > baseline.length) {
      for (let index = baseline.length; index < nextValue.length; index += 1) {
        nextKeystrokes += 1;
        if (nextValue[index] !== currentUnit.t[index]) nextErrors += 1;
      }
      keystrokesRef.current = nextKeystrokes;
      errorsRef.current = nextErrors;
      setKeystrokes(nextKeystrokes);
      setErrors(nextErrors);
    }

    setTyped(nextValue);
    if (start && nextValue.length === currentUnit.t.length) {
      finishPractice(nextKeystrokes, nextErrors, start);
    }
  }, [currentUnit, finishPractice, result]);

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
    <div className={`app-frame app-frame--${view} ${view === "practice" ? "app-frame--practice" : ""}`}>
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
