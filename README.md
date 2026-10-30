# Org Explorer

An interactive org chart and cost-analysis tool for Giga Corp's 40,000 employees, built with Vue 3 and Tailwind CSS. Everything runs in the browser: no backend, no environment variables.

**Live (runs with the code beside it):** https://stackblitz.com/github/ShauryaLuthra/org-explorer
**Source:** https://github.com/ShauryaLuthra/org-explorer

## Run it locally

```bash
npm install
npm run dev     # app at http://localhost:5173 (Node 18+)
npm test        # 27 tests (Vitest 4 needs Node 20+)
npm run build   # production build in dist/
```

## Requirements coverage

| The brief asked for | Where it is |
|---|---|
| Vue.js and Tailwind, responsive layout | Vue 3 + Tailwind v4. A pan/zoom card chart on desktop and tablet, an indented list below 768 px. |
| The hierarchy of reporting lines | A recursive `OrgNode` component draws the tree from the CEO down, with connector lines. |
| Nodes can be expanded and collapsed | The chevron on each card (also keyboard: Enter/Space), plus Collapse all. |
| Each node's number of descendants and non-leaf descendants | The card footer: "4 / 39,999" (direct / all descendants) and "11,452 managers" (non-leaf descendants). |
| Management cost, IC cost, total cost and management cost ratio, from salary | Rows on every manager card and in the detail drawer. Definitions are in [Assumptions](#assumptions-where-the-brief-left-room). |
| Efficient calculation, "optimal per path" | Every figure for all 40,000 people is computed once in O(n), and a salary change updates only its path, in O(depth). See [How the numbers are computed](#how-the-numbers-are-computed). |
| Clean UI, "show your taste" | Department-tinted cards, money as $1.24M, findings written as chart titles, a load-time footer and a data-quality badge. |
| Bonus: a view to analyse organisational cost | The **Cost analysis** tab, designed around the questions a workforce-planning leader asks. |
| A hosted link that runs with the code beside it | StackBlitz (link at the top). |

## What it does

**Org chart**
- Every card shows direct reports / total descendants, non-leaf descendants ("managers"), management cost, IC cost, total cost and management cost ratio. Hover the ⓘ to see the formula.
- Cards expand and collapse. You can drag to pan and scroll to zoom, and use Fit, Reset and Collapse all.
- Search by name or title. Choosing a result opens the path from the CEO, pans to the card and highlights it.
- Click a card to open a drawer with full details, the clickable reporting chain to the CEO, and the person's direct reports.
- Teams wider than 12 show a "Show 24 more" card, so a manager with hundreds of reports never renders hundreds of cards at once.
- Below 768 px the canvas becomes an indented list with the same data, so it works on a phone.

**Cost analysis (bonus)**
- Every chart's title states its finding as a sentence with a number, and a department filter applies to all of them.
- **KPI cards:** headcount, total salary cost, managers, management cost share, average span of control and layers.
- **Cost by department:** management versus IC cost.
- **Layers pyramid:** headcount and cost at each level below the CEO.
- **Span of control:** a distribution, plus a table of managers with only 1–2 reports, each with a "View in org chart" link.
- **Cost treemap:** click a team to drill in and use the breadcrumb to go back.

**Data handling**
- **Upload CSV** loads any file with the same columns.
- A data-quality badge reports anything the loader had to fix.

## Architecture

```
src/
  data/               Pure JavaScript, no Vue or DOM: CSV parsing, tree building, aggregation, formatting
  composables/        useOrg.js, the single shared state: loads data, holds UI state, exposes actions
  components/         Cards, canvas, phone list, drawer, search, header
  components/charts/  Hand-built SVG charts (d3-scale for the maths, Vue for the rendering)
  views/              The two tabs
tests/                Vitest unit tests for the data layer, where the logic lives
```

**Data flow:** CSV text → `parseCsv` → `buildTree` → `aggregate` → `useOrg` (a non-reactive tree plus small reactive UI state) → components.

- **Separation of concerns:** all business logic sits in `src/data` as plain functions. It is unit-tested directly in Node and could run unchanged on a server. Components only read the computed numbers and render them.
- **No Pinia or vue-router:** one composable is enough state management for two views, and the active tab lives in the URL hash.

## Error handling

| What goes wrong | What happens |
|---|---|
| Bad rows (duplicate ID, unknown manager, several roots, reporting loop, blank or negative salary) | The row is kept and fixed, and the data-quality badge lists every fix. Nothing crashes. |
| An uploaded file with the wrong columns | The error names exactly which columns are missing. The current data stays on screen with a dismissible banner. |
| The bundled file can't be fetched | A readable error page with the HTTP status. |
| A division by zero (no ICs below someone) | The ratio is null and shows "–", never Infinity or NaN. |
| Money at a unit boundary | It rolls over cleanly: $999,999 shows as $1M, not $1000K. |

## Data

This uses the official Giga Corp file supplied with the assessment: 40,000 rows and 22 columns. It ships gzipped as `public/data/giga-corp.csv.gz` (12 MB → 2.6 MB), because StackBlitz's GitHub import stalls on the full-size file. The browser unzips it on load with the built-in `DecompressionStream`, and `gunzip -k public/data/giga-corp.csv.gz` restores the original byte-for-byte.

- **Columns used:** the app reads 8 of them (`Employee Id`, `Name`, `Job Title`, `Department`, `Location`, `level`, `Manager`, `Salary`).
- **One mapping file:** all header names live in `src/data/columns.js`, so a different header is a one-file change.
- **Data quality:** the file came through clean. It has one CEO, no duplicate IDs, no unknown managers and no reporting loops, so the badge reads "Data OK".
- **Salaries** are decimals and are kept exactly as given. Money is rounded only for display.
- **The CEO's salary of $20M** is far above everyone else's. It doesn't affect the CEO's own card, because totals exclude a person's own salary. It does appear in company-wide totals, such as Customer Support and Success, the CEO's department, topping the cost-by-department chart.

## Assumptions (where the brief left room)

| Question | Decision | Why |
|---|---|---|
| Is a person their own descendant? | No | "Descendants" means the people below someone. The CEO shows 4 / 39,999. |
| Does total cost include the person's own salary? | No; own salary is shown separately in the drawer | The brief says total cost is "the salary of every descendant". |
| What is "management cost ratio"? | Management cost ÷ IC cost. Headcount ratio (managers : ICs below) is shown too. | The brief calls it a *cost* ratio but describes it as "the ratio between individual contributors and managers", so I show both readings. The formula is in the ⓘ tooltip. |
| Ratio when IC cost is 0 | Shown as "–" | Avoids "Infinity" or "NaN". |
| What does a leaf card show? | "Individual contributor" and their own salary | All four cost figures are 0 for someone with no reports, which is noise. |
| Bad data | Keep every row and report the fix | Duplicate ID: keep the first. Unknown manager: move under "Unassigned". Several roots: group them under a "Giga Corp" root. Reporting loop: break it. Blank salary: use 0. |
| Treemap size | A team's cost *including* its leader's salary | A rectangle is everything that leader is responsible for. That's why it reads slightly higher than the card's total cost. |

## How the numbers are computed

For person *v* with direct reports *C(v)* and salary *s(v)* (a leaf has no reports):

- `desc(v)` = Σ over c in C(v) of (1 + desc(c))
- `nonLeafDesc(v)` = Σ ([c is a manager] + nonLeafDesc(c))
- `mgmtCost(v)` = Σ ([c is a manager] · s(c) + mgmtCost(c)), and `icCost` is the same for leaves
- `totalCost` = mgmtCost + icCost, and `ratio` = mgmtCost / icCost

Each sum reuses the children's already-computed values, so every value is computed exactly once and reused by everyone above it. That is the "optimal value calculation per path".

| Step | How | Cost |
|---|---|---|
| Build the tree (`buildTree.js`) | Pass 1 puts every row in a `Map` by ID; pass 2 links each person to their manager with one lookup. | O(n) |
| Compute every figure (`aggregate.js`) | A breadth-first walk records an order where parents come before children, then a reverse sweep adds each person into their manager. No recursion, so 10+ levels can't overflow the call stack. | O(n) time and memory |
| Sort teams (biggest first) | Each children list is sorted once. | O(n log w), w = widest team |
| Change one salary (`updateSalary`) | Walks up to the CEO, adding the difference to each ancestor only. Tested to equal a full recompute. | O(depth) |
| Reveal a search result | Follows parent pointers to the root. | O(depth) |

The 40,000-node tree is stored with `shallowRef`/`markRaw`, so Vue does not track every object. Only small UI state is reactive (the expanded set, search text, selection, tab and filter), and only expanded cards are rendered.

**Tests (Vitest, 27 passing, in 4 files):**
- **Calculations:** the worked example A/B/C/D/E, checked by hand.
- **Real-file invariants:** root descendants = n − 1, root total = sum of salaries − root salary, and total = management + IC with non-leaf ≤ descendants for every node.
- **`updateSalary`:** equals a full recompute.
- **Bad data:** missing manager, several roots, reporting loops including self-loops, blank, junk and negative salaries, duplicate IDs, and an empty file.
- **Edge cases:** a lone person, zero IC cost (null ratio), and placeholders not counted as people.
- **Parsing:** CRLF line endings, quoted commas, extra columns, leading-zero IDs, blank lines, and a clear error for a wrong header.
- **Formatting:** units, the $1000K rounding boundary, negatives and missing values.

## Performance (measured)

- **In the browser:** "Loaded 40,000 people in 0.23 s" in Chrome on a MacBook. The footer shows the time on every load, and the console logs the breakdown.
- **Same pipeline in Node:** parse 206 ms, build tree 63 ms, compute all figures 64 ms.
- **Bundle:** 194 kB of JavaScript (70 kB gzipped).

## What I'd do next

**With more time:**
- **A what-if editor:** change a salary or move a person and watch every total update. `updateSalary` already does the O(depth) maths; it needs a UI.
- **End-to-end tests (Playwright)** for search, expand, drill-down and upload. Today's tests cover the data layer only.
- **A Web Worker for parsing,** so a much larger upload never blocks the page.

**At Dayforce scale:**
- **Incremental updates:** what-if edits (move a person, change a salary) update only the ancestors on that path in O(depth), using `updateSalary`.
- **Server-side aggregation:** past a few hundred thousand people, parsing in the browser becomes the bottleneck. Compute roll-ups in Postgres with a recursive CTE (`WITH RECURSIVE`), or keep a stored aggregate table, and send only the visible slice.
- **Caching:** keep computed results in memory per session, in IndexedDB across reloads and in a server cache. When a salary changes, only that path goes stale.
- **Very wide levels:** virtualise them (render only the cards on screen) instead of paging.
- **Salary privacy:** mask salaries by role and audit-log who viewed them.

## How I used AI

I built this with Claude Code as a pair programmer, which is how I'd expect to work on the team: AI for speed, me for direction and verification.

- **Spec first.** I fixed the formulas, the bad-data rules and the cost-ratio interpretation before any code was written, so the code was built to a spec I had signed off.
- **Small, gated steps.** The work went in three phases (data → org chart → cost view). Code came in small pieces that I reviewed and could explain, and each phase ended with passing tests and a commit.
- **Judgement calls.** I declined `npm audit fix --force` because it would have broken the Node 18 requirement, and upgraded Vitest by one major version instead. I also chose to keep and report bad rows rather than silently drop them.
- **Verified, not trusted.** A hand-worked five-person example and invariants on the full 40,000-row file are both tests. Comparing two charts caught a $280K mismatch, a VP's own salary missing from one, which was then fixed.

## Tech

- Vue 3 (`<script setup>`), plain JavaScript with JSDoc, Vite 6, Tailwind CSS v4.
- Runtime dependencies: `papaparse`, `d3-hierarchy`, `d3-scale`, `d3-zoom`, `d3-selection`. All charts are hand-built SVG, with no chart library.
- **Version choices:** Vite 6 and `@vitejs/plugin-vue` 5 are pinned so the app runs on Node 18+.
- **Vitest 4:** `npm audit` flagged vulnerabilities in Vitest 3, so I upgraded to Vitest 4 rather than force-upgrading everything. Vitest 4 needs Node 20, but only for running tests.
