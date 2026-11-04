import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
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
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <a href="#overview" className="group flex items-baseline gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="font-display text-xl font-semibold">Samuel Guevara-C10</span>
          <span className="hidden text-sm text-muted-foreground sm:inline">Decisions Under Uncertainty</span>
        </a>
        <div className="flex items-center gap-2">
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
            <SelectTrigger id="example-select" className="h-9 w-[190px] bg-card" aria-label="Load example">
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
            className="h-9 bg-card"
            onClick={() => {
              onReset();
              setStatus(`Reset to the original “${label}” example.`);
            }}
          >
            <RotateCcw aria-hidden /> Reset
          </Button>
        </div>
      </div>
      <nav aria-label="Sections" className="mx-auto max-w-6xl overflow-x-auto px-2 md:px-4">
        <ul className="flex min-w-max gap-1 pb-2">
          {NAV.map((n) => (
            <li key={n.id}>
              <a
                href={`#${n.id}`}
                aria-current={active === n.id ? "true" : undefined}
                className={cn(
                  "inline-flex rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active === n.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
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
