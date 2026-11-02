import { Plus, Trash2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  formatPercent,
  MIN_ALTERNATIVES,
  MIN_STATES,
  PROB_TOLERANCE,
  type Analysis,
  type ProbMode,
  type Scenario,
} from "@/lib/decision";
import type { ScenarioActions } from "@/hooks/use-scenario";
import { InfoTip, Notice, Panel, Section } from "./shared";
import { cn } from "@/lib/utils";

export function PayoffSection({
  scenario,
  analysis,
  actions,
}: {
  scenario: Scenario;
  analysis: Analysis;
  actions: ScenarioActions;
}) {
  const { alternatives, states } = scenario;
  const invalidSet = new Set(analysis.invalidCells.map((c) => `${c.altIndex}:${c.stateIndex}`));
  const allParsed = analysis.probs.every((p) => p !== null);
  const rawTotal = allParsed ? analysis.probs.reduce<number>((t, p) => t + (p ?? 0), 0) : null;
  const canNormalize = rawTotal !== null && rawTotal > 0 && Math.abs(rawTotal - 1) > PROB_TOLERANCE;

  return (
    <Section
      id="payoff"
      eyebrow="Step 1"
      title="Payoff table"
      description={
        <>
          Rows are your <strong className="text-foreground">alternatives</strong> (what you can choose). Columns are{" "}
          <strong className="text-foreground">states of nature</strong> (what might happen, outside your control). Each
          cell is the payoff in <span className="num text-foreground">{scenario.unit || "units"}</span>.
        </>
      }
    >
      <Panel className="p-0 md:p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <caption className="sr-only">
              Editable payoff matrix with state probabilities, in {scenario.unit}
            </caption>
            <thead>
              <tr className="border-b bg-muted/60 align-top">
                <th scope="col" className="sticky left-0 z-10 w-52 bg-muted p-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Alternative ↓ / State →
                  <span className="mt-6 block normal-case tracking-normal">Probability</span>
                </th>
                {states.map((st, j) => {
                  const err = analysis.probErrors[j];
                  return (
                    <th key={st.id} scope="col" className="min-w-[150px] p-3 text-left font-normal">
                      <div className="flex items-center gap-1">
                        <Input
                          aria-label={`Name of state ${j + 1}`}
                          value={st.name}
                          onChange={(e) => actions.renameState(st.id, e.target.value)}
                          className="h-9 bg-card font-semibold"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0"
                          aria-label={`Delete state ${analysis.stateNames[j]}`}
                          title={states.length <= MIN_STATES ? `At least ${MIN_STATES} states are required` : "Delete state"}
                          disabled={states.length <= MIN_STATES}
                          onClick={() => actions.removeState(st.id)}
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <Input
                          aria-label={`Probability of ${analysis.stateNames[j]} (${scenario.probMode === "percent" ? "percent" : "decimal"})`}
                          inputMode="decimal"
                          value={st.prob}
                          aria-invalid={!!err}
                          aria-describedby={err ? `prob-err-${st.id}` : undefined}
                          onChange={(e) => actions.setProb(st.id, e.target.value)}
                          className={cn("num h-9 w-24 bg-card", err && "border-destructive")}
                        />
                        <span className="text-xs text-muted-foreground">{scenario.probMode === "percent" ? "%" : "(0–1)"}</span>
                      </div>
                      {err && (
                        <p id={`prob-err-${st.id}`} className="mt-1 text-xs font-medium text-destructive">
                          {err}
                        </p>
                      )}
                    </th>
                  );
                })}
                <th scope="col" className="p-3 text-left">
                  <Button variant="outline" size="sm" onClick={actions.addState} className="bg-card">
                    <Plus aria-hidden /> State
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {alternatives.map((alt, i) => (
                <tr key={alt.id} className="border-b last:border-b-0">
                  <th scope="row" className="sticky left-0 z-10 bg-card p-3 text-left font-normal">
                    <div className="flex items-center gap-1">
                      <Input
                        aria-label={`Name of alternative ${i + 1}`}
                        value={alt.name}
                        onChange={(e) => actions.renameAlternative(alt.id, e.target.value)}
                        className="h-9 font-semibold"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        aria-label={`Delete alternative ${analysis.altNames[i]}`}
                        title={alternatives.length <= MIN_ALTERNATIVES ? `At least ${MIN_ALTERNATIVES} alternatives are required` : "Delete alternative"}
                        disabled={alternatives.length <= MIN_ALTERNATIVES}
                        onClick={() => actions.removeAlternative(alt.id)}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  </th>
                  {states.map((st, j) => {
                    const bad = invalidSet.has(`${i}:${j}`);
                    const v = analysis.cells[i][j];
                    return (
                      <td key={st.id} className="p-3">
                        <Input
                          inputMode="decimal"
                          aria-label={`Payoff for ${analysis.altNames[i]} if ${analysis.stateNames[j]}`}
                          aria-invalid={bad}
                          placeholder="Enter value"
                          value={scenario.payoffs[alt.id]?.[st.id] ?? ""}
                          onChange={(e) => actions.setPayoff(alt.id, st.id, e.target.value)}
                          className={cn(
                            "num h-9 text-right",
                            bad && "border-destructive bg-destructive/5",
                            v !== null && v < 0 && "text-destructive",
                          )}
                        />
                      </td>
                    );
                  })}
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
          <Button variant="outline" size="sm" onClick={actions.addAlternative}>
            <Plus aria-hidden /> Alternative
          </Button>
          <p className="text-xs text-muted-foreground">Negative numbers are losses. Use “-50” for a loss of 50.</p>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
        <div
          role="status"
          className={cn(
            "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border p-4 text-sm",
            analysis.probsValid ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5",
          )}
        >
          <span className="font-semibold">
            Probability total:{" "}
            <span className="num">{analysis.probTotal !== null ? formatPercent(analysis.probTotal, 2) : "—"}</span>
          </span>
          <span className={analysis.probsValid ? "text-success" : "text-destructive"}>{analysis.probMessage}</span>
          {canNormalize && (
            <Button
              size="sm"
              variant="outline"
              className="bg-card"
              onClick={() => actions.setProbabilities(analysis.probs.map((p) => (p ?? 0) / rawTotal!))}
            >
              <Scale aria-hidden /> Scale to 100%
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-xl border bg-card p-3">
          <span className="text-sm font-medium" id="prob-mode-label">
            Enter probabilities as
          </span>
          <ToggleGroup
            type="single"
            aria-labelledby="prob-mode-label"
            value={scenario.probMode}
            onValueChange={(v) => v && actions.setProbMode(v as ProbMode)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="percent" aria-label="Percentages">
              %
            </ToggleGroupItem>
            <ToggleGroupItem value="decimal" aria-label="Decimals">
              0.00
            </ToggleGroupItem>
          </ToggleGroup>
          <InfoTip label="About probability formats">
            Switching converts valid entries. You can also type a “%” sign in decimal mode, e.g. “30%”.
          </InfoTip>
        </div>
      </div>

      {analysis.blockers.length > 0 && (
        <div className="mt-4">
          <Notice tone="error" title="Results are paused until the table is complete">
            <ul className="list-disc pl-5">
              {analysis.blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </Notice>
        </div>
      )}
      {analysis.warnings.length > 0 && (
        <div className="mt-4">
          <Notice title="Check your labels">{analysis.warnings.join(" ")}</Notice>
        </div>
      )}
    </Section>
  );
}
