---
name: ui-verify
description: Verify a user-facing change - responsive layout, loading/empty/error/success states, light/dark/system themes, keyboard access and accessibility. Use after changing UI, before calling UI work done.
---

# UI verification

Report every check as PASS, FAIL, NOT RUN or BLOCKED. A check you could not run is NOT RUN with the reason, never PASS.

## Steps

1. List the screens and components the change touches, and the states each can be in.
2. **Automated first.** If the project has Playwright (or another browser test tool), run or extend its tests. With `@axe-core/playwright` (or equivalent), scan each changed page. Treat axe as a baseline, not proof of accessibility.
3. **Breakpoints.** Check mobile (about 375px), tablet (about 768px) and desktop (about 1280px): no horizontal scroll, overflow, clipped text or overlapping elements; touch targets at least about 44px on mobile.
4. **States.** Loading, empty, error and success are implemented and visually distinct. Errors say what happened and what to do.
5. **Themes.** If the project supports themes, check light, dark and system mode for every changed screen: text contrast, borders, icons and images stay visible; no flash of the wrong theme on load; the choice persists as specified.
6. **Keyboard and semantics.** Every interactive element is reachable with Tab in a logical order, has a visible focus style and works with Enter/Space; dialogs trap and restore focus; form fields have labels; headings are in order; images have meaningful alt text.
7. **Console.** No errors or warnings in the browser console during the flows you tested.
8. Compare with the design reference if one exists (spacing, typography, components).

## Without a browser tool

If no browser automation is available, say so, mark the visual checks NOT RUN, and give the human a short manual checklist for the affected screens.

## Done when

Each check has an honest status, failures are fixed or reported, and screenshots or test names are given as evidence where available.
