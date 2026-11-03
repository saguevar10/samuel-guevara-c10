import type { Scenario } from "./decision";

export type ExampleId = "outdoor" | "cafe";

interface ExampleSpec {
  title: string;
  context: string;
  alternatives: string[];
  states: string[];
  payoffs: number[][];
  probs: number[];
}

const SPECS: Record<ExampleId, ExampleSpec> = {
  outdoor: {
    title: "Outdoor Gear Launch",
    context:
      "A small company is launching a new line of hiking gear. It must choose the size of the first production run before it knows how strong customer demand will be. Payoffs are profits (negative = loss) in thousands of dollars.",
    alternatives: ["Small launch", "Medium launch", "Large launch"],
    states: ["Low demand", "Medium demand", "High demand"],
    payoffs: [
      [40, 40, 40],
      [10, 60, 90],
      [-50, 50, 150],
    ],
    probs: [0.3, 0.4, 0.3],
  },
  cafe: {
    title: "Café Expansion",
    context:
      "A local café owner is deciding whether to keep the current café or expand seating. Demand next year is uncertain. Payoffs are annual profits (negative = loss) in thousands of dollars.",
    alternatives: ["Keep current café", "Small expansion", "Large expansion"],
    states: ["Weak demand", "Steady demand", "Strong demand"],
    payoffs: [
      [35, 35, 35],
      [10, 55, 85],
      [-60, 45, 160],
    ],
    probs: [0.25, 0.5, 0.25],
  },
};

export const EXAMPLE_OPTIONS: { id: ExampleId; label: string }[] = [
  { id: "outdoor", label: "Outdoor Gear Launch" },
  { id: "cafe", label: "Café Expansion" },
];

export function buildExample(id: ExampleId): Scenario {
  const spec = SPECS[id];
  const alternatives = spec.alternatives.map((name, i) => ({ id: `${id}-a${i + 1}`, name }));
  const states = spec.states.map((name, j) => ({
    id: `${id}-s${j + 1}`,
    name,
    prob: String(Math.round(spec.probs[j] * 10000) / 100),
  }));
  const payoffs: Scenario["payoffs"] = {};
  alternatives.forEach((a, i) => {
    payoffs[a.id] = {};
    states.forEach((s, j) => {
      payoffs[a.id][s.id] = String(spec.payoffs[i][j]);
    });
  });
  return {
    title: spec.title,
    context: spec.context,
    unit: "$000s",
    alternatives,
    states,
    payoffs,
    probMode: "percent",
  };
}
