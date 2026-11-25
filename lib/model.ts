export interface SignalBreakdown {
  punchline: number;
  brevity: number;
  helplessness: number;
  desperation: number;
  clarity: number;
  novelty: number;
  external: number;
}

export interface SnapshotItem {
  id: string;
  title: string;
  line: string;
  customer: string;
  category: string;
  status: string;
  severity: number;
  signals: Record<string, number>;
  tags: string[];
  createdAt: string;
  meta: Record<string, unknown>;
}

export interface Snapshot {
  version: string;
  source: string;
  title: string;
  generatedAt: string;
  count: number;
  items: SnapshotItem[];
  issues: SnapshotItem[];
}

export interface RadarWeights {
  punchline: number;
  brevity: number;
  helplessness: number;
  desperation: number;
  clarity: number;
  novelty: number;
  external: number;
}

export interface RankedItem extends SnapshotItem {
  rank: number;
  score: number;
  score100: number;
  confidence: number;
  tier: "adopt" | "trial" | "assess" | "hold";
  ring: "adopt" | "trial" | "assess" | "hold";
  quadrant: string;
  priority: "P0" | "P1" | "P2" | "P3";
  charCount: number;
  underLimit: boolean;
  breakdown: SignalBreakdown;
  hash: string;
}

export interface BoardIssue {
  id: string;
  key: string;
  rank: number;
  title: string;
  line: string;
  customer: string;
  summary: string;
  body: string;
  priority: "P0" | "P1" | "P2" | "P3";
  severity: number;
  status: string;
  column: string;
  lane: string;
  tier: "adopt" | "trial" | "assess" | "hold";
  score: number;
  charCount: number;
  underLimit: boolean;
  signals: SignalBreakdown;
  labels: string[];
  createdAt: string;
}

export interface RadarSummary {
  total: number;
  underLimitCount: number;
  avgScore: number;
  topScore: number;
  topId: string;
  categories: Record<string, number>;
  signalAverages: SignalBreakdown;
}

export interface Radar {
  version: string;
  title: string;
  generatedAt: string;
  weights: RadarWeights;
  winner: RankedItem | null;
  topLine: string;
  line: string;
  ranked: RankedItem[];
  items: RankedItem[];
  blips: RankedItem[];
  issues: BoardIssue[];
  quadrants: Record<string, RankedItem[]>;
  rings: Record<string, RankedItem[]>;
  summary: RadarSummary;
}

export interface BuildRadarOptions {
  title?: string;
  weights?: Partial<RadarWeights>;
  limit?: number;
  maxChars?: number;
}

export interface DataScriptOptions {
  id?: string;
  varName?: string;
  wrap?: boolean;
  pretty?: boolean;
}

const DEFAULT_TIMESTAMP = "2026-01-01T00:00:00Z";
const DEFAULT_MAX_CHARS = 200;

const DEFAULT_WEIGHTS: RadarWeights = {
  punchline: 0.26,
  brevity: 0.2,
  helplessness: 0.2,
  desperation: 0.12,
  clarity: 0.1,
  novelty: 0.06,
  external: 0.06,
};

const DEFAULT_SEEDS: ReadonlyArray<Partial<SnapshotItem>> = [
  {
    id: "ts-01",
    title: "Senior Engineer Escalation Loop",
    line: "I've escalated your outage to our senior engineer; unfortunately, his ticket says you need to reboot the router while I close this chat as resolved.",
    customer: "Production is down and the checkout page is on fire.",
    category: "escalation",
    status: "open",
    severity: 0.96,
    tags: ["escalation", "router", "ticket", "outage"],
  },
  {
    id: "ts-02",
    title: "Unsupported Legacy Format",
    line: "Good news: your deleted files aren't lost—they're just permanently stored in an unsupported legacy format we call 'gone.' Please rate me five stars.",
    customer: "Your sync client wiped five years of tax records.",
    category: "storage",
    status: "open",
    severity: 0.94,
    tags: ["backup", "data-loss", "survey", "legacy"],
  },
  {
    id: "ts-03",
    title: "Firewall Catch-22",
    line: "I see the error: your firewall is blocking your internet, and you'll need internet access to download the patch that disables the firewall.",
    customer: "I cannot get online after installing your mandatory security update.",
    category: "network",
    status: "open",
    severity: 0.89,
    tags: ["firewall", "patch", "network", "loop"],
  },
  {
    id: "ts-04",
    title: "Thirty Seconds to Acceptance",
    line: "Have you tried turning it off, waiting thirty seconds, and accepting that some problems are between you and a newer laptop?",
    customer: "My laptop freezes every time I open a spreadsheet.",
    category: "hardware",
    status: "open",
    severity: 0.82,
    tags: ["reboot", "hardware", "acceptance"],
  },
  {
    id: "ts-05",
    title: "Third-Party Smoke Feature",
    line: "Our system shows your account is working fine, which means the smoke coming out of your laptop is technically a third-party hardware feature.",
    customer: "My charger sparked and the keyboard smells like burnt toast.",
    category: "hardware",
    status: "open",
    severity: 0.91,
    tags: ["hardware", "warranty", "works-on-my-machine"],
  },
  {
    id: "ts-06",
    title: "Unplanned Maintenance Opportunity",
    line: "Your server isn't down, it's just experiencing an unplanned maintenance opportunity; try clearing your cookies and lowering your expectations.",
    customer: "All customer dashboards return HTTP 503.",
    category: "outage",
    status: "open",
    severity: 0.88,
    tags: ["outage", "cookies", "status-page"],
  },
  {
    id: "ts-07",
    title: "Minimized Resolution",
    line: "I've fixed the issue on my screen by minimizing your ticket; if the problem persists, please unplug the router and hold for a different department.",
    customer: "I have been on hold for ninety minutes about billing double-charges.",
    category: "triage",
    status: "open",
    severity: 0.85,
    tags: ["ticket", "hold", "router", "triage"],
  },
  {
    id: "ts-08",
    title: "Q4 Roadmap Workaround",
    line: "That's a known bug with a simple workaround: stop clicking the button you paid for and wait for our Q4 roadmap.",
    customer: "The export button crashes the desktop app every time.",
    category: "product",
    status: "open",
    severity: 0.78,
    tags: ["bug", "workaround", "roadmap"],
  },
];

const TROPE_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(reboot|restart|turn(?:ing)?\s+it\s+off|unplug)\b/i,
  /\b(router|modem|cookies|cache|firewall|patch)\b/i,
  /\b(ticket|escalat\w+|resolved|closed?|minimizing|department|hold)\b/i,
  /\b(five\s+stars|rate\s+me|survey|roadmap|workaround|known\s+bug)\b/i,
  /\b(working\s+fine|third[- ]party|legacy|unplanned\s+maintenance|expectations)\b/i,
  /\b(good\s+news|unfortunately|technically|simply|just)\b/i,
];

const SEVERITY_MAP: Record<string, number> = {
  critical: 0.98,
  p0: 0.98,
  blocker: 0.95,
  urgent: 0.92,
  high: 0.84,
  p1: 0.84,
  medium: 0.62,
  normal: 0.58,
  p2: 0.6,
  low: 0.35,
  minor: 0.3,
  p3: 0.32,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function round4(value: number): number {
  return Math.round(clamp01(value) * 10000) / 10000;
}

function fnv1a32(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function cleanText(value: unknown): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function parseNumericSignal(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value < 0) return 0;
    if (value <= 1) return value;
    if (value <= 10) return value / 10;
    if (value <= 100) return value / 100;
    return clamp01(Math.log10(value + 1) / 4);
  }
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (lower in SEVERITY_MAP) return SEVERITY_MAP[lower];
    const parsed = Number(lower);
    if (Number.isFinite(parsed) && lower !== "") return parseNumericSignal(parsed);
  }
  return null;
}

function extractSignals(raw: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  const containers = [raw.signals, raw.metrics, raw.scores, raw.breakdown];
  for (const box of containers) {
    if (!isRecord(box)) continue;
    for (const key of Object.keys(box).sort()) {
      const n = parseNumericSignal(box[key]);
      if (n !== null) out[key] = round4(n);
    }
  }
  const topKeys = ["wit", "irony", "brevity", "impact", "urgency", "confidence", "frequency", "votes", "novelty"];
  for (const key of topKeys) {
    if (key in out) continue;
    const n = parseNumericSignal(raw[key]);
    if (n !== null) out[key] = round4(n);
  }
  return out;
}

function extractTags(raw: Record<string, unknown>, category: string): string[] {
  const source = raw.tags ?? raw.labels ?? raw.keywords;
  const set = new Set<string>();
  if (Array.isArray(source)) {
    for (const entry of source) {
      const tag = cleanText(entry).toLowerCase();
      if (tag) set.add(tag);
    }
  } else if (typeof source === "string") {
    for (const part of source.split(/[,;]+/)) {
      const tag = cleanText(part).toLowerCase();
      if (tag) set.add(tag);
    }
  }
  if (category) set.add(category.toLowerCase());
  return Array.from(set).sort();
}

function normalizeItem(raw: unknown, index: number): SnapshotItem {
  if (typeof raw === "string") {
    const parts = raw.split("|").map((p) => p.trim()).filter(Boolean);
    const line = parts.length >= 3 ? parts[2] : parts[parts.length - 1] ?? "";
    const title = parts.length >= 2 ? parts[1] : line.slice(0, 64);
    const id = parts.length >= 3 ? parts[0] : `ts-${String(index + 1).padStart(2, "0")}`;
    return {
      id,
      title: title || `Ticket ${index + 1}`,
      line: line || DEFAULT_SEEDS[0].line!,
      customer: "Customer requesting urgent resolution.",
      category: "triage",
      status: "open",
      severity: 0.72,
      signals: {},
      tags: ["triage"],
      createdAt: DEFAULT_TIMESTAMP,
      meta: {},
    };
  }

  const obj = isRecord(raw) ? raw : {};
  const line =
    cleanText(obj.line) ||
    cleanText(obj.quote) ||
    cleanText(obj.reply) ||
    cleanText(obj.response) ||
    cleanText(obj.text) ||
    cleanText(obj.message) ||
    cleanText(obj.body) ||
    cleanText(obj.description) ||
    cleanText(obj.title) ||
    DEFAULT_SEEDS[index % DEFAULT_SEEDS.length].line!;

  const id =
    cleanText(obj.id) ||
    cleanText(obj.key) ||
    cleanText(obj.slug) ||
    `ts-${String(index + 1).padStart(2, "0")}`;

  const title =
    cleanText(obj.title) ||
    cleanText(obj.subject) ||
    cleanText(obj.name) ||
    cleanText(obj.summary) ||
    (line.length > 64 ? `${line.slice(0, 61)}...` : line);

  const customer =
    cleanText(obj.customer) ||
    cleanText(obj.symptom) ||
    cleanText(obj.problem) ||
    cleanText(obj.context) ||
    cleanText(obj.prompt) ||
    "Desperate customer waiting on live tech support.";

  const category = (
    cleanText(obj.category) ||
    cleanText(obj.quadrant) ||
    cleanText(obj.lane) ||
    cleanText(obj.group) ||
    cleanText(obj.type) ||
    "triage"
  ).toLowerCase();

  const status = (cleanText(obj.status) || cleanText(obj.state) || "open").toLowerCase();
  const severity = round4(
    parseNumericSignal(obj.severity) ??
      parseNumericSignal(obj.priority) ??
      parseNumericSignal(obj.urgency) ??
      0.75
  );
  const createdAt = cleanText(obj.createdAt) || cleanText(obj.timestamp) || DEFAULT_TIMESTAMP;
  const meta = isRecord(obj.meta) ? { ...obj.meta } : {};

  return {
    id,
    title,
    line,
    customer,
    category,
    status,
    severity,
    signals: extractSignals(obj),
    tags: extractTags(obj, category),
    createdAt,
    meta,
  };
}

function parsePlainLines(text: string): SnapshotItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  if (lines.length === 0) return DEFAULT_SEEDS.map((seed, i) => normalizeItem(seed, i));
  return lines.map((line, i) => normalizeItem(line, i));
}

export function parseSnapshot(input?: unknown): Snapshot {
  let raw: unknown = input;
  let source = "builtin-seed";

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) {
      raw = null;
    } else {
      try {
        raw = JSON.parse(trimmed);
        source = "json-string";
      } catch {
        const items = parsePlainLines(trimmed);
        return {
          version: "1.0",
          source: "text-lines",
          title: "Have You Tried Turning It Off?",
          generatedAt: DEFAULT_TIMESTAMP,
          count: items.length,
          items,
          issues: items.slice(),
        };
      }
    }
  } else if (input !== undefined && input !== null) {
    source = "object-input";
  }

  let title = "Have You Tried Turning It Off?";
  let generatedAt = DEFAULT_TIMESTAMP;
  let list: unknown[] | null = null;

  if (Array.isArray(raw)) {
    list = raw;
  } else if (isRecord(raw)) {
    title = cleanText(raw.title) || cleanText(raw.name) || title;
    generatedAt = cleanText(raw.generatedAt) || cleanText(raw.timestamp) || generatedAt;
    source = cleanText(raw.source) || source;
    const arrayKeys = ["items", "issues", "tickets", "lines", "entries", "candidates", "signals", "records", "data"];
    for (const key of arrayKeys) {
      if (Array.isArray(raw[key])) {
        list = raw[key] as unknown[];
        break;
      }
    }
    if (list === null) {
      if (raw.line || raw.text || raw.quote || raw.title || raw.message) {
        list = [raw];
      }
    }
  } else if (raw !== null && raw !== undefined) {
    list = [String(raw)];
  }

  const items =
    list === null
      ? DEFAULT_SEEDS.map((seed, i) => normalizeItem(seed, i))
      : list.map((entry, i) => normalizeItem(entry, i));

  return {
    version: "1.0",
    source,
    title,
    generatedAt,
    count: items.length,
    items,
    issues: items.slice(),
  };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9']+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function normalizeWeights(custom?: Partial<RadarWeights>): RadarWeights {
  const merged: RadarWeights = {
    punchline: custom?.punchline ?? DEFAULT_WEIGHTS.punchline,
    brevity: custom?.brevity ?? DEFAULT_WEIGHTS.brevity,
    helplessness: custom?.helplessness ?? DEFAULT_WEIGHTS.helplessness,
    desperation: custom?.desperation ?? DEFAULT_WEIGHTS.desperation,
    clarity: custom?.clarity ?? DEFAULT_WEIGHTS.clarity,
    novelty: custom?.novelty ?? DEFAULT_WEIGHTS.novelty,
    external: custom?.external ?? DEFAULT_WEIGHTS.external,
  };
  const total =
    merged.punchline +
    merged.brevity +
    merged.helplessness +
    merged.desperation +
    merged.clarity +
    merged.novelty +
    merged.external;
  if (total <= 0) return { ...DEFAULT_WEIGHTS };
  return {
    punchline: merged.punchline / total,
    brevity: merged.brevity / total,
    helplessness: merged.helplessness / total,
    desperation: merged.desperation / total,
    clarity: merged.clarity / total,
    novelty: merged.novelty / total,
    external: merged.external / total,
  };
}

function scoreBrevity(line: string, maxChars: number): number {
  const len = line.length;
  if (len === 0) return 0;
  if (len > maxChars) return clamp01(0.25 * (maxChars / len));
  if (len >= 85 && len <= 165) return 1;
  if (len < 85) return clamp01(0.45 + (len / 85) * 0.55);
  return clamp01(0.82 + ((maxChars - len) / Math.max(1, maxChars - 165)) * 0.18);
}

function scorePunchline(line: string): number {
  let score = 0.42;
  if (/[;:—–]/.test(line)) score += 0.22;
  if (/['"?!]/.test(line)) score += 0.14;
  if (/\b(but|while|which means|unfortunately|good news|technically|workaround)\b/i.test(line)) score += 0.18;
  const words = tokenize(line);
  if (words.length >= 12 && words.length <= 32) score += 0.12;
  return clamp01(score);
}

function scoreHelplessness(line: string): number {
  let hits = 0;
  for (const pattern of TROPE_PATTERNS) {
    if (pattern.test(line)) hits += 1;
  }
  return clamp01(0.25 + hits * 0.18);
}

function scoreClarity(line: string): number {
  const words = tokenize(line);
  if (words.length === 0) return 0;
  const unique = new Set(words).size;
  const diversity = unique / words.length;
  const avgLen = words.reduce((acc, w) => acc + w.length, 0) / words.length;
  const lenBalance = avgLen >= 4 && avgLen <= 7.5 ? 1 : clamp01(1 - Math.abs(avgLen - 5.75) / 6);
  return clamp01(diversity * 0.65 + lenBalance * 0.35);
}

function computeDocFreq(items: SnapshotItem[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const item of items) {
    const seen = new Set(tokenize(item.line));
    for (const token of seen) {
      freq.set(token, (freq.get(token) ?? 0) + 1);
    }
  }
  return freq;
}

function scoreNovelty(item: SnapshotItem, totalItems: number, docFreq: Map<string, number>): number {
  const tokens = Array.from(new Set(tokenize(item.line)));
  if (tokens.length === 0) return 0;
  if (totalItems <= 1) return 0.75;
  let raritySum = 0;
  for (const token of tokens) {
    const df = docFreq.get(token) ?? 1;
    raritySum += 1 - (df - 1) / Math.max(1, totalItems - 1);
  }
  return clamp01(raritySum / tokens.length);
}

function scoreExternal(item: SnapshotItem): number {
  const values = Object.values(item.signals);
  if (values.length === 0) return clamp01(0.5 + item.severity * 0.3);
  const avg = values.reduce((sum, n) => sum + n, 0) / values.length;
  return clamp01(avg);
}

function tierFor(rank: number, score: number, underLimit: boolean): "adopt" | "trial" | "assess" | "hold" {
  if (!underLimit) return "hold";
  if (rank === 1 || score >= 0.84) return "adopt";
  if (score >= 0.74) return "trial";
  if (score >= 0.62) return "assess";
  return "hold";
}

function priorityFor(tier: "adopt" | "trial" | "assess" | "hold", severity: number): "P0" | "P1" | "P2" | "P3" {
  if (tier === "adopt" || severity >= 0.92) return "P0";
  if (tier === "trial" || severity >= 0.8) return "P1";
  if (tier === "assess" || severity >= 0.6) return "P2";
  return "P3";
}

function rankOne(
  item: SnapshotItem,
  weights: RadarWeights,
  maxChars: number,
  totalItems: number,
  docFreq: Map<string, number>
): RankedItem {
  const breakdown: SignalBreakdown = {
    punchline: round4(scorePunchline(item.line)),
    brevity: round4(scoreBrevity(item.line, maxChars)),
    helplessness: round4(scoreHelplessness(item.line)),
    desperation: round4(item.severity),
    clarity: round4(scoreClarity(item.line)),
    novelty: round4(scoreNovelty(item, totalItems, docFreq)),
    external: round4(scoreExternal(item)),
  };

  const weighted =
    breakdown.punchline * weights.punchline +
    breakdown.brevity * weights.brevity +
    breakdown.helplessness * weights.helplessness +
    breakdown.desperation * weights.desperation +
    breakdown.clarity * weights.clarity +
    breakdown.novelty * weights.novelty +
    breakdown.external * weights.external;

  const charCount = item.line.length;
  const underLimit = charCount > 0 && charCount <= maxChars;
  const score = round4(underLimit ? weighted : weighted * 0.55);
  const score100 = Math.round(score * 1000) / 10;
  const signalCount = Object.keys(item.signals).length;
  const confidence = round4(0.72 + Math.min(0.24, signalCount * 0.04) + (underLimit ? 0.04 : 0));

  return {
    ...item,
    rank: 0,
    score,
    score100,
    confidence,
    tier: "assess",
    ring: "assess",
    quadrant: item.category,
    priority: "P2",
    charCount,
    underLimit,
    breakdown,
    hash: fnv1a32(`${item.id}\0${item.line}`),
  };
}

function compareRanked(a: RankedItem, b: RankedItem): number {
  if (b.score !== a.score) return b.score - a.score;
  if (a.underLimit !== b.underLimit) return a.underLimit ? -1 : 1;
  if (b.breakdown.punchline !== a.breakdown.punchline) return b.breakdown.punchline - a.breakdown.punchline;
  if (b.breakdown.helplessness !== a.breakdown.helplessness) return b.breakdown.helplessness - a.breakdown.helplessness;
  if (a.hash !== b.hash) return a.hash < b.hash ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function isRadarLike(value: unknown): value is Radar {
  return isRecord(value) && Array.isArray(value.ranked) && "topLine" in value;
}

function isRankedLike(value: unknown): value is RankedItem {
  return isRecord(value) && typeof value.score === "number" && isRecord(value.breakdown);
}

export function boardIssue(
  input?: unknown,
  options?: number | { rank?: number; column?: string }
): BoardIssue {
  let target: RankedItem;
  const optObj = typeof options === "number" ? { rank: options + 1 } : options ?? {};

  if (isRadarLike(input)) {
    const idx = typeof options === "number" ? options : 0;
    const picked = input.ranked[idx] ?? input.winner ?? input.ranked[0];
    target = picked ?? buildRadar().ranked[0];
  } else if (isRankedLike(input)) {
    target = input;
  } else if (input === undefined || input === null) {
    target = buildRadar().ranked[0];
  } else {
    const item = normalizeItem(input, 0);
    const ranked = rankOne(item, DEFAULT_WEIGHTS, DEFAULT_MAX_CHARS, 1, computeDocFreq([item]));
    ranked.rank = optObj.rank ?? 1;
    ranked.tier = tierFor(ranked.rank, ranked.score, ranked.underLimit);
    ranked.ring = ranked.tier;
    ranked.priority = priorityFor(ranked.tier, ranked.severity);
    target = ranked;
  }

  const rank = optObj.rank ?? (target.rank > 0 ? target.rank : 1);
  const key = `SUP-${String(rank).padStart(3, "0")}`;
  const column =
    optObj.column ??
    (target.tier === "adopt"
      ? "Escalated"
      : target.tier === "trial"
        ? "Triage"
        : target.tier === "assess"
          ? "Backlog"
          : "Closed as Works-On-My-Machine");

  const summary = `${target.line} (${target.charCount} chars, score ${target.score100})`;
  const body = [
    `> "${target.line}"`,
    "",
    `- Customer report: ${target.customer}`,
    `- Priority: ${target.priority} | Column: ${column} | Tier: ${target.tier}`,
    `- Length: ${target.charCount}/${DEFAULT_MAX_CHARS} chars (${target.underLimit ? "valid" : "over-limit"})`,
    `- Multi-signal score: ${target.score100}/100 (punchline=${target.breakdown.punchline}, brevity=${target.breakdown.brevity}, helplessness=${target.breakdown.helplessness}, clarity=${target.breakdown.clarity})`,
  ].join("\n");

  const labels = Array.from(
    new Set([...target.tags, target.priority.toLowerCase(), target.tier, target.underLimit ? "under-200" : "over-200"])
  ).sort();

  const issue: BoardIssue = {
    id: target.id,
    key,
    rank,
    title: target.title,
    line: target.line,
    customer: target.customer,
    summary,
    body,
    priority: target.priority,
    severity: target.severity,
    status: target.status,
    column,
    lane: target.category,
    tier: target.tier,
    score: target.score,
    charCount: target.charCount,
    underLimit: target.underLimit,
    signals: { ...target.breakdown },
    labels,
    createdAt: target.createdAt,
  };

  Object.defineProperty(issue, "toString", {
    enumerable: false,
    value: () => `# ${issue.key}: ${issue.title}\n\n${issue.body}`,
  });

  return issue;
}

export function buildRadar(input?: unknown, options: BuildRadarOptions = {}): Radar {
  const snapshot =
    isRecord(input) && Array.isArray(input.items) && typeof input.version === "string"
      ? (input as unknown as Snapshot)
      : parseSnapshot(input);

  const weights = normalizeWeights(options.weights);
  const maxChars = options.maxChars && options.maxChars > 0 ? options.maxChars : DEFAULT_MAX_CHARS;
  const docFreq = computeDocFreq(snapshot.items);

  const scored = snapshot.items.map((item) => rankOne(item, weights, maxChars, snapshot.items.length, docFreq));
  scored.sort(compareRanked);

  const limited = options.limit && options.limit > 0 ? scored.slice(0, options.limit) : scored;
  const ranked = limited.map((item, idx) => {
    const rank = idx + 1;
    const tier = tierFor(rank, item.score, item.underLimit);
    return {
      ...item,
      rank,
      tier,
      ring: tier,
      priority: priorityFor(tier, item.severity),
    };
  });

  const quadrants: Record<string, RankedItem[]> = {};
  const rings: Record<string, RankedItem[]> = { adopt: [], trial: [], assess: [], hold: [] };
  const categories: Record<string, number> = {};
  const sigSum: SignalBreakdown = {
    punchline: 0,
    brevity: 0,
    helplessness: 0,
    desperation: 0,
    clarity: 0,
    novelty: 0,
    external: 0,
  };

  let scoreTotal = 0;
  let underLimitCount = 0;

  for (const item of ranked) {
    if (!quadrants[item.quadrant]) quadrants[item.quadrant] = [];
    quadrants[item.quadrant].push(item);
    rings[item.ring].push(item);
    categories[item.category] = (categories[item.category] ?? 0) + 1;
    scoreTotal += item.score;
    if (item.underLimit) underLimitCount += 1;
    sigSum.punchline += item.breakdown.punchline;
    sigSum.brevity += item.breakdown.brevity;
    sigSum.helplessness += item.breakdown.helplessness;
    sigSum.desperation += item.breakdown.desperation;
    sigSum.clarity += item.breakdown.clarity;
    sigSum.novelty += item.breakdown.novelty;
    sigSum.external += item.breakdown.external;
  }

  const count = Math.max(1, ranked.length);
  const winner = ranked[0] ?? null;
  const topLine = winner ? winner.line : DEFAULT_SEEDS[0].line!;
  const issues = ranked.map((item) => boardIssue(item));

  return {
    version: "1.0",
    title: options.title ?? snapshot.title,
    generatedAt: snapshot.generatedAt,
    weights,
    winner,
    topLine,
    line: topLine,
    ranked,
    items: ranked.slice(),
    blips: ranked.slice(),
    issues,
    quadrants,
    rings,
    summary: {
      total: ranked.length,
      underLimitCount,
      avgScore: ranked.length > 0 ? round4(scoreTotal / ranked.length) : 0,
      topScore: winner ? winner.score : 0,
      topId: winner ? winner.id : "",
      categories,
      signalAverages: {
        punchline: round4(sigSum.punchline / count),
        brevity: round4(sigSum.brevity / count),
        helplessness: round4(sigSum.helplessness / count),
        desperation: round4(sigSum.desperation / count),
        clarity: round4(sigSum.clarity / count),
        novelty: round4(sigSum.novelty / count),
        external: round4(sigSum.external / count),
      },
    },
  };
}

function canonicalize(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") return value.toString();
  if (typeof value !== "object") return undefined;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((item) => {
      const next = canonicalize(item, seen);
      return next === undefined ? null : next;
    });
  }
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    const next = canonicalize((value as Record<string, unknown>)[key], seen);
    if (next !== undefined) out[key] = next;
  }
  return out;
}

function escapeForHtmlScript(json: string): string {
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9._:-]/g, "-");
  return cleaned || "radar-data";
}

export function dataScript(first?: unknown, second?: unknown): string {
  let payload: unknown = first;
  let opts: DataScriptOptions = {};

  if (typeof first === "string" && second !== undefined) {
    opts = { id: first };
    payload = second;
  } else if (typeof second === "string") {
    opts = { id: second };
  } else if (isRecord(second)) {
    opts = second as DataScriptOptions;
  }

  const canonical = canonicalize(payload ?? {}, new WeakSet<object>());
  const rawJson = JSON.stringify(canonical, null, opts.pretty ? 2 : 0) ?? "{}";
  const safeJson = escapeForHtmlScript(rawJson);

  if (opts.wrap === false) return safeJson;
  if (opts.varName) {
    const varName = opts.varName.replace(/[^A-Za-z0-9_$]/g, "_") || "__RADAR_DATA__";
    return `<script>window.${varName}=${safeJson};</script>`;
  }
  const id = sanitizeId(opts.id ?? "radar-data");
  return `<script id="${id}" type="application/json">${safeJson}</script>`;
}