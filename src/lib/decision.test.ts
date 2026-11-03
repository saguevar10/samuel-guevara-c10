import { describe, expect, it } from "vitest";
import {
  analyzeScenario,
  emvLines,
  parseNumber,
  parseProbability,
  preferenceIntervals,
  recommendCriterion,
  redistribute,
  runStagedFilter,
} from "./decision";
import { buildExample } from "./examples";

describe("Outdoor Gear Launch example", () => {
  const a = analyzeScenario(buildExample("outdoor"));
  it("Maximax picks Large launch (150)", () => {
    expect(a.results.maximax?.winners).toEqual([2]);
    expect(a.results.maximax?.best).toBe(150);
  });
  it("Maximin picks Small launch (40)", () => {
    expect(a.results.maximin?.winners).toEqual([0]);
    expect(a.results.maximin?.best).toBe(40);
  });
  it("Minimax regret picks Medium launch (max regret 60)", () => {
    expect(a.regret?.regrets).toEqual([
      [0, 20, 110],
      [30, 0, 60],
      [90, 10, 0],
    ]);
    expect(a.results.regret?.winners).toEqual([1]);
    expect(a.results.regret?.best).toBe(60);
  });
  it("EMV picks Medium launch (54)", () => {
    const s = a.results.emv!.scores;
    expect(s[0]).toBeCloseTo(40);
    expect(s[1]).toBeCloseTo(54);
    expect(s[2]).toBeCloseTo(50);
    expect(a.results.emv?.winners).toEqual([1]);
  });
});

describe("Café Expansion example", () => {
  const a = analyzeScenario(buildExample("cafe"));
  it("gives Large / Keep / Small / Small", () => {
    expect(a.results.maximax?.winners).toEqual([2]);
    expect(a.results.maximin?.winners).toEqual([0]);
    expect(a.results.regret?.best).toBe(75);
    expect(a.results.regret?.winners).toEqual([1]);
    expect(a.results.emv?.scores[1]).toBeCloseTo(51.25);
    expect(a.results.emv?.scores[2]).toBeCloseTo(47.5);
    expect(a.results.emv?.winners).toEqual([1]);
  });
});

describe("validation", () => {
  it("blank cells are invalid, never zero", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("-50")).toBe(-50);
    const s = buildExample("outdoor");
    s.payoffs[s.alternatives[0].id][s.states[0].id] = "";
    const a = analyzeScenario(s);
    expect(a.canCalculate).toBe(false);
    expect(a.results.maximax).toBeUndefined();
  });
  it("probabilities must be within 0–1 and total 100%", () => {
    expect(parseProbability("120", "percent").error).toBeTruthy();
    expect(parseProbability("0.3", "decimal").value).toBeCloseTo(0.3);
    const s = buildExample("outdoor");
    s.states[0].prob = "20";
    const a = analyzeScenario(s);
    expect(a.probsValid).toBe(false);
    expect(a.results.emv).toBeUndefined();
  });
});

describe("ties", () => {
  it("lists all tied alternatives", () => {
    const s = buildExample("outdoor");
    // Make Medium's best case equal to Large's (150)
    s.payoffs[s.alternatives[1].id][s.states[2].id] = "150";
    const a = analyzeScenario(s);
    expect(a.results.maximax?.winners).toEqual([1, 2]);
  });
});

describe("staged filtering", () => {
  const a = analyzeScenario(buildExample("outdoor"));
  it("default Maximin → Regret → EMV keeps Small launch", () => {
    const r = runStagedFilter(a.matrix!, a.validProbs, ["maximin", "regret", "emv"], {
      kind: "exact",
    });
    expect(r.stages[0].retained).toEqual([0]);
    expect(r.final).toEqual([0]);
    expect(r.complete).toBe(true);
  });
  it("near-tie band keeps alternatives within the band", () => {
    // EMV first with band 5: Medium 54, Large 50 kept; Small 40 dropped
    const r = runStagedFilter(a.matrix!, a.validProbs, ["emv", "maximin"], { kind: "band", band: 5 });
    expect(r.stages[0].retained).toEqual([1, 2]);
    expect(r.final).toEqual([1]);
  });
  it("regret is recomputed among survivors only", () => {
    const r = runStagedFilter(a.matrix!, a.validProbs, ["emv", "regret"], { kind: "band", band: 5 });
    // Among Medium & Large: state best = [10,60,150]; Medium max regret 60, Large 60 → tie
    expect(r.stages[1].regretBasis).toEqual([10, 60, 150]);
    expect(r.final).toEqual([1, 2]);
  });
  it("EMV stage is blocked without valid probabilities", () => {
    const r = runStagedFilter(a.matrix!, null, ["emv"], { kind: "exact" });
    expect(r.stages[0].status).toBe("blocked");
    expect(r.complete).toBe(false);
  });
});

describe("sensitivity", () => {
  const a = analyzeScenario(buildExample("outdoor"));
  it("redistributes remaining probability proportionally", () => {
    const p = redistribute([0.3, 0.4, 0.3], 2, 0.65);
    expect(p[0]).toBeCloseTo(0.15);
    expect(p[1]).toBeCloseTo(0.2);
    expect(p.reduce((s, v) => s + v, 0)).toBeCloseTo(1);
  });
  it("EMV lines reproduce base EMVs and switch points are exact", () => {
    const lines = emvLines(a.matrix!, a.validProbs!, 2);
    expect(lines[1].a + lines[1].b * 0.3).toBeCloseTo(54);
    const iv = preferenceIntervals(lines);
    // Small → Medium → Large as P(High demand) rises
    expect(iv.map((i) => i.winners)).toEqual([[0], [1], [2]]);
    expect(iv[2].from).toBeCloseTo((270 / 7 - 50 / 7) / (1000 / 7 - 360 / 7));
  });
});

describe("C10 guide", () => {
  it("balanced + valid credible probabilities → EMV", () => {
    expect(
      recommendCriterion({ attitude: "balanced", probsValid: true, probsCredible: true, repeated: true })
        .criterion,
    ).toBe("emv");
  });
  it("balanced + invalid probabilities → Minimax regret", () => {
    expect(
      recommendCriterion({ attitude: "balanced", probsValid: false, probsCredible: true, repeated: true })
        .criterion,
    ).toBe("regret");
  });
  it("optimistic → Maximax, conservative → Maximin", () => {
    const base = { probsValid: true, probsCredible: true, repeated: false };
    expect(recommendCriterion({ ...base, attitude: "optimistic" }).criterion).toBe("maximax");
    expect(recommendCriterion({ ...base, attitude: "conservative" }).criterion).toBe("maximin");
  });
});
