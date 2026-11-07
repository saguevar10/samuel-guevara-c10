import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CriterionId } from "@/lib/decision";

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-t py-10 first:border-t-0 md:py-12">
      <header className="mb-7 max-w-3xl">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase text-violet"><span className="h-px w-6 bg-violet" aria-hidden />{eyebrow}</p>
        <h2 id={`${id}-title`} className="font-display mt-2 text-2xl font-semibold md:text-3xl">
          {title}
        </h2>
        {description && <div className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</div>}
      </header>
      {children}
    </section>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("min-w-0 rounded-lg border bg-card p-5 shadow-card md:p-6", className)}>{children}</div>;
}

export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="size-3.5" aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm leading-snug">{children}</TooltipContent>
    </Tooltip>
  );
}

export const CRIT_STYLES: Record<CriterionId, { text: string; bg: string; border: string; dot: string }> = {
  maximax: {
    text: "text-crit-maximax",
    bg: "bg-crit-maximax/10",
    border: "border-crit-maximax/40",
    dot: "bg-crit-maximax",
  },
  maximin: {
    text: "text-crit-maximin",
    bg: "bg-crit-maximin/10",
    border: "border-crit-maximin/40",
    dot: "bg-crit-maximin",
  },
  regret: {
    text: "text-crit-regret",
    bg: "bg-crit-regret/10",
    border: "border-crit-regret/40",
    dot: "bg-crit-regret",
  },
  emv: { text: "text-crit-emv", bg: "bg-crit-emv/10", border: "border-crit-emv/40", dot: "bg-crit-emv" },
};

export function Notice({
  tone = "warning",
  title,
  children,
}: {
  tone?: "warning" | "error" | "info";
  title: string;
  children?: ReactNode;
}) {
  const styles = {
    warning: "border-warning/60 bg-warning/15",
    error: "border-destructive/40 bg-destructive/5",
    info: "border-violet/30 bg-accent/60",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-xl border p-4 text-sm", styles)}>
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 leading-relaxed text-foreground/80">{children}</div>}
    </div>
  );
}

export function AltChip({ name, tone = "neutral" }: { name: string; tone?: "neutral" | "kept" | "out" | "win" }) {
  const styles = {
    neutral: "border-border bg-secondary text-secondary-foreground",
    kept: "border-violet/40 bg-accent text-accent-foreground",
    out: "border-destructive/30 bg-destructive/5 text-destructive line-through decoration-1",
    win: "border-primary bg-primary text-primary-foreground",
  }[tone];
  return (
    <span className={cn("inline-flex max-w-full items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", styles)}>
      <span className="truncate">{name}</span>
    </span>
  );
}
