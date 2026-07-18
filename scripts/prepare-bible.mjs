import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(scriptDir, "..");
const sourcePath = resolve(projectDir, "..", "개역개정4판(구약+신약).txt");
const outputPath = resolve(projectDir, "public", "data", "bible.json");

const bookEntries = [
  ["창", "창세기", "구약"], ["출", "출애굽기", "구약"], ["레", "레위기", "구약"],
  ["민", "민수기", "구약"], ["신", "신명기", "구약"], ["수", "여호수아", "구약"],
  ["삿", "사사기", "구약"], ["룻", "룻기", "구약"], ["삼상", "사무엘상", "구약"],
  ["삼하", "사무엘하", "구약"], ["왕상", "열왕기상", "구약"], ["왕하", "열왕기하", "구약"],
  ["대상", "역대상", "구약"], ["대하", "역대하", "구약"], ["스", "에스라", "구약"],
  ["느", "느헤미야", "구약"], ["에", "에스더", "구약"], ["욥", "욥기", "구약"],
  ["시", "시편", "구약"], ["잠", "잠언", "구약"], ["전", "전도서", "구약"],
  ["아", "아가", "구약"], ["사", "이사야", "구약"], ["렘", "예레미야", "구약"],
  ["애", "예레미야애가", "구약"], ["겔", "에스겔", "구약"], ["단", "다니엘", "구약"],
  ["호", "호세아", "구약"], ["욜", "요엘", "구약"], ["암", "아모스", "구약"],
  ["옵", "오바댜", "구약"], ["욘", "요나", "구약"], ["미", "미가", "구약"],
  ["나", "나훔", "구약"], ["합", "하박국", "구약"], ["습", "스바냐", "구약"],
  ["학", "학개", "구약"], ["슥", "스가랴", "구약"], ["말", "말라기", "구약"],
  ["마", "마태복음", "신약"], ["막", "마가복음", "신약"], ["눅", "누가복음", "신약"],
  ["요", "요한복음", "신약"], ["행", "사도행전", "신약"], ["롬", "로마서", "신약"],
  ["고전", "고린도전서", "신약"], ["고후", "고린도후서", "신약"], ["갈", "갈라디아서", "신약"],
  ["엡", "에베소서", "신약"], ["빌", "빌립보서", "신약"], ["골", "골로새서", "신약"],
  ["살전", "데살로니가전서", "신약"], ["살후", "데살로니가후서", "신약"],
  ["딤전", "디모데전서", "신약"], ["딤후", "디모데후서", "신약"], ["딛", "디도서", "신약"],
  ["몬", "빌레몬서", "신약"], ["히", "히브리서", "신약"], ["약", "야고보서", "신약"],
  ["벧전", "베드로전서", "신약"], ["벧후", "베드로후서", "신약"],
  ["요일", "요한일서", "신약"], ["요이", "요한이서", "신약"], ["요삼", "요한삼서", "신약"],
  ["유", "유다서", "신약"], ["계", "요한계시록", "신약"],
];

const bookMap = new Map(bookEntries.map(([code, name, testament], order) => [
  code,
  { code, name, testament, order },
]));

function cleanText(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const bytes = await readFile(sourcePath);
const source = new TextDecoder("euc-kr").decode(bytes);
const bookCodePattern = [...bookMap.keys()]
  .sort((a, b) => b.length - a.length)
  .join("|");
const sourceWithRecoveredBreaks = source.replace(
  new RegExp(`([^\\r\\n])(?=((?:${bookCodePattern}))[0-9]+:[0-9]+(?:-[0-9]+)?\\s)`, "g"),
  (match, previousCharacter, followingBookCode) => (
    bookMap.has(`${previousCharacter}${followingBookCode}`)
      ? match
      : `${previousCharacter}\n`
  ),
);
const lines = sourceWithRecoveredBreaks.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const units = [];
const anomalies = [];

for (let index = 0; index < lines.length; index += 1) {
  const line = lines[index];
  let match = line.match(/^([^0-9]+)([0-9]+):([0-9]+)(?:-([0-9]+))?\s+(.+)$/);
  let book;
  let chapter;
  let verseStart;
  let verseEnd;
  let text;

  if (match) {
    [, book] = match;
    chapter = Number(match[2]);
    verseStart = Number(match[3]);
    verseEnd = match[4] ? Number(match[4]) : verseStart;
    text = cleanText(match[5]);
  } else {
    match = line.match(/^([^0-9]+)([0-9]+):(.+)$/);
    if (!match) {
      anomalies.push({ line: index + 1, reason: "unrecognized", source: line.slice(0, 80) });
      continue;
    }

    [, book] = match;
    chapter = Number(match[2]);
    if (/^제[이삼사오]권\s*$/.test(match[3].trim())) {
      anomalies.push({ line: index + 1, reason: "skipped-section-heading" });
      continue;
    }
    const previousUnit = units.at(-1);
    if (previousUnit && previousUnit.b === book && previousUnit.c === chapter) {
      previousUnit.t = `${previousUnit.t} ${cleanText(match[3])}`;
      anomalies.push({ line: index + 1, reason: "merged-continuation", id: previousUnit.id });
      continue;
    }

    anomalies.push({ line: index + 1, reason: "orphan-continuation", source: line.slice(0, 80) });
    continue;
  }

  if (!bookMap.has(book) || !text || verseStart < 1 || verseEnd < verseStart) {
    anomalies.push({ line: index + 1, reason: "invalid", source: line.slice(0, 80) });
    continue;
  }

  const verseLabel = verseEnd === verseStart ? `${verseStart}` : `${verseStart}-${verseEnd}`;
  units.push({
    id: `${book}${chapter}:${verseLabel}`,
    b: book,
    c: chapter,
    v: verseStart,
    ...(verseEnd !== verseStart ? { e: verseEnd } : {}),
    w: verseEnd - verseStart + 1,
    t: text,
  });
}

const books = bookEntries.map(([code, name, testament], order) => {
  const bookUnits = units.filter((unit) => unit.b === code);
  return {
    code,
    name,
    testament,
    order,
    chapters: Math.max(...bookUnits.map((unit) => unit.c)),
    units: bookUnits.length,
    verses: bookUnits.reduce((sum, unit) => sum + unit.w, 0),
  };
});

const duplicateIds = units
  .map((unit) => unit.id)
  .filter((id, index, all) => all.indexOf(id) !== index);

if (books.length !== 66 || duplicateIds.length > 0) {
  throw new Error(`Bible validation failed: books=${books.length}, duplicates=${duplicateIds.length}, sample=${duplicateIds.slice(0, 12).join(",")}`);
}

const payload = {
  version: "개역개정4판",
  generatedAt: new Date().toISOString(),
  totalUnits: units.length,
  totalVerses: units.reduce((sum, unit) => sum + unit.w, 0),
  books,
  units,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(payload), "utf8");

console.log(JSON.stringify({
  outputPath,
  books: books.length,
  totalUnits: payload.totalUnits,
  totalVerses: payload.totalVerses,
  anomalies: anomalies.length,
  mergedContinuations: anomalies.filter((item) => item.reason === "merged-continuation").length,
}, null, 2));
