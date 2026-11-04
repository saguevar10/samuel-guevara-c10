import { ExternalLink } from "lucide-react";
import { AI_DEVELOPMENT_CONVERSATION_URL } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <p className="font-display text-base font-semibold text-foreground">Samuel Guevara-C10</p>
          <p className="mt-1 max-w-xl">
            A learning tool for decisions under uncertainty. All calculations run in your browser. Results are decision
            aids — not guarantees of what will happen.
          </p>
        </div>
        <a
          href={AI_DEVELOPMENT_CONVERSATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 self-start rounded-md font-medium text-primary underline underline-offset-4 hover:text-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:self-auto"
        >
          AI development conversation
          <ExternalLink className="size-3.5" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </footer>
  );
}
