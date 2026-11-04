# Samuel Guevara C10

Build a polished, fully functional, responsive individual decision-analysis web app in English titled "Decision Lab — Decisions Under Uncertainty", suitable for a Grade 10 economics/business student. This is an interactive single-page decision dashboard, not a static mockup. Use React + TypeScript, Tailwind and shadcn components. All calculations must be real, deterministic, derived from current state, and update immediately after every edit. Persist current user scenario in localStorage if practical, with a reset option.

CORE MODEL:
- Scenario title and short financial context editable.
- User can add, rename/edit, and delete decision alternatives and states of nature. Require at least 2 alternatives and 2 states to calculate; prevent deleting below minimum. Sensible default 3 alternatives x 3 states.
- Editable payoff matrix: rows alternatives, columns states, numeric payoffs (profit/loss, allow negative values). Inline editing, clear currency/unit label editable (default "$"), validation for blank/non-finite values. Do not silently treat invalid cells as zero.
- Probability per state, editable as percentages or decimals, validate each in [0,1], and require total = 100% (within small tolerance) for EMV/Bayes and probability sensitivity. Display total and validation status. Probabilities should be editable alongside states.
- Four criteria cards and detailed comparison table:
  1 Maximax: each alternative's row maximum; choose largest row maximum; ties all listed.
  2 Maximin: each alternative's row minimum; choose largest row minimum; ties all listed.
  3 Minimax Regret: for each state find best payoff, regret = state best payoff minus alternative payoff; each row's maximum regret; choose smallest maximum regret; ties all listed. Display opportunity-loss matrix.
  4 EMV/Bayes: sum payoff * state probability for each alternative; choose highest EMV; ties all listed. Only calculate when probabilities valid.
- Explain criteria briefly in student-friendly language and label optimistic, conservative, regret-averse, probability-weighted.
- Handle negative values correctly and ties accurately with numerical tolerance.

STAGED FILTERING:
- Include an interactive staged-filtering panel where users choose the order of criteria (default Maximin -> Minimax Regret -> EMV/Bayes; also offer Maximax), choose whether to use all four criteria, and choose a tie policy (retain all tied alternatives; never arbitrarily break ties).
- At each stage, calculate criterion scores only among the alternatives surviving previous stages, show candidates before, each score, best score, retained alternatives, and eliminated alternatives with clear reasons. For EMV require valid probabilities. If all alternatives tie at a stage, retain all and continue. Show final surviving alternative(s), or all if tie.
- Include a clear flow diagram (SVG or React Flow if appropriate, otherwise accessible responsive CSS/SVG) of the exact active staged process, showing start, each criterion stage, survivors/eliminations and final outcome. It must update when matrix, probabilities, alternatives, states or stage order changes. Make nodes readable on mobile; no dead-end decorative diagram.

PRELOADED EXAMPLES:
1) "Outdoor Gear Launch" with alternatives Small launch, Medium launch, Large launch; states Low demand, Medium demand, High demand; payoffs in thousands: Small [40, 40, 40], Medium [10, 60, 90], Large [-50, 50, 150]; probabilities [0.30,0.40,0.30]. This deliberately demonstrates differing optimistic/conservative choices, regret and EMV.
2) "Café Expansion" with alternatives Keep current café, Small expansion, Large expansion; states Weak demand, Steady demand, Strong demand; payoffs in thousands: Keep [35,35,35], Small [10,55,85], Large [-60,45,160]; probabilities [0.25,0.50,0.25]. Both examples must load fully into editable UI and demonstrate all four criteria, opportunity-loss table, staged filter and flow diagram. Add a selector and reset-to-example button. Ensure examples are mathematically correct and label currency as "$000s".

SENSITIVITY ANALYSIS:
- Include a section for subjective probability/sensitivity: allow user to adjust one state's probability while automatically redistributing the remaining probability proportionally across other states (if possible), or provide editable probability sliders with normalization control. Recompute EMV and show which alternative is preferred. Provide a simple sensitivity visualization/table across probability scenarios; explicitly explain probability assumptions can change the preferred alternative. Never show invalid probabilities as valid.

DECISION TREE:
- Include an educational, usable decision-tree illustration for one example, distinguishing square decision nodes and circular chance nodes, branch probabilities and payoff outcomes, and expected values with backward induction. Either allow adding/editing simple branches or provide a clearly labeled editable illustrative tree consistent with the loaded example; do not fake dynamically changing payoff calculations. Prefer calculate a valid tree for a small example if feasible.

C10 DECISION GUIDANCE:
- Include a concise decision guide explaining how to select the most appropriate criterion based on available information, risk attitude, and context. Mention Maximax needs no probabilities and suits optimism; Maximin needs no probabilities and suits caution; Minimax regret needs no probabilities and minimizes worst missed opportunity; EMV needs credible probabilities and compares long-run average expected payoffs. Emphasize EMV is not a guaranteed outcome and staged filtering is a decision aid, not a universal rule. Show context-aware recommendation based on whether probabilities are valid and whether user selects optimistic/conservative/balanced risk attitude; justify it transparently.

AI DEVELOPMENT RECORD:
- Include a visible, accessible footer link labeled "AI development conversation". Use a configurable constant for the href and add a comment indicating it must be replaced with the share URL for this ChatGPT conversation. Set initial href to https://chatgpt.com/ rather than inventing a conversation-specific URL; make it obvious in project source where to replace it. Do not fabricate a specific conversation link.

DESIGN / QUALITY:
- Modern editorial dashboard, professional but student-friendly, light warm neutral background, deep navy/teal accents, clear cards, generous spacing, strong typography, responsive mobile layout. Avoid clutter. English interface.
- Navigation tabs/anchors: Overview, Payoff table, Criteria, Staged filtering, Sensitivity, Decision tree, C10 guide.
- Use accessible labels, keyboard navigation, semantic HTML, contrast, responsive tables with horizontal scrolling on small screens, helpful tooltips/definitions, and clear empty/error states.
- Add a "Load example" selector, "Reset" action, and compact methodology notes.
- Thoroughly test logic mentally and through code structure. No fake controls, no static calculations disconnected from state, no external API requirement. Keep all analysis client-side.
- Deploy-ready app. Build and verify the working application before publication.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://samuel-guevara-c10.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dac2d83c-b416-4c40-bf19-6376639d4849).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
