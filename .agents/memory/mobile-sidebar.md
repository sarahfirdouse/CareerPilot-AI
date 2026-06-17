---
name: Mobile sidebar pattern
description: How the CareerPilot AppLayout handles mobile navigation — hamburger + slide-out drawer
---

The `AppLayout` component handles mobile nav with three elements:

1. **Fixed mobile top bar** (`md:hidden`) — logo + hamburger button at top of screen. Height 14 (56px). Content area uses `pt-[72px]` on mobile, `md:pt-8` on desktop to avoid overlap.

2. **AnimatePresence drawer** — slides in from left on hamburger click. Separate `backdrop` div (opacity fade) + `drawer` div (x-axis spring). Both have `md:hidden`. `mobileOpen` state controlled by button.

3. **Desktop sidebar** — `hidden md:flex flex-col` sticky sidebar. Unchanged from original.

**Why:** On mobile, the original `h-screen sticky top-0 w-full` sidebar consumed the entire viewport before any content appeared. The drawer pattern is standard SaaS UX.

**How to apply:** 
- Close drawer on location change via `useEffect([location])` AND on nav item click via `onNavigate` prop
- Use `document.body.style.overflow = "hidden"` when drawer open to prevent scroll bleed
- `layoutId="sidebar-active-indicator"` shared between mobile/desktop is fine — only one is in DOM at a time
- `NavContent` is a shared sub-component to avoid duplicating nav markup
