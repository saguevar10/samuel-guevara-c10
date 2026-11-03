<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- All decision math lives in `src/lib/decision.ts` as pure functions with tests in `src/lib/decision.test.ts`; components only render derived results — keeps every number traceable and testable.
- Scenario state is one reducer in `src/hooks/use-scenario.ts`, persisted to localStorage after hydration — avoids SSR hydration mismatches.
- Payoff and probability inputs are stored as raw strings and parsed on read — invalid entries stay visible and are never silently treated as zero.
- `noUncheckedIndexedAccess` is disabled in tsconfig — matrix code indexes by bounds-derived indices throughout.
- The footer "AI development conversation" href is the single constant in `src/lib/config.ts` — replace it there with the real share URL.
