# kaelos-core

Six animated tab bars built on one headless TypeScript core. Measured geometry,
real spring physics, CSS-variable theming. No animation library.

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

## Install

```bash
npm install          # for local typechecking / development
```

The package is consumed as TypeScript source; there is no build step. Bundlers
(Vite, Next, esbuild, webpack) compile it directly.

## Usage

```tsx
import { WormUnderlineTabs, tabVars } from 'kaelos-core'
import 'kaelos-core/styles.css'

const items = [
  { id: 'all', label: 'All' },
  { id: 'music', label: 'Music' },
  { id: 'video', label: 'Video' },
]

export function Categories() {
  return (
    <WormUnderlineTabs
      items={items}
      defaultValue="music"
      ariaLabel="Categories"
      style={tabVars({ '--tb-accent': '#fb7185' })}
    />
  )
}
```

The stylesheet is plain CSS declared in `@layer components`, so consumer
utility classes win without specificity fights. It does not require Tailwind —
native CSS cascade layers are enough — but it is designed to sit alongside it.

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

Every colour, radius, size and spring constant is a CSS custom property.
Override them via `style={tabVars({ ... })}`, a wrapper class, or `:root`.
