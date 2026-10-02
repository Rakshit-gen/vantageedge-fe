# VantageEdge console design notes

The gateway is drawn as a telephone switchboard: paths on the left, origins on the
right, a line per route. That diagram is the one visual idea; everything else stays
out of its way. Tokens live in `app/globals.css` and `tailwind.config.js`.

## Color

| Token | Job |
|---|---|
| `background`, `card` | Warm near-black ground and surfaces. |
| `foreground` | Paper-colored text. |
| `muted-foreground` | Secondary text, 5.2:1 on cards. |
| `patch` | The live connection and the main action on a screen. Text on it is dark ink (4.9:1). |
| `lamp` | Healthy origin, active route. |
| `warning`, `destructive` | Degraded and failing states. |

## Type

- Display: Bricolage Grotesque, for headings.
- Body: Spline Sans.
- Mono: Spline Sans Mono, only for paths, IDs, numbers and code.
- Sentence case for every label, table header, tab and button. No tracked all-caps.

## Surfaces and motion

- Flat panels with one hairline border, 4px radius. No blur, no glow.
- Motion only where it shows something: the request simulator, lines on the board
  when hovered, the hero background. No fade-in on load or scroll.
- Everything respects `prefers-reduced-motion`.

## Words

- Plain verbs for actions: add a route, delete a route. The switchboard idea stays in
  the visuals, not in button labels.
- Numbers on the site come from the API or are clearly marked as examples.
- No em dashes, no arrows glued to link text.
- Errors say what failed and what happens next.
