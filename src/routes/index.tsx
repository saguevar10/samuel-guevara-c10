import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useScenario } from "@/hooks/use-scenario";
import { analyzeScenario } from "@/lib/decision";
import { SiteHeader } from "@/components/decision/SiteHeader";
import { OverviewSection } from "@/components/decision/OverviewSection";
import { PayoffSection } from "@/components/decision/PayoffSection";
import { CriteriaSection } from "@/components/decision/CriteriaSection";
import { StagedSection } from "@/components/decision/StagedSection";
import { SensitivitySection } from "@/components/decision/SensitivitySection";
import { DecisionTreeSection } from "@/components/decision/DecisionTreeSection";
import { GuideSection } from "@/components/decision/GuideSection";
import { SiteFooter } from "@/components/decision/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Santiago tapias-c10 — Decisions Under Uncertainty" },
      {
        name: "description",
        content:
           "Santiago tapias-c10: interactive payoff tables, Maximax, Maximin, Minimax Regret and EMV, sensitivity analysis and decision trees for students.",
      },
      { property: "og:title", content: "Santiago tapias-c10 — Decisions Under Uncertainty" },
      {
        property: "og:description",
        content: "Santiago tapias-c10: compare decision criteria, filter alternatives in stages and test probability assumptions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { scenario, staged, exampleId, actions } = useScenario();
  const analysis = useMemo(() => analyzeScenario(scenario), [scenario]);

  return (
    <TooltipProvider delayDuration={150}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <SiteHeader exampleId={exampleId} onLoadExample={actions.loadExample} onReset={() => actions.loadExample(exampleId)} />
      <main id="main" className="mx-auto max-w-7xl space-y-10 px-4 md:px-8">
        <OverviewSection scenario={scenario} analysis={analysis} actions={actions} />
        <PayoffSection scenario={scenario} analysis={analysis} actions={actions} />
        <CriteriaSection scenario={scenario} analysis={analysis} />
        <StagedSection scenario={scenario} analysis={analysis} config={staged} setConfig={actions.setStaged} />
        <SensitivitySection scenario={scenario} analysis={analysis} actions={actions} />
        <DecisionTreeSection scenario={scenario} analysis={analysis} />
        <GuideSection scenario={scenario} analysis={analysis} />
      </main>
      <SiteFooter />
    </TooltipProvider>
  );
}
