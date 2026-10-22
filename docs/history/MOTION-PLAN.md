# Plan — Framer Motion Hover Interactions (SHIPPED 2026-05-27)

## Context

`framer-motion@12.38.0` is active. Hover interactions shipped. Page transitions remain Planned as a separate roadmap item.

**Intensity:** Tuned by Jon — more noticeable than the original subtle spec. Scale + lift combos.
**Accessibility:** `prefers-reduced-motion` respected via `<MotionConfig reducedMotion="user">` in `components/providers.tsx`.

## Shipped values

| Element                          | Animation                   | Values               | Spring   |
| -------------------------------- | --------------------------- | -------------------- | -------- |
| Project cards (home + /projects) | Scale + lift on hover/focus | `scale: 1.02, y: -1` | `400/25` |
| Roadmap cards                    | Lift on hover               | `y: -2`              | `400/25` |
| Nav links (desktop)              | Scale + lift on hover/focus | `scale: 1.2, y: -1`  | `500/30` |
| Nav links (mobile)               | Lift on hover/focus         | `y: -1`              | `500/30` |
| Footer icons                     | Scale + lift on hover/focus | `scale: 1.5, y: -1`  | `400/20` |
| Hero CTAs (See projects, About)  | Scale + lift on hover/focus | `scale: 1.05, y: -1` | `400/25` |
| Resume button (desktop)          | Scale + lift on hover/focus | `scale: 1.1, y: -1`  | `500/30` |
| Resume button (mobile)           | Lift on hover/focus         | `y: -1`              | `500/30` |

## Architecture

Project cards and footer are **server components** — they can't use Framer directly. Solution: thin client wrapper components. Nav and roadmap are already client components — use `motion` inline.

Reduced motion is handled once at the root via `<MotionConfig reducedMotion="user">`, wrapped alongside the existing `ThemeProvider` in a new `<Providers>` component.

## Implementation steps

### 1. Create `components/providers.tsx`

New `"use client"` component wrapping `ThemeProvider` + `MotionConfig`:

```tsx
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
  <MotionConfig reducedMotion="user">{children}</MotionConfig>
</ThemeProvider>
```

### 2. Update `app/layout.tsx`

Replace inline `<ThemeProvider>` with `<Providers>`. The layout stays a server component.

### 3. Create `components/motion/motion-card-link.tsx`

Thin `"use client"` wrapper using `motion.create(Link)` with `whileHover={{ y: -2 }}`, `whileFocus={{ y: -2 }}`, spring `stiffness: 400, damping: 25`. Passes through all `<Link>` props + className.

### 4. Update `app/page.tsx` + `app/projects/page.tsx`

Replace `<Link>` on project cards with `<MotionCardLink>`. Pages stay server components. No other changes.

### 5. Create `components/motion/motion-icon-link.tsx`

Thin `"use client"` wrapper using `motion.a` with `whileHover={{ scale: 1.1 }}`, `whileFocus={{ scale: 1.1 }}`, spring `stiffness: 400, damping: 20`. Passes through all `<a>` props.

### 6. Update `components/layout/footer.tsx`

Replace `<a>` icon links with `<MotionIconLink>`. Footer stays a server component.

### 7. Update `components/layout/nav.tsx`

Already a client component. Add `motion.create(Link)` at module level. Replace the 6 nav `<Link>` elements (3 desktop, 3 mobile) with `<MotionLink>` using `whileHover={{ y: -1 }}`, `whileFocus={{ y: -1 }}`, spring `stiffness: 500, damping: 30`.

### 8. Update `app/roadmap/roadmap-client.tsx`

Already a client component. Import `motion` and replace card `<li>` with `motion.li` using `whileHover={{ y: -2 }}`, spring `stiffness: 400, damping: 25`. No `whileFocus` (non-interactive `<li>`).

### 9. Update docs

- `docs/ARCHITECTURE.md` — add `components/motion/` and `components/providers.tsx` to directory layout; note framer-motion is now active
- `docs/ROADMAP.md` — update roadmap item status
- `lib/roadmap.ts` — update "Page transitions & hover animations" item

## Critical files

| File                                     | Action                                        |
| ---------------------------------------- | --------------------------------------------- |
| `components/providers.tsx`               | Create — MotionConfig + ThemeProvider wrapper |
| `components/motion/motion-card-link.tsx` | Create — card hover wrapper                   |
| `components/motion/motion-icon-link.tsx` | Create — icon hover wrapper                   |
| `app/layout.tsx`                         | Modify — swap ThemeProvider for Providers     |
| `app/page.tsx`                           | Modify — Link → MotionCardLink on cards       |
| `app/projects/page.tsx`                  | Modify — Link → MotionCardLink on cards       |
| `components/layout/footer.tsx`           | Modify — a → MotionIconLink                   |
| `components/layout/nav.tsx`              | Modify — inline motion.create(Link)           |
| `app/roadmap/roadmap-client.tsx`         | Modify — li → motion.li                       |

## Verification

1. `npm run build` — compiles cleanly, no TypeScript errors
2. `npm run dev` — test each element:
   - Hover project cards on home + /projects — subtle 2px lift with spring
   - Hover roadmap cards — same lift
   - Hover nav links — 1px lift
   - Hover footer icons — 10% scale pop
   - Tab through all interactive elements — focus triggers same animations
3. Theme toggle — animations work in both modes
4. Reduced motion — enable "Reduce motion" in OS settings, verify no transform animations play
5. Mobile — touch interactions should still feel natural (no stuck hover states)
6. `npm run lint` and `npm run format:check` pass

## Risk: `motion.create(Link)` compatibility

Next.js 16's `<Link>` forwards refs, which `motion.create()` requires. This has worked since Next 13+. If it fails, fallback: wrap the anchor child inside Link with `<motion.span>`. Verify during step 3.
