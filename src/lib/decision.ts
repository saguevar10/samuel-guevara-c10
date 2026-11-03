/**
 * Decision Lab — pure, deterministic calculation engine.
 * Every number shown in the UI is derived from these functions and the
 * current scenario state. No hidden constants, no randomness.
 */

/** Relative tolerance used to detect ties between computed scores. */
export const EPS = 1e-9;
/** Probabilities must total 1 within this tolerance (±0.001, i.e. ±0.1 percentage points). */
export const PROB_TOLERANCE = 0.001;
export const MIN_ALTERNATIVES = 2;
export const MIN_STATES = 2;

export function approxEqual(a: number, b: number, eps = EPS): boolean {
  return Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));
}

function clean(n: number): number {
  return Math.abs(n) < 1e-12 ? 0 : n;
}

/* ------------------------------------------------------------------ */
/* Criteria metadata                                                   */
/* ------------------------------------------------------------------ */

export type CriterionId = "maximax" | "maximin" | "regret" | "emv";
export type Goal = "max" | "min";

export interface CriterionInfo {
  id: CriterionId;
  name: string;
  attitude: string;
  scoreLabel: string;
  goal: Goal;
  needsProbabilities: boolean;
  summary: string;
  rule: string;
}

export const CRITERIA: Record<CriterionId, CriterionInfo> = {
  maximax: {
    id: "maximax",
    name: "Maximax",
    attitude: "Optimistic",
    scoreLabel: "Best payoff (row max)",
    goal: "max",
    needsProbabilities: false,
    summary:
      "Assume the best will happen. Find each option's best possible payoff, then pick the option with the biggest one.",
    rule: "Choose the largest row maximum.",
  },
  maximin: {
    id: "maximin",
    name: "Maximin",
    attitude: "Conservative",
    scoreLabel: "Worst payoff (row min)",
    goal: "max",
    needsProbabilities: false,
    summary:
      "Assume the worst will happen. Find each option's worst possible payoff, then pick the option whose worst case is least bad.",
    rule: "Choose the largest row minimum.",
  },
  regret: {
    id: "regret",
    name: "Minimax Regret",
    attitude: "Regret-averse",
    scoreLabel: "Maximum regret",
    goal: "min",
    needsProbabilities: false,
    summary:
      "Regret is how much you miss out compared with the best choice for that state. Pick the option whose biggest regret is smallest.",
    rule: "Choose the smallest maximum regret.",
  },
  emv: {
    id: "emv",
    name: "EMV (Bayes)",
    attitude: "Probability-weighted",
    scoreLabel: "Expected monetary value",
    goal: "max",
    needsProbabilities: true,
    summary:
      "Multiply each payoff by the probability of its state and add them up. Pick the option with the highest long-run average.",
    rule: "Choose the highest EMV.",
  },
};

export const ALL_CRITERIA: CriterionId[] = ["maximax", "maximin", "regret", "emv"];

/* ------------------------------------------------------------------ */
/* Scenario model                                                      */
/* ------------------------------------------------------------------ */

export interface Alternative {
  id: string;
  name: string;
}
export interface StateOfNature {
  id: string;
  name: string;
  /** Raw text as typed by the user, interpreted using `probMode`. */
  prob: string;
}
export type ProbMode = "percent" | "decimal";

export interface Scenario {
  title: string;
  context: string;
  unit: string;
  alternatives: Alternative[];
  states: StateOfNature[];
  /** payoffs[altId][stateId] = raw text as typed */
  payoffs: Record<string, Record<string, string>>;
  probMode: ProbMode;
}

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

/** Parses a typed number. Returns null for blank or non-finite input (never 0). */
export function parseNumber(raw: string): number | null {
  const t = raw
    .trim()
    .replace(/[\u2212\u2013]/g, "-")
    .replace(/,/g, "")
    .replace(/\s+/g, "");
  if (t === "") return null;
  if (!/^[-+]?(\d+(\.\d*)?|\.\d+)(e[-+]?\d+)?$/i.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export interface ParsedProbability {
  value: number | null;
  error?: string;
}

export function parseProbability(raw: string, mode: ProbMode): ParsedProbability {
  let t = raw.trim();
  if (t === "") return { value: null, error: "Required" };
  let percent = mode === "percent";
  if (t.endsWith("%")) {
    percent = true;
    t = t.slice(0, -1);
  }
  const n = parseNumber(t);
  if (n === null) return { value: null, error: "Not a number" };
  const v = percent ? n / 100 : n;
  if (v < -EPS || v > 1 + EPS) {
    return { value: null, error: mode === "percent" ? "Use 0–100%" : "Use 0–1" };
  }
  return { value: Math.min(1, Math.max(0, v)) };
}

function round(n: number, d: number): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

export function formatProbabilityInput(v: number, mode: ProbMode): string {
  return mode === "percent" ? String(round(v * 100, 4)) : String(round(v, 6));
}

/* ------------------------------------------------------------------ */
/* Core criteria (numeric layer)                                       */
/* ------------------------------------------------------------------ */

export interface BestSelection {
  best: number;
  winners: number[];
  allTied: boolean;
}

export function selectBest(scores: number[], goal: Goal): BestSelection {
  const best = goal === "max" ? Math.max(...scores) : Math.min(...scores);
  const winners: number[] = [];
  scores.forEach((s, i) => {
    if (approxEqual(s, best)) winners.push(i);
  });
  return { best: clean(best), winners, allTied: winners.length === scores.length };
}

export const rowMax = (m: number[][]) => m.map((row) => Math.max(...row));
export const rowMin = (m: number[][]) => m.map((row) => Math.min(...row));

export interface RegretTable {
  /** Best payoff in each state (column maximum). */
  stateBest: number[];
  /** Opportunity-loss matrix: stateBest[j] - payoff[i][j]. */
  regrets: number[][];
  /** Each alternative's maximum regret. */
  maxRegret: number[];
}

export function regretTable(m: number[][]): RegretTable {
  const nStates = m[0]?.length ?? 0;
  const stateBest = Array.from({ length: nStates }, (_, j) => Math.max(...m.map((r) => r[j])));
  const regrets = m.map((row) => row.map((v, j) => clean(stateBest[j] - v)));
  const maxRegret = regrets.map((r) => Math.max(...r));
  return { stateBest, regrets, maxRegret };
}

export function emvScores(m: number[][], probs: number[]): number[] {
  return m.map((row) => clean(row.reduce((s, v, j) => s + v * probs[j], 0)));
}

export function criterionScores(id: CriterionId, m: number[][], probs: number[] | null): number[] {
  switch (id) {
    case "maximax":
      return rowMax(m);
    case "maximin":
      return rowMin(m);
    case "regret":
      return regretTable(m).maxRegret;
    case "emv":
      if (!probs) throw new Error("EMV requires valid probabilities");
      return emvScores(m, probs);
  }
}

export interface CriterionResult extends BestSelection {
  id: CriterionId;
  scores: number[];
}

export function evaluateCriterion(
  id: CriterionId,
  m: number[][],
  probs: number[] | null,
): CriterionResult {
  const scores = criterionScores(id, m, probs);
  return { id, scores, ...selectBest(scores, CRITERIA[id].goal) };
}

/* ------------------------------------------------------------------ */
/* Scenario analysis                                                   */
/* ------------------------------------------------------------------ */

export interface CellRef {
  altIndex: number;
  stateIndex: number;
}

export interface Analysis {
  altNames: string[];
  stateNames: string[];
  cells: (number | null)[][];
  invalidCells: CellRef[];
  enoughAlternatives: boolean;
  enoughStates: boolean;
  /** Matrix is complete and dimensions meet the minimum. */
  canCalculate: boolean;
  matrix: number[][] | null;
  probs: (number | null)[];
  probErrors: (string | undefined)[];
  probTotal: number | null;
  probsValid: boolean;
  probMessage: string;
  validProbs: number[] | null;
  results: Partial<Record<CriterionId, CriterionResult>>;
  regret: RegretTable | null;
  blockers: string[];
  warnings: string[];
}

export function displayName(name: string, fallback: string): string {
  return name.trim() === "" ? fallback : name.trim();
}

export function analyzeScenario(s: Scenario): Analysis {
  const altNames = s.alternatives.map((a, i) => displayName(a.name, `Alternative ${i + 1}`));
  const stateNames = s.states.map((st, j) => displayName(st.name, `State ${j + 1}`));

  const cells = s.alternatives.map((a) =>
    s.states.map((st) => parseNumber(s.payoffs[a.id]?.[st.id] ?? "")),
  );
  const invalidCells: CellRef[] = [];
  cells.forEach((row, i) =>
    row.forEach((v, j) => {
      if (v === null) invalidCells.push({ altIndex: i, stateIndex: j });
    }),
  );

  const enoughAlternatives = s.alternatives.length >= MIN_ALTERNATIVES;
  const enoughStates = s.states.length >= MIN_STATES;
  const canCalculate = enoughAlternatives && enoughStates && invalidCells.length === 0;
  const matrix = canCalculate ? (cells as number[][]) : null;

  const parsed = s.states.map((st) => parseProbability(st.prob, s.probMode));
  const probs = parsed.map((p) => p.value);
  const probErrors = parsed.map((p) => p.error);
  const errorCount = probErrors.filter(Boolean).length;
  const probTotal = errorCount === 0 ? probs.reduce<number>((t, p) => t + (p ?? 0), 0) : null;

  let probsValid = false;
  let probMessage: string;
  if (s.states.length === 0) {
    probMessage = "Add states of nature first.";
  } else if (errorCount > 0) {
    probMessage = `Fix ${errorCount} invalid ${errorCount === 1 ? "probability" : "probabilities"}.`;
  } else if (probTotal !== null && Math.abs(probTotal - 1) > PROB_TOLERANCE) {
    probMessage = `Probabilities add to ${formatPercent(probTotal)} — they must add to 100%.`;
  } else {
    probsValid = true;
    probMessage = "Probabilities add to 100%.";
  }
  const validProbs = probsValid ? (probs as number[]) : null;

  const blockers: string[] = [];
  if (!enoughAlternatives) blockers.push(`Add at least ${MIN_ALTERNATIVES} alternatives.`);
  if (!enoughStates) blockers.push(`Add at least ${MIN_STATES} states of nature.`);
  if (invalidCells.length > 0)
    blockers.push(
      `${invalidCells.length} payoff ${invalidCells.length === 1 ? "cell is" : "cells are"} blank or not a valid number.`,
    );

  const warnings: string[] = [];
  const dupes = (names: string[]) =>
    names.filter((n, i) => names.findIndex((m) => m.toLowerCase() === n.toLowerCase()) !== i);
  if (dupes(altNames).length) warnings.push("Two alternatives share the same name.");
  if (dupes(stateNames).length) warnings.push("Two states share the same name.");

  const results: Partial<Record<CriterionId, CriterionResult>> = {};
  let regret: RegretTable | null = null;
  if (matrix) {
    results.maximax = evaluateCriterion("maximax", matrix, null);
    results.maximin = evaluateCriterion("maximin", matrix, null);
    results.regret = evaluateCriterion("regret", matrix, null);
    regret = regretTable(matrix);
    if (validProbs) results.emv = evaluateCriterion("emv", matrix, validProbs);
  }

  return {
    altNames,
    stateNames,
    cells,
    invalidCells,
    enoughAlternatives,
    enoughStates,
    canCalculate,
    matrix,
    probs,
    probErrors,
    probTotal,
    probsValid,
    probMessage,
    validProbs,
    results,
    regret,
    blockers,
    warnings,
  };
}

/* ------------------------------------------------------------------ */
/* Staged filtering                                                    */
/* ------------------------------------------------------------------ */

export type TiePolicy = { kind: "exact" } | { kind: "band"; band: number };

export interface StageResult {
  stage: number;
  criterion: CriterionId;
  status: "ok" | "blocked";
  candidates: number[];
  scores: { alt: number; score: number }[];
  best: number | null;
  retained: number[];
  eliminated: { alt: number; score: number; gap: number }[];
  allTied: boolean;
  /** For regret stages: best payoff per state among the candidates only. */
  regretBasis?: number[] | undefined;
}

export interface StagedResult {
  stages: StageResult[];
  final: number[];
  /** False when a stage could not run (EMV without valid probabilities). */
  complete: boolean;
}

export function runStagedFilter(
  matrix: number[][],
  probs: number[] | null,
  order: CriterionId[],
  policy: TiePolicy,
): StagedResult {
  let survivors = matrix.map((_, i) => i);
  const stages: StageResult[] = [];
  let complete = true;

  order.forEach((criterion, k) => {
    const candidates = [...survivors];
    if (criterion === "emv" && !probs) {
      complete = false;
      stages.push({
        stage: k + 1,
        criterion,
        status: "blocked",
        candidates,
        scores: [],
        best: null,
        retained: candidates,
        eliminated: [],
        allTied: false,
      });
      return;
    }
    const sub = candidates.map((i) => matrix[i]);
    const scores = criterionScores(criterion, sub, probs);
    const goal = CRITERIA[criterion].goal;
    const { best } = selectBest(scores, goal);
    const retained: number[] = [];
    const eliminated: StageResult["eliminated"] = [];
    scores.forEach((score, idx) => {
      const gap = clean(Math.abs(score - best));
      const keep =
        approxEqual(score, best) ||
        (policy.kind === "band" && gap <= policy.band + EPS * Math.max(1, Math.abs(best)));
      if (keep) retained.push(candidates[idx]);
      else eliminated.push({ alt: candidates[idx], score, gap });
    });
    stages.push({
      stage: k + 1,
      criterion,
      status: "ok",
      candidates,
      scores: scores.map((score, idx) => ({ alt: candidates[idx], score })),
      best,
      retained,
      eliminated,
      allTied: eliminated.length === 0,
      regretBasis: criterion === "regret" ? regretTable(sub).stateBest : undefined,
    });
    survivors = retained;
  });

  return { stages, final: survivors, complete };
}

/* ------------------------------------------------------------------ */
/* Probability sensitivity                                             */
/* ------------------------------------------------------------------ */

/**
 * Sets state k's probability to p and shares the remaining (1 - p) among the
 * other states in proportion to their base probabilities (equally if they are all 0).
 */
export function redistribute(base: number[], k: number, p: number): number[] {
  const others = base.reduce((s, v, j) => (j === k ? s : s + v), 0);
  const n = base.length;
  return base.map((v, j) => {
    if (j === k) return p;
    return others > EPS ? ((1 - p) * v) / others : (1 - p) / (n - 1);
  });
}

/** EMV_i(p) = a + b·p under proportional redistribution — an exact straight line. */
export interface EmvLine {
  a: number;
  b: number;
}

export function emvLines(m: number[][], base: number[], k: number): EmvLine[] {
  const w = redistribute(base, k, 0);
  return m.map((row) => {
    const a = row.reduce((s, v, j) => (j === k ? s : s + v * w[j]), 0);
    return { a, b: row[k] - a };
  });
}

export interface PreferenceInterval {
  from: number;
  to: number;
  winners: number[];
}

/** Exact ranges of p (0–1) over which each alternative has the highest EMV. */
export function preferenceIntervals(lines: EmvLine[]): PreferenceInterval[] {
  const pts = [0, 1];
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const { a: ai, b: bi } = lines[i];
      const { a: aj, b: bj } = lines[j];
      if (approxEqual(bi, bj)) continue;
      const x = (aj - ai) / (bi - bj);
      if (x > 1e-9 && x < 1 - 1e-9) pts.push(x);
    }
  }
  pts.sort((a, b) => a - b);
  const uniq = pts.filter((p, i) => i === 0 || Math.abs(p - pts[i - 1]) > 1e-9);
  const out: PreferenceInterval[] = [];
  for (let i = 0; i < uniq.length - 1; i++) {
    const mid = (uniq[i] + uniq[i + 1]) / 2;
    const { winners } = selectBest(
      lines.map((l) => l.a + l.b * mid),
      "max",
    );
    const last = out[out.length - 1];
    if (last && last.winners.join(",") === winners.join(",")) last.to = uniq[i + 1];
    else out.push({ from: uniq[i], to: uniq[i + 1], winners });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* C10 decision guide                                                  */
/* ------------------------------------------------------------------ */

export type RiskAttitude = "optimistic" | "balanced" | "conservative";

export interface GuideInput {
  attitude: RiskAttitude;
  probsValid: boolean;
  probsCredible: boolean;
  repeated: boolean;
}

export interface Recommendation {
  criterion: CriterionId;
  reasons: string[];
  caveats: string[];
}

export function recommendCriterion(input: GuideInput): Recommendation {
  const usable = input.probsValid && input.probsCredible;
  const caveats: string[] = [];
  const reasons: string[] = [];
  let criterion: CriterionId;

  if (input.attitude === "optimistic") {
    criterion = "maximax";
    reasons.push("You chose an optimistic risk attitude: you focus on the best possible outcome.");
    reasons.push("Maximax needs no probabilities.");
    caveats.push("Maximax ignores the downside — the chosen option may have the worst loss.");
    if (usable) caveats.push("Your probabilities are usable, so compare with EMV as a cross-check.");
  } else if (input.attitude === "conservative") {
    criterion = "maximin";
    reasons.push("You chose a conservative risk attitude: protecting against the worst case matters most.");
    reasons.push("Maximin needs no probabilities.");
    caveats.push("Maximin can give up large gains to avoid a loss that may be unlikely.");
    if (usable) caveats.push("Your probabilities are usable, so compare with EMV as a cross-check.");
  } else if (usable) {
    criterion = "emv";
    reasons.push("You chose a balanced risk attitude.");
    reasons.push("Your probabilities are valid (they add to 100%) and you consider them credible.");
    if (input.repeated) {
      reasons.push("This is a repeated decision, so a long-run average payoff is meaningful.");
    } else {
      caveats.push(
        "This is a one-off decision: EMV is an average, not a guaranteed outcome. Check the worst case (Maximin) too.",
      );
    }
  } else {
    criterion = "regret";
    reasons.push("You chose a balanced risk attitude.");
    reasons.push(
      input.probsValid
        ? "You do not consider the probabilities credible, so EMV is not reliable here."
        : "The probabilities are not valid (invalid entries or total ≠ 100%), so EMV cannot be used.",
    );
    reasons.push(
      "Minimax Regret needs no probabilities and limits the worst missed opportunity — a middle path between Maximax and Maximin.",
    );
  }
  caveats.push("Staged filtering and these criteria are decision aids, not universal rules.");
  return { criterion, reasons, caveats };
}

/* ------------------------------------------------------------------ */
/* Formatting & explanation text                                       */
/* ------------------------------------------------------------------ */

export function formatNumber(n: number, maxFrac = 2): string {
  const v = clean(n);
  const s = Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: maxFrac });
  return v < 0 ? `\u2212${s}` : s;
}

/** "$000s" → "$54k"; short symbols prefix ("$54"); other units suffix ("54 units"). */
export function formatValue(n: number, unit: string): string {
  const u = unit.trim();
  const v = clean(n);
  const abs = formatNumber(Math.abs(v));
  const sign = v < 0 ? "\u2212" : "";
  if (!u) return formatNumber(v);
  const thousands = /^(.{1,2})000s$/i.exec(u);
  if (thousands) return `${sign}${thousands[1]}${abs}k`;
  if (u.length <= 2 && !/\d/.test(u)) return `${sign}${u}${abs}`;
  return `${formatNumber(v)} ${u}`;
}

export function formatPercent(p: number, maxFrac = 1): string {
  return `${formatNumber(p * 100, maxFrac)}%`;
}

export function describeElimination(
  criterion: CriterionId,
  score: number,
  best: number,
  gap: number,
  unit: string,
): string {
  const f = (n: number) => formatValue(n, unit);
  switch (criterion) {
    case "maximax":
      return `Best case ${f(score)} is ${f(gap)} below the highest best case (${f(best)}).`;
    case "maximin":
      return `Worst case ${f(score)} is ${f(gap)} below the best worst case (${f(best)}).`;
    case "regret":
      return `Maximum regret ${f(score)} is ${f(gap)} above the smallest maximum regret (${f(best)}).`;
    case "emv":
      return `EMV ${f(score)} is ${f(gap)} below the highest EMV (${f(best)}).`;
  }
}

export function listNames(indices: number[], names: string[]): string {
  const n = indices.map((i) => names[i]);
  if (n.length <= 1) return n.join("");
  if (n.length === 2) return `${n[0]} and ${n[1]}`;
  return `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
}
