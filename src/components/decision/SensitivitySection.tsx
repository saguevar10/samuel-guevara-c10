import { useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  emvLines,
  emvScores,
  formatNumber,
  formatPercent,
  formatValue,
  listNames,
  preferenceIntervals,
  redistribute,
  selectBest,
  type Analysis,
  type Scenario,
} from "@/lib/decision";
import type { ScenarioActions } from "@/hooks/use-scenario";
import { Notice, Panel, Section } from "./shared";
import { cn } from "@/lib/utils";

const lineColor = (i: number) => `var(--chart-${(i % 5) + 1})`;

export function SensitivitySection({
  scenario,
  analysis,
  actions,
}: {
  scenario: Scenario;
  analysis: Analysis;
  actions: ScenarioActions;
}) {
  const [stateId, setStateId] = useState<string | null>(null);
  const [whatIf, setWhatIf] = useState<{ stateId: string; p: number } | null>(null);

  const ready = analysis.matrix && analysis.validProbs;
  const k = Math.max(0, scenario.states.findIndex((s) => s.id === stateId));
  const selected = scenario.states[k];

  return (
    <Section
      id="sensitivity"
      eyebrow="Step 4"
      title="Probability sensitivity"
      description="Probabilities are usually subjective estimates. Move one state's probability and watch whether the preferred alternative (by EMV) changes. The remaining probability is shared among the other states in their original proportions, so the total always stays 100%."
    >
      {!analysis.matrix ? (
        <Notice tone="error" title="Sensitivity analysis is paused">{analysis.blockers.join(" ")}</Notice>
      ) : !ready ? (
        <Notice tone="error" title="Valid probabilities needed">
          {analysis.probMessage} Sensitivity starts from your scenario's probabilities, so fix them in the payoff table first.
        </Notice>
      ) : (
        <Body
          key={selected.id}
          analysis={analysis}
          scenario={scenario}
          k={k}
          p={whatIf && whatIf.stateId === selected.id ? whatIf.p : analysis.validProbs![k]}
          setP={(p) => setWhatIf({ stateId: selected.id, p })}
          resetP={() => setWhatIf(null)}
          onStateChange={(id) => {
            setStateId(id);
            setWhatIf(null);
          }}
          onApply={(values) => {
            actions.setProbabilities(values);
            setWhatIf(null);
          }}
        />
      )}
    </Section>
  );
}

function Body({
  analysis,
  scenario,
  k,
  p,
  setP,
  resetP,
  onStateChange,
  onApply,
}: {
  analysis: Analysis;
  scenario: Scenario;
  k: number;
  p: number;
  setP: (p: number) => void;
  resetP: () => void;
  onStateChange: (id: string) => void;
  onApply: (v: number[]) => void;
}) {
  const m = analysis.matrix!;
  const base = analysis.validProbs!;
  const unit = scenario.unit;
  const names = analysis.altNames;
  const stateName = analysis.stateNames[k];

  const probs = redistribute(base, k, p);
  const emvs = emvScores(m, probs);
  const best = selectBest(emvs, "max");
  const baseBest = analysis.results.emv!;
  const changed = best.winners.join() !== baseBest.winners.join();
  const lines = emvLines(m, base, k);
  const intervals = preferenceIntervals(lines);

  const chartData = Array.from({ length: 21 }, (_, t) => {
    const x = t / 20;
    const row: Record<string, number> = { p: Math.round(x * 100) };
    lines.forEach((l, i) => (row[`a${i}`] = Math.round((l.a + l.b * x) * 100) / 100));
    return row;
  });
  const tableRows = Array.from({ length: 11 }, (_, t) => {
    const x = t / 10;
    const e = lines.map((l) => l.a + l.b * x);
    return { x, e, winners: selectBest(e, "max").winners };
  });
  const minE = Math.min(...emvs);
  const maxE = Math.max(...emvs);
  const span = Math.max(maxE - Math.min(0, minE), 1e-9);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <Panel className="space-y-5">
          <div>
            <Label htmlFor="sens-state">State to adjust</Label>
            <Select value={scenario.states[k].id} onValueChange={onStateChange}>
              <SelectTrigger id="sens-state" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scenario.states.map((s, j) => (
                  <SelectItem key={s.id} value={s.id}>
                    {analysis.stateNames[j]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <Label id="sens-slider-label">P({stateName})</Label>
              <span className="num text-2xl font-semibold">{formatPercent(p)}</span>
            </div>
            <Slider
              className="mt-3"
              aria-labelledby="sens-slider-label"
              min={0}
              max={100}
              step={1}
              value={[Math.round(p * 1000) / 10]}
              onValueChange={([v]) => setP(v / 100)}
            />
            <p className="mt-2 text-xs text-muted-foreground">Scenario value: {formatPercent(base[k])}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Resulting probabilities</p>
            <ul className="mt-2 space-y-1 text-sm">
              {probs.map((q, j) => (
                <li key={j} className="flex justify-between">
                  <span className={cn(j === k && "font-semibold")}>{analysis.stateNames[j]}</span>
                  <span className="num">{formatPercent(q, 2)}</span>
                </li>
              ))}
              <li className="flex justify-between border-t pt-1 font-semibold">
                <span>Total</span>
                <span className="num text-success">{formatPercent(probs.reduce((s, v) => s + v, 0), 2)}</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={resetP}>
              Back to scenario value
            </Button>
            <Button size="sm" onClick={() => onApply(probs)}>
              Apply to scenario
            </Button>
          </div>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-xl font-semibold">EMV at P({stateName}) = {formatPercent(p)}</h3>
            {changed && <span className="rounded-full bg-warning/30 px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">Preference changed</span>}
          </div>
          <ul className="mt-4 space-y-3">
            {emvs.map((e, i) => {
              const win = best.winners.includes(i);
              const w = (Math.abs(e) / span) * 100;
              return (
                <li key={i}>
                  <div className="flex justify-between text-sm">
                    <span className={cn(win && "font-semibold")}>{names[i]}{win && " ★"}</span>
                    <span className="num">{formatValue(e, unit)}</span>
                  </div>
                  <div className="mt-1 h-2.5 rounded-full bg-muted" aria-hidden>
                    <div className={cn("h-full rounded-full", e < 0 ? "bg-destructive" : win ? "bg-violet" : "bg-primary/40")} style={{ width: `${Math.max(w, 1)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm">
            Preferred by EMV: <strong>{listNames(best.winners, names)}</strong>
            {best.winners.length > 1 && " (tie)"}. With your scenario probabilities it is{" "}
            <strong>{listNames(baseBest.winners, names)}</strong>.
          </p>
        </Panel>
      </div>

      <Panel>
        <h3 className="font-display text-xl font-semibold">EMV as P({stateName}) goes from 0% to 100%</h3>
        <p className="mt-1 text-sm text-muted-foreground">Each line is exact: EMV changes in a straight line as one probability moves.</p>
        <div className="mt-4 h-72 w-full" role="img" aria-label={`Line chart of EMV for each alternative as the probability of ${stateName} varies`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="p" unit="%" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} width={48} />
              <Tooltip
                formatter={(v: number, name: string) => [formatValue(v, unit), name]}
                labelFormatter={(l) => `P(${stateName}) = ${l}%`}
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine x={Math.round(p * 100)} stroke="var(--foreground)" strokeDasharray="4 4" label={{ value: "now", position: "top", fontSize: 11, fill: "var(--foreground)" }} />
              {lines.map((_, i) => (
                <Line key={i} type="linear" dataKey={`a${i}`} name={names[i]} stroke={lineColor(i)} strokeWidth={2.5} dot={false} isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4">
          <p className="text-sm font-semibold">Where the preferred alternative switches</p>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {intervals.map((iv, i) => (
              <li key={i} className="rounded-lg border bg-muted/50 px-3 py-1.5">
                <span className="num">{formatPercent(iv.from)}–{formatPercent(iv.to)}</span>: <strong>{listNames(iv.winners, names)}</strong>
              </li>
            ))}
          </ul>
        </div>
      </Panel>

      <Panel className="p-0 md:p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="p-4 text-left font-display text-lg font-semibold text-foreground">Sensitivity table</caption>
            <thead>
              <tr className="border-y bg-muted/60 text-left">
                <th scope="col" className="p-3">P({stateName})</th>
                {names.map((n, i) => (
                  <th key={i} scope="col" className="p-3 text-right">{n}</th>
                ))}
                <th scope="col" className="p-3">Preferred</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r) => (
                <tr key={r.x} className="border-b last:border-b-0">
                  <th scope="row" className="num p-3 text-left font-medium">{formatPercent(r.x, 0)}</th>
                  {r.e.map((e, i) => (
                    <td key={i} className={cn("num p-3 text-right", r.winners.includes(i) && "bg-accent font-semibold")}>
                      {formatNumber(e)}
                    </td>
                  ))}
                  <td className="p-3">{listNames(r.winners, names)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Notice tone="info" title="Why this matters">
        EMV depends entirely on the probabilities you assume. If a small, realistic change in a probability flips the
        preferred alternative, the decision is <em>sensitive</em> — gather better information or use a criterion that
        does not need probabilities.
      </Notice>
    </div>
  );
}
