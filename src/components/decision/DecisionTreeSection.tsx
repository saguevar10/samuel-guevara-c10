import { emvScores, formatNumber, formatPercent, formatValue, listNames, selectBest, type Analysis, type Scenario } from "@/lib/decision";
import { Notice, Panel, Section } from "./shared";

const LEAF_H = 44;
const GAP = 18;
const PAD = 36;
const DX = 24;
const CX = 340;
const LX = 600;
const W = 820;

function trunc(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export function DecisionTreeSection({ scenario, analysis }: { scenario: Scenario; analysis: Analysis }) {
  const m = analysis.matrix;
  const probs = analysis.validProbs;
  const unit = scenario.unit;

  return (
    <Section
      id="tree"
      eyebrow="Step 5"
      title="Decision tree"
      description={
        <>
          The same scenario drawn as a tree, built live from your payoff table (edit values there and the tree
          recalculates). Solve it from right to left — <strong className="text-foreground">backward induction</strong>:
          work out each chance node's expected value, then choose the best branch at the decision node.
        </>
      }
    >
      {!m ? (
        <Notice tone="error" title="Tree unavailable">{analysis.blockers.join(" ")}</Notice>
      ) : (
        <Tree m={m} probs={probs} analysis={analysis} unit={unit} />
      )}
    </Section>
  );
}

function Tree({ m, probs, analysis, unit }: { m: number[][]; probs: number[] | null; analysis: Analysis; unit: string }) {
  const A = m.length;
  const S = m[0].length;
  const H = PAD * 2 + A * S * LEAF_H + (A - 1) * GAP;
  const leafY = (i: number, j: number) => PAD + i * (S * LEAF_H + GAP) + j * LEAF_H + LEAF_H / 2;
  const chanceY = (i: number) => (leafY(i, 0) + leafY(i, S - 1)) / 2;
  const dY = (chanceY(0) + chanceY(A - 1)) / 2;
  const evs = probs ? emvScores(m, probs) : null;
  const best = evs ? selectBest(evs, "max") : null;

  return (
    <div className="space-y-6">
      <Panel className="p-0 md:p-0">
        <div className="flex flex-wrap gap-4 border-b p-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><svg width="14" height="14" aria-hidden><rect x="1" y="1" width="12" height="12" className="fill-primary" /></svg> Decision node (you choose)</span>
          <span className="flex items-center gap-1.5"><svg width="14" height="14" aria-hidden><circle cx="7" cy="7" r="6" className="fill-violet" /></svg> Chance node (nature decides)</span>
          <span className="flex items-center gap-1.5"><svg width="14" height="14" aria-hidden><path d="M1 7 L13 1 L13 13 Z" className="fill-foreground/60" /></svg> Payoff outcome</span>
          <span className="flex items-center gap-1.5"><svg width="18" height="14" aria-hidden><line x1="5" y1="12" x2="9" y2="2" className="stroke-foreground" strokeWidth="1.5" /><line x1="10" y1="12" x2="14" y2="2" className="stroke-foreground" strokeWidth="1.5" /></svg> Pruned (not chosen)</span>
        </div>
        <div className="overflow-x-auto p-2">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="min-w-[720px] w-full"
            role="img"
            aria-labelledby="tree-title tree-desc"
          >
            <title id="tree-title">{`Decision tree for ${analysis.altNames.length} alternatives`}</title>
            <desc id="tree-desc">
              {evs
                ? analysis.altNames.map((n, i) => `${n}: expected value ${formatValue(evs[i], unit)}`).join(". ") +
                  `. Best: ${listNames(best!.winners, analysis.altNames)}.`
                : "Expected values are not shown because the probabilities are invalid."}
            </desc>
            {m.map((row, i) => {
              const cy = chanceY(i);
              const chosen = best?.winners.includes(i) ?? false;
              const pruned = best && !chosen;
              const stroke = chosen ? "stroke-primary" : "stroke-foreground/35";
              return (
                <g key={i}>
                  <path d={`M ${DX + 13} ${dY} L 130 ${cy} L ${CX - 14} ${cy}`} fill="none" className={stroke} strokeWidth={chosen ? 3 : 1.5} />
                  {pruned && (
                    <g className="stroke-foreground" strokeWidth="1.5">
                      <line x1={CX - 52} y1={cy + 7} x2={CX - 46} y2={cy - 7} />
                      <line x1={CX - 45} y1={cy + 7} x2={CX - 39} y2={cy - 7} />
                    </g>
                  )}
                  <text x={138} y={cy - 8} className="fill-foreground text-[13px] font-semibold">{trunc(analysis.altNames[i], 22)}</text>
                  <circle cx={CX} cy={cy} r={13} className={chosen ? "fill-violet" : "fill-violet/60"} />
                  {evs && (
                    <text x={CX - 18} y={cy + 20} textAnchor="end" className="fill-foreground text-[12px] font-semibold num">
                      EV {formatValue(evs[i], unit)}
                    </text>
                  )}
                  {row.map((v, j) => {
                    const ly = leafY(i, j);
                    return (
                      <g key={j}>
                        <path d={`M ${CX + 13} ${cy} L ${CX + 50} ${ly} L ${LX - 10} ${ly}`} fill="none" className="stroke-foreground/35" strokeWidth={1.25} />
                        <text x={CX + 58} y={ly - 6} className="fill-muted-foreground text-[11.5px]">
                          {trunc(analysis.stateNames[j], 18)}
                          {probs && <tspan className="num fill-foreground font-semibold"> · p = {formatNumber(probs[j], 4)}</tspan>}
                        </text>
                        <path d={`M ${LX - 10} ${ly} L ${LX + 4} ${ly - 7} L ${LX + 4} ${ly + 7} Z`} className="fill-foreground/60" />
                        <text x={LX + 12} y={ly + 4} className={`num text-[13px] font-semibold ${v < 0 ? "fill-destructive" : "fill-foreground"}`}>
                          {formatValue(v, unit)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
            <rect x={DX - 13} y={dY - 13} width={26} height={26} className="fill-primary" />
            {best && (
              <text x={DX - 13} y={dY + 32} className="fill-primary text-[12px] font-semibold num">
                Best EV {formatValue(best.best, unit)}
              </text>
            )}
          </svg>
        </div>
      </Panel>

      {evs && best ? (
        <Panel>
          <h3 className="font-display text-xl font-semibold">Backward induction, step by step</h3>
          <ol className="mt-3 space-y-3 text-sm">
            <li>
              <p className="font-semibold">1. Expected value at each chance node</p>
              <ul className="mt-1 space-y-1">
                {m.map((row, i) => (
                  <li key={i} className="num break-words text-[13px]">
                    <span className="font-sans font-medium">{analysis.altNames[i]}:</span>{" "}
                    {row.map((v, j) => `${formatNumber(probs![j], 4)} × ${formatNumber(v)}`).join(" + ")} ={" "}
                    <strong>{formatValue(evs[i], unit)}</strong>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <p className="font-semibold">2. Choose at the decision node</p>
              <p className="mt-1">
                The highest expected value is <strong className="num">{formatValue(best.best, unit)}</strong>, so choose{" "}
                <strong>{listNames(best.winners, analysis.altNames)}</strong>
                {best.winners.length > 1 ? " (tied)" : ""}. Other branches are pruned. This matches the EMV criterion.
              </p>
            </li>
          </ol>
        </Panel>
      ) : (
        <Notice tone="error" title="Expected values not calculated">
          {analysis.probMessage} The tree shows the structure only until the probabilities are valid
          {analysis.probTotal !== null ? ` (current total ${formatPercent(analysis.probTotal)})` : ""}.
        </Notice>
      )}
    </div>
  );
}
