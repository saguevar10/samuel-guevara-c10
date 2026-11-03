import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  formatProbabilityInput,
  MIN_ALTERNATIVES,
  MIN_STATES,
  parseProbability,
  type CriterionId,
  type ProbMode,
  type Scenario,
} from "@/lib/decision";
import { buildExample, type ExampleId } from "@/lib/examples";

const STORAGE_KEY = "decision-lab:v1";

export interface StagedConfig {
  order: CriterionId[];
  enabled: Record<CriterionId, boolean>;
  policyKind: "exact" | "band";
  bandRaw: string;
}

export const DEFAULT_STAGED: StagedConfig = {
  order: ["maximin", "regret", "emv", "maximax"],
  enabled: { maximin: true, regret: true, emv: true, maximax: false },
  policyKind: "exact",
  bandRaw: "5",
};

interface State {
  exampleId: ExampleId;
  scenario: Scenario;
  staged: StagedConfig;
}

type Action =
  | { type: "replace"; state: State }
  | { type: "loadExample"; id: ExampleId }
  | { type: "patch"; patch: Partial<Pick<Scenario, "title" | "context" | "unit">> }
  | { type: "addAlt"; id: string }
  | { type: "renameAlt"; id: string; name: string }
  | { type: "removeAlt"; id: string }
  | { type: "addState"; id: string }
  | { type: "renameState"; id: string; name: string }
  | { type: "removeState"; id: string }
  | { type: "setPayoff"; altId: string; stateId: string; value: string }
  | { type: "setProb"; id: string; value: string }
  | { type: "setProbMode"; mode: ProbMode }
  | { type: "setProbabilities"; values: number[] }
  | { type: "staged"; patch: Partial<StagedConfig> };

function initial(id: ExampleId = "outdoor"): State {
  return { exampleId: id, scenario: buildExample(id), staged: DEFAULT_STAGED };
}

function reducer(state: State, action: Action): State {
  const s = state.scenario;
  const withScenario = (scenario: Scenario): State => ({ ...state, scenario });
  switch (action.type) {
    case "replace":
      return action.state;
    case "loadExample":
      return initial(action.id);
    case "patch":
      return withScenario({ ...s, ...action.patch });
    case "addAlt": {
      const payoffs = { ...s.payoffs, [action.id]: Object.fromEntries(s.states.map((st) => [st.id, ""])) };
      return withScenario({
        ...s,
        alternatives: [...s.alternatives, { id: action.id, name: `Alternative ${s.alternatives.length + 1}` }],
        payoffs,
      });
    }
    case "renameAlt":
      return withScenario({
        ...s,
        alternatives: s.alternatives.map((a) => (a.id === action.id ? { ...a, name: action.name } : a)),
      });
    case "removeAlt": {
      if (s.alternatives.length <= MIN_ALTERNATIVES) return state;
      const payoffs = { ...s.payoffs };
      delete payoffs[action.id];
      return withScenario({ ...s, alternatives: s.alternatives.filter((a) => a.id !== action.id), payoffs });
    }
    case "addState":
      return withScenario({
        ...s,
        states: [...s.states, { id: action.id, name: `State ${s.states.length + 1}`, prob: "" }],
        payoffs: Object.fromEntries(
          Object.entries(s.payoffs).map(([k, row]) => [k, { ...row, [action.id]: "" }]),
        ),
      });
    case "renameState":
      return withScenario({
        ...s,
        states: s.states.map((st) => (st.id === action.id ? { ...st, name: action.name } : st)),
      });
    case "removeState": {
      if (s.states.length <= MIN_STATES) return state;
      const payoffs = Object.fromEntries(
        Object.entries(s.payoffs).map(([k, row]) => {
          const r = { ...row };
          delete r[action.id];
          return [k, r];
        }),
      );
      return withScenario({ ...s, states: s.states.filter((st) => st.id !== action.id), payoffs });
    }
    case "setPayoff":
      return withScenario({
        ...s,
        payoffs: { ...s.payoffs, [action.altId]: { ...s.payoffs[action.altId], [action.stateId]: action.value } },
      });
    case "setProb":
      return withScenario({
        ...s,
        states: s.states.map((st) => (st.id === action.id ? { ...st, prob: action.value } : st)),
      });
    case "setProbMode": {
      if (action.mode === s.probMode) return state;
      const states = s.states.map((st) => {
        const p = parseProbability(st.prob, s.probMode);
        return p.value === null || p.error ? st : { ...st, prob: formatProbabilityInput(p.value, action.mode) };
      });
      return withScenario({ ...s, probMode: action.mode, states });
    }
    case "setProbabilities":
      if (action.values.length !== s.states.length) return state;
      return withScenario({
        ...s,
        states: s.states.map((st, j) => ({ ...st, prob: formatProbabilityInput(action.values[j], s.probMode) })),
      });
    case "staged":
      return { ...state, staged: { ...state.staged, ...action.patch } };
  }
}

function isValidStored(x: unknown): x is State {
  if (!x || typeof x !== "object") return false;
  const st = x as State;
  const sc = st.scenario;
  return (
    (st.exampleId === "outdoor" || st.exampleId === "cafe") &&
    !!sc &&
    typeof sc.title === "string" &&
    typeof sc.unit === "string" &&
    Array.isArray(sc.alternatives) &&
    Array.isArray(sc.states) &&
    typeof sc.payoffs === "object" &&
    (sc.probMode === "percent" || sc.probMode === "decimal") &&
    !!st.staged &&
    Array.isArray(st.staged.order) &&
    st.staged.order.length === 4
  );
}

let idCounter = 0;
function newId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export function useScenario() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initial());
  const loaded = useRef(false);

  // Restore from localStorage after hydration (never during render).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isValidStored(parsed)) dispatch({ type: "replace", state: parsed });
      }
    } catch {
      /* ignore corrupt storage */
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage may be unavailable */
    }
  }, [state]);

  const actions = {
    loadExample: useCallback((id: ExampleId) => dispatch({ type: "loadExample", id }), []),
    patch: useCallback(
      (patch: Partial<Pick<Scenario, "title" | "context" | "unit">>) => dispatch({ type: "patch", patch }),
      [],
    ),
    addAlternative: useCallback(() => dispatch({ type: "addAlt", id: newId("alt") }), []),
    renameAlternative: useCallback((id: string, name: string) => dispatch({ type: "renameAlt", id, name }), []),
    removeAlternative: useCallback((id: string) => dispatch({ type: "removeAlt", id }), []),
    addState: useCallback(() => dispatch({ type: "addState", id: newId("state") }), []),
    renameState: useCallback((id: string, name: string) => dispatch({ type: "renameState", id, name }), []),
    removeState: useCallback((id: string) => dispatch({ type: "removeState", id }), []),
    setPayoff: useCallback(
      (altId: string, stateId: string, value: string) => dispatch({ type: "setPayoff", altId, stateId, value }),
      [],
    ),
    setProb: useCallback((id: string, value: string) => dispatch({ type: "setProb", id, value }), []),
    setProbMode: useCallback((mode: ProbMode) => dispatch({ type: "setProbMode", mode }), []),
    setProbabilities: useCallback((values: number[]) => dispatch({ type: "setProbabilities", values }), []),
    setStaged: useCallback((patch: Partial<StagedConfig>) => dispatch({ type: "staged", patch }), []),
  };

  return { ...state, actions };
}

export type ScenarioActions = ReturnType<typeof useScenario>["actions"];
