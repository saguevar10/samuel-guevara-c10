import { useEffect, useState } from "react";
import { ChartNoAxesCombined, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXAMPLE_OPTIONS, type ExampleId } from "@/lib/examples";
import { cn } from "@/lib/utils";

export const NAV = [
  { id: "overview", label: "Overview" },
  { id: "payoff", label: "Payoff table" },
  { id: "criteria", label: "Criteria" },
  { id: "staged", label: "Staged filtering" },
  { id: "sensitivity", label: "Sensitivity" },
  { id: "tree", label: "Decision tree" },
  { id: "guide", label: "C10 guide" },
] as const;

export function SiteHeader({
  exampleId,
  onLoadExample,
  onReset,
}: {
  exampleId: ExampleId;
  onLoadExample: (id: ExampleId) => void;
  onReset: () => void;
}) {
  const [active, setActive] = useState<string>("overview");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter((e): e is HTMLElement => !!e);
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, []);

  const label = EXAMPLE_OPTIONS.find((o) => o.id === exampleId)?.label ?? "";

  return (
    <header className="sticky top-0 z-40 border-b bg-card shadow-card">
      <div className="bg-structure text-structure-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
        <a href="#overview" className="group flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg border border-cyan/40 bg-cyan/10 text-cyan">
            <ChartNoAxesCombined className="size-6" />
          </span>
          <span>
            <span className="font-display block text-lg font-semibold md:text-xl">Santiago tapias-c10</span>
            <span className="block text-xs text-structure-muted">Decisions Under Uncertainty</span>
          </span>
        </a>
        <div className="flex items-center gap-2 text-foreground">
          <Label htmlFor="example-select" className="sr-only">
            Load example
          </Label>
          <Select
            value={exampleId}
            onValueChange={(v) => {
              const id = v as ExampleId;
              onLoadExample(id);
              setStatus(`Loaded example: ${EXAMPLE_OPTIONS.find((o) => o.id === id)?.label}`);
            }}
          >
            <SelectTrigger id="example-select" className="h-10 w-[190px] bg-card" aria-label="Load example">
              <SelectValue placeholder="Load example" />
            </SelectTrigger>
            <SelectContent>
              {EXAMPLE_OPTIONS.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-10 bg-card"
            onClick={() => {
              onReset();
              setStatus(`Reset to the original “${label}” example.`);
            }}
          >
            <RotateCcw aria-hidden /> Reset
          </Button>
        </div>
      </div>
      </div>
      <nav aria-label="Sections" className="mx-auto max-w-7xl overflow-x-auto px-2 md:px-6">
        <ul className="flex min-w-max gap-2">
          {NAV.map((n) => (
            <li key={n.id}>
              <a
                href={`#${n.id}`}
                aria-current={active === n.id ? "true" : undefined}
                className={cn(
                  "inline-flex border-b-2 px-3 py-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active === n.id ? "border-primary bg-primary/5 text-primary" : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
    </header>
  );
}
