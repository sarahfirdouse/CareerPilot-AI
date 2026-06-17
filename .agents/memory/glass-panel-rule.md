---
name: Glass-panel consistency rule
description: All data panels must use glass-panel divs, never shadcn Card components
---

The design system uses `.glass-panel` for all panels/cards:
```
.glass-panel { @apply bg-card/60 backdrop-blur-xl border border-white/5 shadow-2xl; }
```

**Rule:** Never use shadcn `<Card>`, `<CardContent>`, `<CardHeader>` for main content panels in this app. They produce inconsistent borders/backgrounds that break the glassmorphism design.

**Why:** The analytics page was originally built with Card components, creating visible design inconsistency vs every other page (which uses glass-panel divs directly). Fixed during audit.

**How to apply:**
- Replace `<Card className="glass-panel">` with `<div className="glass-panel rounded-2xl p-5">`
- Replace `<CardHeader>` with an inline div row
- Replace `<CardContent>` with just the content div
- Heading size for page `<h1>`: always `text-3xl` (analytics was wrongly using `text-4xl`)
