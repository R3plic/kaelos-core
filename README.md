# KaelosUI

Six animated tab bars built on one headless TypeScript core. Measured geometry,
real spring physics, CSS-variable theming. No animation library.

`kaelos-core` is the package; **KaelosUI** is the product name.

---

## Set up with an AI agent

This repo ships [`llms.txt`](./llms.txt) — a file written for LLMs and coding
agents that documents every component, prop, CSS variable, framework gotcha and
verification step. Paste the prompt below into Claude Code, Cursor, Codex,
Copilot or any agent with file access:

```text
Set up KaelosUI (kaelos-core) in this project.

1. Read llms.txt at the root of the KaelosUI repository:
   https://github.com/R3plic/kaelos-core/blob/main/llms.txt
   If you can run commands, fetch it first:
   curl -sL https://raw.githubusercontent.com/R3plic/kaelos-core/main/llms.txt
2. Follow it exactly: install the package, import the stylesheet exactly once,
   then replace the existing tab bar (or add a new one) with the variant that
   fits the design best.
3. Match our current design tokens — theme the bar with the documented CSS
   variables via tabVars() instead of editing the library's CSS.
4. Show me the diff, and confirm the checks in the "Verify your integration"
   section before you call it done.

Constraints: React >= 18. Do not invent component names, props or CSS
variables — only use what llms.txt documents. Do not copy or fork
src/styles/tabs.css into this project.
```

If your agent supports it, point it straight at the file instead of the prompt:
`@llms.txt set up KaelosUI in this project`.

---

## Manual setup

### 1. Install

The package is not published to npm — install it from GitHub or from a local
checkout:

```bash
npm install github:R3plic/kaelos-core   # from GitHub
npm install file:../kaelos-core         # from a sibling checkout
npm install file:./src/components/kaelos-core   # from a git submodule
```

Peer dependencies: `react` and `react-dom` (`>= 18`). Nothing else — no
animation library, no CSS-in-JS runtime.

It ships TypeScript source and has no build step, so your bundler compiles it.
Vite, esbuild, Bun, Rspack and Next.js (with `transpilePackages`) handle that
out of the box; a webpack config that excludes `node_modules` from `ts-loader`
or `babel-loader` needs to include this package.

### 2. Import the stylesheet once

```ts
import 'kaelos-core/styles.css'
```

That is required. The markup is unstyled without it. With Tailwind v4, import
it after Tailwind:

```css
@import 'tailwindcss';
@import 'kaelos-core/styles.css';
```

The stylesheet is plain CSS in `@layer components`, so your utility classes win
without specificity fights. Tailwind itself is not required — native cascade
layers are enough.

### 3. Render a bar

```tsx
import { WormUnderlineTabs, HomeIcon, SearchIcon, UserIcon, tabVars } from 'kaelos-core'

const items = [
  { id: 'home', label: 'Home', icon: <HomeIcon /> },
  { id: 'search', label: 'Search', icon: <SearchIcon /> },
  { id: 'profile', label: 'Profile', icon: <UserIcon /> },
]

export function Nav() {
  return (
    <WormUnderlineTabs
      items={items}
      defaultValue="search"
      ariaLabel="Main navigation"
      style={tabVars({ '--tb-accent': '#fb7185' })}
    />
  )
}
```

### Using it as a submodule with a path alias

To skip installation, mount the repo and alias **both** specifiers — a bare-match
alias will not resolve the stylesheet:

```ts
// vite.config.ts
const core = (p: string) =>
  fileURLToPath(new URL(`./src/components/kaelos-core/${p}`, import.meta.url))

resolve: {
  alias: [
    { find: '@kaelos/core/styles.css', replacement: core('src/styles/tabs.css') },
    { find: /^@kaelos\/core$/, replacement: core('src/index.ts') },
  ],
}
```

```json
// tsconfig.json
"paths": {
  "@kaelos/core": ["./src/components/kaelos-core/src/index.ts"],
  "@kaelos/core/styles.css": ["./src/components/kaelos-core/src/styles/tabs.css"]
}
```

---

## Contents

```
src/
├── index.ts              # public entry point
├── core/                 # headless, framework-agnostic TypeScript
│   ├── dom.ts            # id helpers, rAF loop, reduced-motion, CSS var IO
│   ├── layout.ts         # measureTabBar / observeTabBar
│   ├── spring.ts         # Spring integrator + simulateSpring
│   ├── tabs.ts           # createTabController (roving tabindex, WAI-ARIA)
│   ├── types.ts
│   └── motion/           # one engine per variant
│       ├── worm.ts  hop.ts  spotlight.ts  ripple.ts  jelly.ts  badge.ts
│       └── shared.ts
├── react/                # React 19 binding
│   ├── WormUnderlineTabs.tsx
│   ├── HoppingDotTabs.tsx
│   ├── SpotlightTabs.tsx
│   ├── RippleFillTabs.tsx
│   ├── JellyIconTabs.tsx
│   ├── BadgePopTabs.tsx
│   ├── TabPanel.tsx
│   ├── useTabBar.ts
│   ├── icons.tsx
│   ├── types.ts
│   └── cssVars.ts        # tabVars() helper for token overrides
├── lib/cx.ts
└── styles/tabs.css       # the .tb-* presentation layer
```

## Exports

| Component | Motion |
| --- | --- |
| `WormUnderlineTabs` | Underline stretches and contracts like a worm |
| `HoppingDotTabs` | Indicator hops in an arc with a comet trail |
| `SpotlightTabs` | Pivoting spotlight cone lights the new tab |
| `RippleFillTabs` | Ripple fills the tapped tab from its center |
| `JellyIconTabs` | Icon squashes and wobbles with decaying elasticity |
| `BadgePopTabs` | Badge pops to a dot and springs back on leave |

Also exported: `TabPanel`, `useTabBar`, `tabVars`, all nine icons, the full
headless core (`createTabController`, `Spring`, `measureTabBar`, motion
engines), and the prop/item types.

## Theming

Every colour, radius, size and spring constant is a CSS custom property. Override
them via `style={tabVars({ ... })}`, a wrapper class, or `:root`. Every
declaration in `tabs.css` has a fallback, so unknown tokens are ignored rather
than breaking the layout.

## Development

```bash
npm install     # for local typechecking only
npm run typecheck
```

## License

**Source-available, free for commercial use, not resellable.** Use KaelosUI in
your apps, SaaS products, client work and paid products at no cost. You may not
resell, sublicense or redistribute the library itself (or a derivative of it) as
a UI kit, template, theme or competing component library — see
[LICENSE](./LICENSE) for the exact terms.
