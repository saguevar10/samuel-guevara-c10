import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  ALL_CRITERIA,
  CRITERIA,
  describeElimination,
  formatValue,
  listNames,
  parseNumber,
  runStagedFilter,
  type Analysis,
  type Scenario,
  type StagedResult,
  type TiePolicy,
} from "@/lib/decision";
import { DEFAULT_STAGED, type StagedConfig } from "@/hooks/use-scenario";
import { AltChip, CRIT_STYLES, Notice, Panel, Section } from "./shared";
import { FlowDiagram } from "./FlowDiagram";
import { cn } from "@/lib/utils";

export function StagedSection({
  scenario,
  analysis,
  config,
  setConfig,
}: {
  scenario: Scenario;
  analysis: Analysis;
  config: StagedConfig;
  setConfig: (p: Partial<StagedConfig>) => void;
}) {
  const activeOrder = config.order.filter((c) => config.enabled[c]);
  const allOn = ALL_CRITERIA.every((c) => config.enabled[c]);
  const band = parseNumber(config.bandRaw);
  const bandValid = band !== null && band >= 0;
  const policy: TiePolicy | null =
    config.policyKind === "exact" ? { kind: "exact" } : bandValid ? { kind: "band", band: band! } : null;

  const result: StagedResult | null =
    analysis.matrix && policy && activeOrder.length > 0
      ? runStagedFilter(analysis.matrix, analysis.validProbs, activeOrder, policy)
      : null;

  const move = (i: number, d: -1 | 1) => {
    const order = [...config.order];
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    setConfig({ order });
  };

  return (
    <Section
      id="staged"
      eyebrow="Step 3"
      title="Staged filtering"
      description="Apply criteria one after another. Each stage only looks at the alternatives that survived the previous stage — a structured way to combine attitudes to risk."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <Panel className="space-y-6 self-start">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Stage order</h3>
              <Button variant="ghost" size="sm" onClick={() => setConfig({ order: DEFAULT_STAGED.order, enabled: DEFAULT_STAGED.enabled })}>
                <RotateCcw aria-hidden /> Default
              </Button>
            </div>
            <ol className="mt-3 space-y-2" aria-label="Criteria order">
              {config.order.map((c, i) => {
                const on = config.enabled[c];
                const stageNo = on ? activeOrder.indexOf(c) + 1 : null;
                return (
                  <li key={c} className={cn("flex items-center gap-2 rounded-xl border p-2 pl-3", on ? "bg-card" : "bg-muted/60 text-muted-foreground")}>
                    <span className={cn("num flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold", on ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                      {stageNo ?? "–"}
                    </span>
                    <span className="flex-1 text-sm font-medium">
                      <span className={on ? CRIT_STYLES[c].text : undefined}>{CRITERIA[c].name}</span>
                    </span>
                    <Button variant="ghost" size="icon" className="size-8" aria-label={`Move ${CRITERIA[c].name} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowUp aria-hidden />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8" aria-label={`Move ${CRITERIA[c].name} down`} disabled={i === config.order.length - 1} onClick={() => move(i, 1)}>
                      <ArrowDown aria-hidden />
                    </Button>
                    <Switch
                      checked={on}
                      aria-label={`Use ${CRITERIA[c].name}`}
                      onCheckedChange={(v) => setConfig({ enabled: { ...config.enabled, [c]: v } })}
                    />
                  </li>
                );
              })}
            </ol>
            <div className="mt-3 flex items-center gap-2">
              <Switch
                id="use-all"
                checked={allOn}
                onCheckedChange={(v) =>
                  setConfig({
                    enabled: v
                      ? { maximax: true, maximin: true, regret: true, emv: true }
                      : DEFAULT_STAGED.enabled,
                  })
                }
              />
              <Label htmlFor="use-all">Use all four criteria</Label>
            </div>
          </div>

          <fieldset>
            <legend className="font-display text-lg font-semibold">Tie policy</legend>
            <p className="mt-1 text-xs text-muted-foreground">Ties are never broken arbitrarily — tied alternatives always move on together.</p>
            <RadioGroup
              className="mt-3 space-y-2"
              value={config.policyKind}
              onValueChange={(v) => setConfig({ policyKind: v as StagedConfig["policyKind"] })}
            >
              <div className="flex items-start gap-2">
                <RadioGroupItem value="exact" id="tie-exact" className="mt-0.5" />
                <Label htmlFor="tie-exact" className="font-normal leading-snug">
                  <span className="font-medium">Retain exact ties only</span>
                  <span className="block text-xs text-muted-foreground">Keep every alternative equal to the best score.</span>
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="band" id="tie-band" className="mt-0.5" />
                <Label htmlFor="tie-band" className="font-normal leading-snug">
                  <span className="font-medium">Also retain near-ties</span>
                  <span className="block text-xs text-muted-foreground">Keep alternatives within a margin of the best score.</span>
                </Label>
              </div>
            </RadioGroup>
            {config.policyKind === "band" && (
              <div className="mt-3 pl-6">
                <Label htmlFor="band">Margin ({scenario.unit || "units"})</Label>
                <Input
                  id="band"
                  inputMode="decimal"
                  className={cn("num mt-1 w-28", !bandValid && "border-destructive")}
                  value={config.bandRaw}
                  aria-invalid={!bandValid}
                  onChange={(e) => setConfig({ bandRaw: e.target.value })}
                />
                {!bandValid && <p className="mt-1 text-xs text-destructive">Enter a number ≥ 0.</p>}
              </div>
            )}
          </fieldset>
        </Panel>

        <div className="min-w-0 space-y-4">
          {!analysis.matrix ? (
            <Notice tone="error" title="Staged filtering is paused">{analysis.blockers.join(" ")}</Notice>
          ) : activeOrder.length === 0 ? (
            <Notice title="No stages selected">Switch on at least one criterion to start filtering.</Notice>
          ) : !policy ? (
            <Notice tone="error" title="Invalid near-tie margin">Enter a margin of 0 or more.</Notice>
          ) : result ? (
            <>
              <FlowDiagram result={result} names={analysis.altNames} unit={scenario.unit} />
              <StageDetails result={result} analysis={analysis} unit={scenario.unit} policy={policy} />
            </>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

function StageDetails({
  result,
  analysis,
  unit,
  policy,
}: {
  result: StagedResult;
  analysis: Analysis;
  unit: string;
  policy: TiePolicy;
}) {
  const names = analysis.altNames;
  return (
    <div className="space-y-4">
      {result.stages.map((s) => {
        const info = CRITERIA[s.criterion];
        return (
          <Panel key={s.stage} className="p-0 md:p-0">
            <div className={cn("flex flex-wrap items-center justify-between gap-2 rounded-t-2xl border-b p-4", CRIT_STYLES[s.criterion].bg)}>
              <h4 className="font-display text-lg font-semibold">
                Stage {s.stage}: <span className={CRIT_STYLES[s.criterion].text}>{info.name}</span>
              </h4>
              <span className="text-xs text-muted-foreground">{info.rule}</span>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <p>
                <span className="text-muted-foreground">Candidates before: </span>
                <span className="inline-flex flex-wrap gap-1 align-middle">
                  {s.candidates.map((c) => (
                    <AltChip key={c} name={names[c]} />
                  ))}
                </span>
              </p>
              {s.status === "blocked" ? (
                <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-destructive">
                  Not run: EMV needs valid probabilities. {analysis.probMessage} All candidates are carried forward, so
                  the result below is provisional.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[420px] text-sm">
                      <caption className="sr-only">Stage {s.stage} scores</caption>
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th scope="col" className="py-2 font-medium">Alternative</th>
                          <th scope="col" className="py-2 text-right font-medium">{info.scoreLabel}</th>
                          <th scope="col" className="py-2 pl-4 font-medium">Outcome</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.scores.map(({ alt, score }) => {
                          const elim = s.eliminated.find((e) => e.alt === alt);
                          return (
                            <tr key={alt} className="border-b last:border-b-0 align-top">
                              <th scope="row" className="py-2 text-left font-medium">{names[alt]}</th>
                              <td className="num py-2 text-right">{formatValue(score, unit)}</td>
                              <td className="py-2 pl-4">
                                {elim ? (
                                  <span className="text-destructive">
                                    Eliminated — {describeElimination(s.criterion, elim.score, s.best!, elim.gap, unit)}
                                    {policy.kind === "band" && ` Outside the ${formatValue(policy.band, unit)} margin.`}
                                  </span>
                                ) : (
                                  <span className="font-medium text-success">Retained</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-muted-foreground">
                    Best score: <span className="num font-semibold text-foreground">{formatValue(s.best!, unit)}</span>
                    {s.regretBasis && (
                      <> · Regret recalculated among these candidates only (state bests: {s.regretBasis.map((b) => formatValue(b, unit)).join(", ")}).</>
                    )}
                  </p>
                  {s.candidates.length === 1 ? (
                    <p className="text-muted-foreground">Only one alternative remains — this stage confirms it.</p>
                  ) : s.allTied ? (
                    <p className="font-medium">All candidates tie at this stage, so all are retained and filtering continues.</p>
                  ) : null}
                </>
              )}
            </div>
          </Panel>
        );
      })}
      <div className="rounded-2xl border-2 border-primary bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet">{result.complete ? "Final outcome" : "Provisional outcome"}</p>
        <p className="font-display mt-1 text-2xl font-semibold">{listNames(result.final, names)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {result.final.length > 1
            ? `${result.final.length} alternatives remain tied after all stages. The filter does not pick between them — use judgement or another criterion.`
            : result.complete
              ? "This is the only alternative that survived every stage."
              : "This is the only alternative left, but at least one stage could not run — treat it as provisional."}
        </p>
      </div>
    </div>
  );
}
