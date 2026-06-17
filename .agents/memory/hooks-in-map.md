---
name: Hooks-in-map pattern
description: useCountUp called inside .map() — technically a rules-of-hooks violation that works in practice
---

Several pages call `useCountUp` inside a `.map()` callback:

```tsx
items.map(({ value, delay }, i) => {
  const count = useCountUp(value, 1100, delay); // eslint-disable-line react-hooks/rules-of-hooks
  return <div>{count}</div>;
})
```

**Why this exists:** It avoids creating a separate component just for the counter animation when the array is always static. It compiles fine and works in practice because the array never changes size between renders (hooks call order stays consistent).

**Risk:** React strict mode may log a warning. If it ever causes issues, extract to a small sub-component:
```tsx
function CountedItem({ value, delay, ...rest }) {
  const count = useCountUp(value, 1100, delay);
  return <div>{count}</div>;
}
```

**Where this pattern exists:** `pages/interview-prep/index.tsx` (study tracker cards), `pages/analytics/index.tsx` (conversion stages).
