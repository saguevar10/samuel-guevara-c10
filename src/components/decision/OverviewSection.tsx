import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ALL_CRITERIA, CRITERIA, formatValue, listNames, type Analysis, type Scenario } from "@/lib/decision";
import type { ScenarioActions } from "@/hooks/use-scenario";
import { CRIT_STYLES, Panel } from "./shared";
import { cn } from "@/lib/utils";

export function OverviewSection({
  scenario,
  analysis,
  actions,
}: {
  scenario: Scenario;
  analysis: Analysis;
  actions: ScenarioActions;
}) {
  return (
    <section id="overview" aria-labelledby="overview-title" className="scroll-mt-32 pt-8 md:pt-12">
      <div className="bg-hero rounded-3xl border bg-paper p-6 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Overview · Individual decision analysis</p>
        <h1 id="overview-title" className="font-display mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] md:text-6xl">
          Decisions Under Uncertainty
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Build a payoff table, compare four decision criteria, filter alternatives in stages and test how your
          probability assumptions change the answer.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Panel className="space-y-4">
            <div>
              <Label htmlFor="scenario-title">Scenario title</Label>
              <Input
                id="scenario-title"
                className="font-display mt-1.5 h-11 text-lg"
                value={scenario.title}
                onChange={(e) => actions.patch({ title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="scenario-context">Financial context</Label>
              <Textarea
                id="scenario-context"
                rows={4}
                className="mt-1.5"
                value={scenario.context}
                onChange={(e) => actions.patch({ context: e.target.value })}
              />
            </div>
            <div className="max-w-[220px]">
              <Label htmlFor="scenario-unit">Currency / unit label</Label>
              <Input
                id="scenario-unit"
                className="mt-1.5"
                value={scenario.unit}
                onChange={(e) => actions.patch({ unit: e.target.value })}
                aria-describedby="unit-help"
              />
              <p id="unit-help" className="mt-1 text-xs text-muted-foreground">
                e.g. “$”, “$000s” (thousands), “€”.
              </p>
            </div>
          </Panel>

          <Panel>
            <h3 className="font-display text-xl font-semibold">At a glance</h3>
            <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <Stat label="Alternatives" value={String(scenario.alternatives.length)} />
              <Stat label="States" value={String(scenario.states.length)} />
              <div className="rounded-lg bg-muted p-3">
                <dt className="text-xs text-muted-foreground">Probabilities</dt>
                <dd className={cn("mt-1 flex items-center gap-1 font-semibold", analysis.probsValid ? "text-success" : "text-destructive")}>
                  {analysis.probsValid ? <CheckCircle2 className="size-4" aria-hidden /> : <AlertTriangle className="size-4" aria-hidden />}
                  {analysis.probsValid ? "Valid" : "Invalid"}
                </dd>
              </div>
            </dl>
            {!analysis.canCalculate ? (
              <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                {analysis.blockers.join(" ")} Fix the payoff table to see results.
              </p>
            ) : (
              <ul className="mt-4 divide-y">
                {ALL_CRITERIA.map((id) => {
                  const r = analysis.results[id];
                  return (
                    <li key={id} className="flex items-start justify-between gap-3 py-2.5">
                      <span className="flex items-center gap-2 text-sm">
                        <span className={cn("size-2.5 rounded-full", CRIT_STYLES[id].dot)} aria-hidden />
                        <span className="font-medium">{CRITERIA[id].name}</span>
                      </span>
                      <span className="text-right text-sm">
                        {r ? (
                          <>
                            <span className="font-semibold">{listNames(r.winners, analysis.altNames)}</span>
                            <span className="num ml-2 text-muted-foreground">{formatValue(r.best, scenario.unit)}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Needs valid probabilities</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <Accordion type="single" collapsible className="mt-6 rounded-2xl border bg-card px-5">
          <AccordionItem value="method" className="border-b-0">
            <AccordionTrigger className="text-sm font-semibold">Methodology notes</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                <li>Payoffs are profits; negative numbers are losses. Blank or non-numeric cells block every calculation — they are never treated as zero.</li>
                <li>Ties are detected with a tiny numerical tolerance (relative 10⁻⁹) and all tied alternatives are listed. Nothing is broken at random.</li>
                <li>Regret (opportunity loss) = best payoff in that state − the alternative's payoff.</li>
                <li>EMV = Σ payoff × probability. It only runs when every probability is in [0, 1] and they total 100% (± 0.05 points).</li>
                <li>Your scenario is saved in this browser automatically. “Reset” restores the selected example.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="num mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}
