import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  ALL_CRITERIA,
  CRITERIA,
  formatValue,
  listNames,
  recommendCriterion,
  type Analysis,
  type CriterionId,
  type RiskAttitude,
  type Scenario,
} from "@/lib/decision";
import { CRIT_STYLES, Panel, Section } from "./shared";
import { cn } from "@/lib/utils";

const GUIDE: Record<CriterionId, { probs: string; suits: string; watch: string }> = {
  maximax: {
    probs: "No probabilities needed",
    suits: "Optimistic decision-makers who can afford a bad outcome and want the biggest upside.",
    watch: "Ignores the worst case completely.",
  },
  maximin: {
    probs: "No probabilities needed",
    suits: "Cautious decision-makers, or when a loss would be very damaging (e.g. little cash to fall back on).",
    watch: "Can give up large gains to avoid an unlikely loss.",
  },
  regret: {
    probs: "No probabilities needed",
    suits: "When you want to minimise the worst missed opportunity — a balanced middle ground.",
    watch: "Results can change if a new alternative is added.",
  },
  emv: {
    probs: "Needs credible probabilities",
    suits: "Repeated decisions, or when probabilities come from good evidence. Compares long-run average payoffs.",
    watch: "EMV is an average, not a guaranteed outcome — one decision can still turn out badly.",
  },
};

export function GuideSection({ scenario, analysis }: { scenario: Scenario; analysis: Analysis }) {
  const [attitude, setAttitude] = useState<RiskAttitude>("balanced");
  const [credible, setCredible] = useState(true);
  const [repeated, setRepeated] = useState(false);

  const rec = recommendCriterion({ attitude, probsValid: analysis.probsValid, probsCredible: credible, repeated });
  const r = analysis.results[rec.criterion];

  return (
    <Section
      id="guide"
      eyebrow="C10 · Choosing a criterion"
      title="Decision guide"
      description="There is no single correct criterion. The right choice depends on what information you have, how you feel about risk, and the context of the decision."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ALL_CRITERIA.map((id) => (
          <article key={id} className={cn("rounded-2xl border bg-card p-5 shadow-card")}>
            <h3 className={cn("font-display text-lg font-semibold", CRIT_STYLES[id].text)}>{CRITERIA[id].name}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{GUIDE[id].probs}</p>
            <p className="mt-2 text-sm leading-relaxed">{GUIDE[id].suits}</p>
            <p className="mt-2 text-sm text-muted-foreground">Watch out: {GUIDE[id].watch}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <Panel className="space-y-5">
          <fieldset>
            <legend className="font-display text-lg font-semibold">Your risk attitude</legend>
            <RadioGroup className="mt-3 space-y-2" value={attitude} onValueChange={(v) => setAttitude(v as RiskAttitude)}>
              {(
                [
                  ["optimistic", "Optimistic", "I focus on the best that could happen."],
                  ["balanced", "Balanced", "I weigh upside and downside."],
                  ["conservative", "Conservative", "I want to avoid the worst outcome."],
                ] as const
              ).map(([v, l, d]) => (
                <div key={v} className="flex items-start gap-2">
                  <RadioGroupItem value={v} id={`att-${v}`} className="mt-0.5" />
                  <Label htmlFor={`att-${v}`} className="font-normal leading-snug">
                    <span className="font-medium">{l}</span>
                    <span className="block text-xs text-muted-foreground">{d}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>
          <div className="flex items-start justify-between gap-3">
            <Label htmlFor="credible" className="font-normal leading-snug">
              <span className="font-medium">Probabilities are credible</span>
              <span className="block text-xs text-muted-foreground">Based on evidence such as market research or past data.</span>
            </Label>
            <Switch id="credible" checked={credible} onCheckedChange={setCredible} />
          </div>
          <div className="flex items-start justify-between gap-3">
            <Label htmlFor="repeated" className="font-normal leading-snug">
              <span className="font-medium">Repeated decision</span>
              <span className="block text-xs text-muted-foreground">You will make many similar decisions over time.</span>
            </Label>
            <Switch id="repeated" checked={repeated} onCheckedChange={setRepeated} />
          </div>
          <p className={cn("rounded-lg p-3 text-xs", analysis.probsValid ? "bg-success/10 text-success" : "bg-destructive/5 text-destructive")}>
            Scenario probabilities: {analysis.probMessage}
          </p>
        </Panel>

        <Panel className={cn("border-t-4", CRIT_STYLES[rec.criterion].border)}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Recommended criterion</p>
          <h3 className={cn("font-display mt-1 text-3xl font-semibold", CRIT_STYLES[rec.criterion].text)}>{CRITERIA[rec.criterion].name}</h3>
          {r ? (
            <p className="mt-2">
              For “{scenario.title || "this scenario"}” it points to <strong>{listNames(r.winners, analysis.altNames)}</strong>
              {r.winners.length > 1 && " (tie)"} — {CRITERIA[rec.criterion].scoreLabel.toLowerCase()}{" "}
              <span className="num font-semibold">{formatValue(r.best, scenario.unit)}</span>.
            </p>
          ) : (
            <p className="mt-2 text-destructive">Complete the payoff table to see which alternative this criterion selects.</p>
          )}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold">Why</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {rec.reasons.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Keep in mind</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {rec.caveats.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>
      </div>
    </Section>
  );
}
