---
name: Framer Motion variants type error
description: How to fix "type string not assignable to AnimationGeneratorType" in framer-motion Variants objects
---

# Framer Motion — `type: "spring"` TS Error Fix

## The rule
When defining Framer Motion `item` variants with a spring transition, always narrow the `type` field with `as const`:

```typescript
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};
```

**Why:** TypeScript infers `type: "spring"` as `string`, but framer-motion's `Variants` type requires `AnimationGeneratorType` (a string literal union). The `as const` assertion narrows the type to the literal `"spring"`, satisfying the constraint.

**How to apply:** Every time a variants object has a transition with a named type ("spring", "tween", "inertia", etc.), add `as const` to that string value. Applies to all files using stagger variants.
