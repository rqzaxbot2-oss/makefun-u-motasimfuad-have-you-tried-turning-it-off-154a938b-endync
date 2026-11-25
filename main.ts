import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

interface EntryMetrics {
  char_count: number;
  byte_length: number;
  word_count: number;
  max_chars: number;
  remaining_chars: number;
  single_line: boolean;
  within_limit: boolean;
  ascii_only: boolean;
}

interface ComedicBeat {
  stage: string;
  excerpt: string;
  mechanism: string;
}

interface CheckResult {
  id: string;
  passed: boolean;
  detail: string;
}

interface ArtifactRecord {
  path: string;
  bytes: number;
  sha256: string;
}

interface DossierPayload {
  schema: string;
  bounty: string;
  category: string;
  title: string;
  line: string;
  text: string;
  metrics: EntryMetrics;
  digest: { sha256: string };
  ticket: {
    id: string;
    queue: string;
    status: string;
    customer_state: string;
    agent_action: string;
    auto_close_window_minutes: number;
  };
  beats: ComedicBeat[];
}

interface BoardPayload {
  schema: string;
  bounty: string;
  title: string;
  status: string;
  entry: {
    line: string;
    char_count: number;
    max_chars: number;
    within_limit: boolean;
    sha256: string;
  };
  checks: CheckResult[];
  artifacts: ArtifactRecord[];
}

const BOUNTY_ID = "u-motasimfuad-have-you-tried-turning-it-off-154a938b";
const ENTRY_TITLE = "Ticket Auto-Close: Smoking Laptop Edition";
const MAX_CHARS = 200;
const LINE =
  "Since your laptop is dead and smoking, I've emailed you a 47-page PDF on preventing smoke; please reply 'STILL ON FIRE' within two minutes or I'll mark this resolved.";

function sha256(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function wrapText(text: string, maxCols: number): string[] {
  if (!Number.isInteger(maxCols) || maxCols < 1) {
    throw new RangeError(`maxCols must be a positive integer, received ${maxCols}`);
  }

  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > maxCols) {
      if (current.length > 0) {
        lines.push(current);
        current = "";
      }
      for (let i = 0; i < word.length; i += maxCols) {
        const chunk = word.slice(i, i + maxCols);
        if (chunk.length === maxCols) {
          lines.push(chunk);
        } else {
          current = chunk;
        }
      }
      continue;
    }

    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (candidate.length <= maxCols) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current.length > 0) {
    lines.push(current);
  }
  return lines;
}

function computeMetrics(line: string): EntryMetrics {
  const charCount = Array.from(line).length;
  const byteLength = Buffer.byteLength(line, "utf8");
  const trimmed = line.trim();
  const wordCount = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
  const singleLine = !line.includes("\n") && !line.includes("\r");
  const withinLimit = charCount > 0 && charCount < MAX_CHARS;
  const asciiOnly = /^[\x20-\x7e]+$/.test(line);

  return {
    char_count: charCount,
    byte_length: byteLength,
    word_count: wordCount,
    max_chars: MAX_CHARS,
    remaining_chars: MAX_CHARS - charCount,
    single_line: singleLine,
    within_limit: withinLimit,
    ascii_only: asciiOnly,
  };
}

function runChecks(line: string, metrics: EntryMetrics): CheckResult[] {
  const trimmed = line.trim();
  return [
    {
      id: "non_empty",
      passed: trimmed.length > 0 && trimmed === line,
      detail: "Line contains non-whitespace text with no leading or trailing spaces.",
    },
    {
      id: "under_200_chars",
      passed: metrics.within_limit,
      detail: `${metrics.char_count} chars (strictly under ${metrics.max_chars}).`,
    },
    {
      id: "single_line",
      passed: metrics.single_line,
      detail: "Line contains no embedded CR or LF breaks.",
    },
    {
      id: "printable_ascii",
      passed: metrics.ascii_only,
      detail: "Line uses clean printable ASCII punctuation.",
    },
  ];
}

function assertBeatsConsistent(line: string, beats: readonly ComedicBeat[]): void {
  let cursor = 0;
  for (const beat of beats) {
    const idx = line.indexOf(beat.excerpt, cursor);
    if (idx === -1) {
      throw new Error(`Comedic beat "${beat.stage}" excerpt is missing or out of order in entry line.`);
    }
    cursor = idx + beat.excerpt.length;
  }
}

function buildDossier(line: string, metrics: EntryMetrics, lineHash: string): DossierPayload {
  const beats: ComedicBeat[] = [
    {
      stage: "premise",
      excerpt: "Since your laptop is dead and smoking,",
      mechanism: "Establishes an acute hardware disaster in seven words.",
    },
    {
      stage: "escalation",
      excerpt: "I've emailed you a 47-page PDF on preventing smoke;",
      mechanism: "Stacks unreachable medium, bloated manual, and useless hindsight.",
    },
    {
      stage: "closer",
      excerpt: "please reply 'STILL ON FIRE' within two minutes or I'll mark this resolved.",
      mechanism: "Weaponizes helpdesk auto-close policy against an incapacitated customer.",
    },
  ];

  assertBeatsConsistent(line, beats);

  return {
    schema: "makefun.dossier/v1",
    bounty: BOUNTY_ID,
    category: "Growth",
    title: ENTRY_TITLE,
    line,
    text: line,
    metrics,
    digest: { sha256: lineHash },
    ticket: {
      id: "SUP-4047",
      queue: "Tier-1 Consumer Hardware",
      status: "PENDING_AUTO_RESOLVE",
      customer_state: "Laptop dead and actively emitting smoke",
      agent_action: "Emailed 47-page smoke prevention manual to dead device",
      auto_close_window_minutes: 2,
    },
    beats,
  };
}

function buildStylesheet(): string {
  return [
    ":root {",
    "  --bg: #0f131a;",
    "  --panel: #181f2a;",
    "  --border: #2c3648;",
    "  --text: #eef2f7;",
    "  --muted: #9aa7bc;",
    "  --amber: #f59e0b;",
    "  --green: #34d399;",
    "  --red: #f87171;",
    "}",
    "* { box-sizing: border-box; }",
    "body {",
    "  margin: 0;",
    "  padding: 2rem 1rem;",
    "  background: var(--bg);",
    "  color: var(--text);",
    "  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;",
    "  line-height: 1.55;",
    "}",
    ".wrap { max-width: 820px; margin: 0 auto; }",
    ".card {",
    "  background: var(--panel);",
    "  border: 1px solid var(--border);",
    "  border-radius: 12px;",
    "  padding: 1.5rem;",
    "  margin-bottom: 1.25rem;",
    "}",
    ".badge {",
    "  display: inline-block;",
    "  padding: 0.2rem 0.6rem;",
    "  border-radius: 999px;",
    "  background: rgba(245, 158, 11, 0.16);",
    "  color: var(--amber);",
    "  font-size: 0.8rem;",
    "  letter-spacing: 0.04em;",
    "}",
    "h1 { margin: 0.75rem 0 0.5rem; font-size: 1.25rem; }",
    "blockquote {",
    "  margin: 1rem 0;",
    "  padding: 1rem 1.25rem;",
    "  border-left: 4px solid var(--amber);",
    "  background: rgba(255, 255, 255, 0.03);",
    "  font-size: 1.1rem;",
    "}",
    ".meta { color: var(--muted); font-size: 0.85rem; }",
    ".checks { list-style: none; padding: 0; margin: 0.75rem 0 0; }",
    ".checks li { padding: 0.25rem 0; color: var(--green); }",
    ".checks li.fail { color: var(--red); }",
    "img.preview { width: 100%; height: auto; border-radius: 10px; display: block; }",
    "",
  ].join("\n");
}

function buildTicketSvg(line: string, metrics: EntryMetrics): string {
  const wrapped = wrapText(line, 44);
  const textStartY = 175;
  const lineHeight = 34;
  const dividerY = Math.max(304, textStartY + wrapped.length * lineHeight - 7);
  const footerY = dividerY + 30;
  const totalHeight = dividerY + 76;
  const innerHeight = totalHeight - 40;
  const statusLabel = metrics.within_limit ? "PASS" : "FAIL";
  const statusColor = metrics.within_limit ? "#34d399" : "#f87171";

  const tspans = wrapped
    .map((segment, index) => {
      const y = textStartY + index * lineHeight;
      return `    <tspan x="56" y="${y}">${escapeXml(segment)}</tspan>`;
    })
    .join("\n");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${totalHeight}" viewBox="0 0 800 ${totalHeight}" role="img" aria-label="Tech support ticket card">`,
    `  <rect width="800" height="${totalHeight}" rx="18" fill="#0f131a"/>`,
    `  <rect x="20" y="20" width="760" height="${innerHeight}" rx="14" fill="#181f2a" stroke="#2c3648" stroke-width="2"/>`,
    '  <rect x="44" y="44" width="320" height="30" rx="15" fill="#3b2a10" stroke="#f59e0b" stroke-width="1"/>',
    '  <text x="60" y="64" fill="#f59e0b" font-family="monospace" font-size="13" font-weight="700">TICKET #SUP-4047 // STATUS: SMOKING</text>',
    '  <text x="44" y="114" fill="#9aa7bc" font-family="monospace" font-size="14">TIER-1 SUPPORT AGENT REPLY:</text>',
    '  <line x1="44" y1="130" x2="756" y2="130" stroke="#2c3648" stroke-width="1"/>',
    '  <text fill="#eef2f7" font-family="monospace" font-size="22" font-weight="600">',
    tspans,
    "  </text>",
    `  <line x1="44" y1="${dividerY}" x2="756" y2="${dividerY}" stroke="#2c3648" stroke-width="1"/>`,
    `  <text x="44" y="${footerY}" fill="#f59e0b" font-family="monospace" font-size="13">AUTO-CLOSE TIMER: 02:00</text>`,
    `  <text x="756" y="${footerY}" text-anchor="end" fill="${statusColor}" font-family="monospace" font-size="13">${metrics.char_count} / ${metrics.max_chars} CHARS // ${statusLabel}</text>`,
    "</svg>",
    "",
  ].join("\n");
}

function buildHtml(dossier: DossierPayload, checks: readonly CheckResult[]): string {
  const checkItems = checks
    .map((item) => {
      const label = item.passed ? "PASS" : "FAIL";
      const cls = item.passed ? "pass" : "fail";
      return `        <li class="${cls}">[${label}] ${escapeXml(item.id)}: ${escapeXml(item.detail)}</li>`;
    })
    .join("\n");

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <title>${escapeXml(dossier.title)}</title>`,
    '  <link rel="stylesheet" href="./assets/style.css">',
    "</head>",
    "<body>",
    '  <main class="wrap">',
    '    <section class="card">',
    `      <span class="badge">${escapeXml(dossier.ticket.id)} &middot; ${escapeXml(dossier.ticket.status)}</span>`,
    `      <h1>${escapeXml(dossier.title)}</h1>`,
    `      <blockquote id="entry-line">${escapeXml(dossier.line)}</blockquote>`,
    `      <p class="meta">Length: ${dossier.metrics.char_count}/${dossier.metrics.max_chars} chars &middot; SHA-256: ${dossier.digest.sha256.slice(0, 16)}</p>`,
    '      <ul class="checks">',
    checkItems,
    "      </ul>",
    "    </section>",
    '    <section class="card">',
    '      <img class="preview" src="./assets/ticket-card.svg" alt="Support ticket preview card">',
    "    </section>",
    "  </main>",
    '  <script src="./data.js"></script>',
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

function ensureOutputDirectory(outputDir: string): void {
  if (fs.existsSync(outputDir)) {
    const stat = fs.statSync(outputDir);
    if (!stat.isDirectory()) {
      throw new Error(`Output path exists and is not a directory: ${outputDir}`);
    }
    return;
  }
  fs.mkdirSync(outputDir, { recursive: true });
}

function writeArtifact(rootDir: string, relativePath: string, content: string): ArtifactRecord {
  const normalizedRel = path.posix.normalize(relativePath.replaceAll("\\", "/"));
  if (
    normalizedRel.length === 0 ||
    normalizedRel === "." ||
    normalizedRel.startsWith("/") ||
    normalizedRel === ".." ||
    normalizedRel.startsWith("../")
  ) {
    throw new Error(`Invalid relative artifact path: ${relativePath}`);
  }

  const fullPath = path.resolve(rootDir, ...normalizedRel.split("/"));
  const relFromRoot = path.relative(rootDir, fullPath);
  if (relFromRoot.startsWith("..") || path.isAbsolute(relFromRoot)) {
    throw new Error(`Artifact path escapes output directory: ${relativePath}`);
  }

  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
  return {
    path: normalizedRel,
    bytes: Buffer.byteLength(content, "utf8"),
    sha256: sha256(content),
  };
}

function serializeDataScript(payload: unknown): string {
  const json = JSON.stringify(payload, null, 2)
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
  return `globalThis.MAKEFUN_ENTRY = ${json};\n`;
}

function main(): void {
  const envOut = process.env.MAKEFUN_OUTPUT_DIR?.trim();
  const outputDir = path.resolve(envOut && envOut.length > 0 ? envOut : "out");
  ensureOutputDirectory(outputDir);

  const metrics = computeMetrics(LINE);
  const checks = runChecks(LINE, metrics);
  const failed = checks.filter((check) => !check.passed);
  if (failed.length > 0) {
    throw new Error(`Entry validation failed: ${failed.map((f) => f.id).join(", ")}`);
  }

  const lineHash = sha256(LINE);
  const dossier = buildDossier(LINE, metrics, lineHash);
  const lineText = `${LINE}\n`;
  const dossierJson = `${JSON.stringify(dossier, null, 2)}\n`;
  const styleCss = buildStylesheet();
  const ticketSvg = buildTicketSvg(LINE, metrics);
  const indexHtml = buildHtml(dossier, checks);

  const artifacts: ArtifactRecord[] = [
    writeArtifact(outputDir, "line.txt", lineText),
    writeArtifact(outputDir, "dossier.json", dossierJson),
    writeArtifact(outputDir, "assets/style.css", styleCss),
    writeArtifact(outputDir, "assets/ticket-card.svg", ticketSvg),
    writeArtifact(outputDir, "index.html", indexHtml),
  ];

  const board: BoardPayload = {
    schema: "makefun.board/v1",
    bounty: BOUNTY_ID,
    title: ENTRY_TITLE,
    status: "ready",
    entry: {
      line: LINE,
      char_count: metrics.char_count,
      max_chars: metrics.max_chars,
      within_limit: metrics.within_limit,
      sha256: lineHash,
    },
    checks,
    artifacts,
  };

  writeArtifact(outputDir, "board.json", `${JSON.stringify(board, null, 2)}\n`);
  writeArtifact(outputDir, "data.js", serializeDataScript({ line: LINE, dossier, board }));

  process.stdout.write(`${LINE}\n`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error: ${message}\n`);
  process.exitCode = 1;
}