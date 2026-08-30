# Design — 爱窝啦·货源雷达

A locked design system for the supply marketplace. Public pages must feel like a
decision tool for buyers and sellers, not a generic SaaS landing page. Extend
this file when the system grows; do not invent a separate visual theme per page.

## Genre

Modern-minimal, technical and utilitarian. Chinese data density is deliberate.

## Macrostructure family

- Marketing entry: Workbench overview with live dataset facts and direct task entry points.
- App pages: Workbench with compact page head, persistent filters and tabular spec sheets.
- Content pages: Long Document, 60–68ch measure, evidence links in blue.

Chrome uses N1b dense three-section navigation (utility rail + grouped routes +
single submission CTA) and an Ft2-style compact inline footer.

## Theme

- `--color-paper`: engineered warm white.
- `--color-paper-2`: cool gray work surface.
- `--color-ink`: near-black data ink.
- `--color-ink-2`: muted slate copy.
- `--color-rule`: visible neutral divider.
- `--color-accent`: Aivora signal yellow; no more than 5% of a viewport.
- `--color-link`: evidence blue.
- `--color-focus`: amber focus ring.

Exact light and dark OKLCH values live in `v2-web/src/app/tokens.css`.

## Typography

- Display: system Chinese sans, weight 700, normal.
- Body: system Chinese sans, weight 400–500.
- Mono: SFMono-Regular / Consolas, weight 500, for prices, dates and counts.
- Display tracking: `-0.025em`.
- Type scale anchor: `--text-display = clamp(2rem, 4vw, 3.6rem)`.

No remote font request is required. Numeric columns use tabular figures.

## Spacing

4-point named scale in `tokens.css`. New system components use named tokens;
legacy pages migrate gradually without breaking imported authorized templates.

## Motion

- Ease: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`.
- No page reveal choreography; data is present immediately.
- Hover is color/border only. No card lift.
- Reduced motion disables nonessential transitions.

## Microinteractions stance

- Success and error states are inline and announced with `aria-live`.
- Focus is immediate and visibly amber.
- Destructive or outbound actions keep explicit labels.

## CTA voice

- Primary: ink fill, 6px radius, verb + object (for example “查看全网货源”).
- Secondary: paper background, visible rule, same geometry.
- Evidence links: blue, underlined on hover; never disguised as buttons.

## Per-page allowances

- Homepage may use one compact signal-yellow status rail.
- App pages use no decorative illustration; current data carries the page.
- Content pages use typography, rules and evidence links only.

## What pages MUST share

- Text wordmark “爱窝啦·货源雷达”.
- Signal yellow and evidence blue roles.
- System sans + mono numeric pairing.
- 6px control radius, 10px panel radius, visible 1px rules.
- Functional kicker → heading → plain-language decision guidance rhythm.

## What pages MAY differ on

- Table, list or memo layout based on the task.
- Filter density and sticky behavior.
- Seller tools may use emerald/red only to express positive/negative outcomes.

## Hallmark stamp

Public UI CSS is stamped:

`/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */`

## Exports

### tokens.css

The canonical runtime file is `v2-web/src/app/tokens.css`; a portable copy is
kept at the repository root as `tokens.css`.

### Tailwind v4 `@theme`

```css
@theme {
  --color-paper: oklch(0.995 0.004 95);
  --color-ink: oklch(0.19 0.012 255);
  --color-accent: oklch(0.86 0.18 91);
  --color-link: oklch(0.51 0.2 257);
  --font-display: var(--font-space-grotesk), sans-serif;
  --font-body: var(--font-noto-sans-sc), sans-serif;
  --spacing-md: 1.5rem;
  --radius-card: 10px;
}
```

### DTCG tokens.json

```json
{
  "color": {
    "paper": { "$value": "oklch(0.995 0.004 95)", "$type": "color" },
    "ink": { "$value": "oklch(0.19 0.012 255)", "$type": "color" },
    "accent": { "$value": "oklch(0.86 0.18 91)", "$type": "color" },
    "link": { "$value": "oklch(0.51 0.2 257)", "$type": "color" }
  },
  "space": { "md": { "$value": "1.5rem", "$type": "dimension" } },
  "radius": { "card": { "$value": "10px", "$type": "dimension" } }
}
```

### shadcn/ui CSS variables

```css
:root {
  --background: 0.995 0.004 95;
  --foreground: 0.19 0.012 255;
  --primary: 0.19 0.012 255;
  --primary-foreground: 0.995 0.004 95;
  --muted: 0.965 0.006 255;
  --muted-foreground: 0.47 0.018 255;
  --border: 0.87 0.012 255;
  --ring: 0.74 0.18 78;
  --radius: 6px;
}
```
