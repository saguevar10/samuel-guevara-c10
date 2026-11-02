import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ALL_CRITERIA,
  approxEqual,
  CRITERIA,
  formatNumber,
  formatValue,
  listNames,
  type Analysis,
  type CriterionId,
  type Scenario,
} from "@/lib/decision";
import { CRIT_STYLES, InfoTip, Notice, Panel, Section } from "./shared";
import { cn } from "@/lib/utils";

export function CriteriaSection({ scenario, analysis }: { scenario: Scenario; analysis: Analysis }) {
  const unit = scenario.unit;
  const { results, regret, altNames, stateNames } = analysis;

  return (
    <Section
      id="criteria"
      eyebrow="Step 2"
      title="Four decision criteria"
      description="Each criterion reflects a different attitude to risk. The same payoff table can point to different choices — that is the point."
    >
      {!analysis.canCalculate ? (
        <Notice tone="error" title="No results yet">
          {analysis.blockers.join(" ")}
        </Notice>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {ALL_CRITERIA.map((id) => (
              <CriterionCard key={id} id={id} analysis={analysis} unit={unit} />
            ))}
          </div>

          <Panel className="mt-6 p-0 md:p-0">
            <div className="flex items-center justify-between p-5 pb-3">
              <h3 className="font-display text-xl font-semibold">Comparison table</h3>
              <span className="text-xs text-muted-foreground">✓ = chosen by that criterion</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <caption className="sr-only">Scores of each alternative under each criterion</caption>
                <thead>
                  <tr className="border-y bg-muted/60 text-left">
                    <th scope="col" className="p-3 font-semibold">Alternative</th>
                    {ALL_CRITERIA.map((id) => (
                      <th key={id} scope="col" className="p-3 text-right font-semibold">
                        <span className={CRIT_STYLES[id].text}>{CRITERIA[id].name}</span>
                        <span className="block text-xs font-normal text-muted-foreground">{CRITERIA[id].scoreLabel}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {altNames.map((name, i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      <th scope="row" className="p-3 text-left font-medium">{name}</th>
                      {ALL_CRITERIA.map((id) => {
                        const r = results[id];
                        const win = r?.winners.includes(i);
                        return (
                          <td key={id} className={cn("num p-3 text-right", win && cn(CRIT_STYLES[id].bg, "font-semibold"))}>
                            {r ? (
                              <span className="inline-flex items-center gap-1">
                                {win && <Check className={cn("size-3.5", CRIT_STYLES[id].text)} aria-label="chosen" />}
                                {formatValue(r.scores[i], unit)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!results.emv && (
              <p className="border-t p-4 text-sm text-destructive">EMV is not shown: {analysis.probMessage}</p>
            )}
          </Panel>

          {regret && (
            <Panel className="mt-6 p-0 md:p-0">
              <div className="p-5 pb-3">
                <h3 className="font-display flex items-center gap-2 text-xl font-semibold">
                  Opportunity-loss (regret) matrix
                  <InfoTip label="What is regret?">
                    Regret = best payoff in that state − this alternative's payoff. It measures how much you would wish
                    you had chosen differently once you know what happened.
                  </InfoTip>
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Highlighted cells are each row's maximum regret.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <caption className="sr-only">Regret matrix: best payoff per state minus each payoff</caption>
                  <thead>
                    <tr className="border-y bg-muted/60 text-left">
                      <th scope="col" className="p-3 font-semibold">Alternative</th>
                      {stateNames.map((s, j) => (
                        <th key={j} scope="col" className="p-3 text-right font-semibold">{s}</th>
                      ))}
                      <th scope="col" className="p-3 text-right font-semibold text-crit-regret">Max regret</th>
                    </tr>
                    <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                      <th scope="row" className="p-3 text-left font-normal">Best payoff in state</th>
                      {regret.stateBest.map((b, j) => (
                        <td key={j} className="num p-3 text-right">{formatValue(b, unit)}</td>
                      ))}
                      <td />
                    </tr>
                  </thead>
                  <tbody>
                    {regret.regrets.map((row, i) => (
                      <tr key={i} className="border-b last:border-b-0">
                        <th scope="row" className="p-3 text-left font-medium">{altNames[i]}</th>
                        {row.map((v, j) => (
                          <td
                            key={j}
                            className={cn(
                              "num p-3 text-right",
                              approxEqual(v, regret.maxRegret[i]) && "bg-crit-regret/10 font-semibold text-crit-regret",
                            )}
                          >
                            {formatNumber(v)}
                          </td>
                        ))}
                        <td className={cn("num p-3 text-right font-semibold", results.regret?.winners.includes(i) && "bg-crit-regret/10")}>
                          {formatValue(regret.maxRegret[i], unit)}
                          {results.regret?.winners.includes(i) && <Check className="ml-1 inline size-3.5 text-crit-regret" aria-label="chosen" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </>
      )}
    </Section>
  );
}

function CriterionCard({ id, analysis, unit }: { id: CriterionId; analysis: Analysis; unit: string }) {
  const info = CRITERIA[id];
  const r = analysis.results[id];
  const st = CRIT_STYLES[id];
  return (
    <article className={cn("flex flex-col rounded-2xl border-t-4 border bg-card p-5 shadow-card", st.border)} aria-labelledby={`card-${id}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 id={`card-${id}`} className="font-display text-xl font-semibold">{info.name}</h3>
        <Badge variant="outline" className={cn("border-transparent", st.bg, st.text)}>
          {info.attitude}
        </Badge>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{info.summary}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {info.needsProbabilities ? "Needs probabilities." : "No probabilities needed."} {info.rule}
      </p>
      <div className="mt-auto pt-4">
        {r ? (
          <div className={cn("rounded-xl p-3", st.bg)}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {r.winners.length > 1 ? `Tie — ${r.winners.length} alternatives` : "Choose"}
            </p>
            <p className="mt-0.5 font-semibold leading-snug">{listNames(r.winners, analysis.altNames)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {info.scoreLabel}: <span className="num font-semibold text-foreground">{formatValue(r.best, unit)}</span>
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-destructive/40 p-3 text-sm text-destructive">
            {analysis.probMessage}
          </div>
        )}
      </div>
    </article>
  );
}
