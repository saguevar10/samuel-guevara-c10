import { Fragment } from "react";
import { CRITERIA, formatValue, type StagedResult } from "@/lib/decision";
import { AltChip, CRIT_STYLES } from "./shared";
import { cn } from "@/lib/utils";

function DownArrow() {
  return (
    <div className="flex justify-center py-1 md:w-[calc(55%)]" aria-hidden>
      <svg width="16" height="28" viewBox="0 0 16 28" className="stroke-foreground/40 fill-foreground/40">
        <line x1="8" y1="0" x2="8" y2="21" strokeWidth="2" />
        <path d="M2 19 L8 27 L14 19 Z" stroke="none" />
      </svg>
    </div>
  );
}

function SideArrow() {
  return (
    <svg aria-hidden width="40" height="16" viewBox="0 0 40 16" className="hidden shrink-0 self-center stroke-destructive/60 fill-destructive/60 md:block">
      <line x1="0" y1="8" x2="32" y2="8" strokeWidth="2" strokeDasharray="4 3" />
      <path d="M30 3 L38 8 L30 13 Z" stroke="none" />
    </svg>
  );
}

/** Live flow chart of the active staged-filtering process. */
export function FlowDiagram({ result, names, unit }: { result: StagedResult; names: string[]; unit: string }) {
  const start = result.stages[0]?.candidates ?? [];
  return (
    <figure className="rounded-2xl border bg-paper p-4 md:p-6" aria-labelledby="flow-caption">
      <figcaption id="flow-caption" className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-display text-lg font-semibold">Process flow</span>
        <span className="text-xs text-muted-foreground">Updates live with your table, probabilities and stage order</span>
      </figcaption>
      <ol className="list-none">
        <li>
          <div className="rounded-full border-2 border-foreground/70 bg-card px-4 py-2 text-sm md:w-[55%]">
            <span className="font-semibold">Start</span> · {start.length} alternatives
            <span className="mt-1 flex flex-wrap gap-1">
              {start.map((i) => (
                <AltChip key={i} name={names[i]} />
              ))}
            </span>
          </div>
        </li>
        {result.stages.map((s) => (
          <Fragment key={s.stage}>
            <li aria-hidden>
              <DownArrow />
            </li>
            <li className="flex flex-col gap-2 md:flex-row md:items-stretch">
              <div className={cn("rounded-lg border-2 bg-card p-3 text-sm md:w-[55%]", CRIT_STYLES[s.criterion].border)}>
                <p className="flex items-center justify-between gap-2">
                  <span className="font-semibold">
                    Stage {s.stage} · <span className={CRIT_STYLES[s.criterion].text}>{CRITERIA[s.criterion].name}</span>
                  </span>
                  {s.status === "ok" && s.best !== null && (
                    <span className="num text-xs text-muted-foreground">best {formatValue(s.best, unit)}</span>
                  )}
                </p>
                {s.status === "blocked" ? (
                  <p className="mt-1 text-xs font-medium text-destructive">Not run — probabilities invalid. All carried forward.</p>
                ) : (
                  <>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.candidates.length === 1
                        ? "One candidate — confirmed"
                        : s.allTied
                          ? "All tied — all retained"
                          : `Retained ${s.retained.length} of ${s.candidates.length}`}
                    </p>
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {s.retained.map((i) => (
                        <AltChip key={i} name={names[i]} tone="kept" />
                      ))}
                    </span>
                  </>
                )}
              </div>
              {s.eliminated.length > 0 && (
                <>
                  <SideArrow />
                  <div className="ml-6 rounded-lg border border-dashed border-destructive/50 bg-destructive/5 p-3 text-xs md:ml-0 md:flex-1">
                    <p className="font-semibold text-destructive">Eliminated</p>
                    <ul className="mt-1 space-y-1">
                      {s.eliminated.map((e) => (
                        <li key={e.alt} className="flex flex-wrap items-center gap-1.5">
                          <AltChip name={names[e.alt]} tone="out" />
                          <span className="num text-muted-foreground">{formatValue(e.score, unit)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </li>
          </Fragment>
        ))}
        <li aria-hidden>
          <DownArrow />
        </li>
        <li>
          <div className="rounded-xl border-4 border-double border-primary bg-card p-3 text-sm md:w-[55%]">
            <p className="font-semibold">{result.complete ? "Final" : "Provisional final"} · {result.final.length > 1 ? "tie" : "choice"}</p>
            <span className="mt-1.5 flex flex-wrap gap-1">
              {result.final.map((i) => (
                <AltChip key={i} name={names[i]} tone="win" />
              ))}
            </span>
          </div>
        </li>
      </ol>
    </figure>
  );
}
