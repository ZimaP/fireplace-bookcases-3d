# Project status — Fireplace Bookcases 3D

**Last updated:** 2026-07-22
**Project stage:** Reference-aligned v1, locally verified; publication pending
**Working branch:** `codex/reference-alignment`
**Target repository:** `ZimaP/fireplace-bookcases-3d`
**Target public site:** `https://zimap.github.io/fireplace-bookcases-3d/`

## Reference basis

- Primary construction source: `reference/bookcase-detail-drawing.png`.
- Primary room-composition source: `reference/room-fireplace-layout.jpg`.
- The supplied drawing controls cabinet construction, shelf stock, elevation rhythm, and mantel vocabulary.
- The supplied room image controls the U-shaped room, projected chimney breast, and overall placement.
- No other repository or project was used as a source.

## Verified behavior

- Two independently editable bookcases share the same construction formulas.
- Each bookcase has two upper bays, five default adjustable shelves per bay, four lower Shaker doors, one outboard finished filler over plywood backers, 1-1/2-inch face frames, 1/4-inch finished backs, one 1-1/4-inch transition shelf, lower shelves, toe kick, levelers, pin rows, optional hardware, and a flat field-fit top/crown filler.
- The fireplace now reads as the drawing's primary painted classical surround: recessed herringbone firebox, narrow inner steel reveal, low hearth, paneled pilasters with repeated reliefs, medallion frieze, wavy center ribs, sunburst, and layered mantel shelf.
- Adjustable shelf stock is automatic per side: 1 inch through 27 inches, 1-1/4 inches over 27 through 31 inches, 1-1/2 inches over 31 through 36 inches, and retained 1-1/2-inch geometry with a support warning above 36 inches.
- Configuration clamping prevents side-wall overlap, negative clear bays, duplicate shelf levels, dense unusable shelf openings, mantel/pilaster intrusion into the firebox, and a mantel taller than an inset chimney breast.
- Camera presets, orbit/pan/zoom, independent dimension inputs, fit-to-wall, URL state, share-link copying with fallback, semantic part inspection, visibility controls, and PNG export remain operational.
- The fixed desktop shell remains at full viewport height while the controls scroll independently.

## Verification completed

- Fresh dependency install: `npm ci` passed.
- Full verification: `npm run verify` passed.
- Automated coverage: 3 test files, 49 tests passed.
- TypeScript project check and production Vite build passed.
- Production preview rendered at 1440 × 900 with no browser warnings or errors.
- Manual camera review completed for perspective/room, front, plan, and fireplace views.
- Manual interaction checks passed for part inspection, copied URL state, PNG export, and fit-to-wall.
- Parameter checks passed for minimum, default, maximum, near-full-wall, asymmetric 27-inch versus over-36-inch spans, and inset-chimney stress configurations.
- Review images: `docs/hero-reference-aligned.png` and `docs/front-reference-aligned.png`.
- `git diff --check` passed.

## Drawing-controlled values

- 3/4-inch carcass.
- 1/4-inch finished back.
- 1-1/2-inch face-frame rails, stiles, and center divider.
- 3/4-inch doors.
- 1-1/4-inch fixed transition shelf.
- 5 mm shelf pins on 2-inch vertical centers.
- 3/4-inch minimum finished side filler.

These values are centralized in `src/model/config.ts` and are not ordinary end-user controls or URL parameters.

## Remaining dimensional assumptions

The references do not provide a complete overall or field-verified dimension schedule. Current defaults are visual-study assumptions, not fabrication dimensions:

- Room: 222 W × 150 D × 108 H inches.
- Each bookcase: 72 W × 104 H inches.
- Base: 31-1/2 H × 22 D inches; upper: 15 D inches.
- Chimney breast: 58 W × 8 projection inches.
- Fireplace opening: 32 W × 24 H inches.
- Mantel: 57 W × 45 H × 11 D inches.
- Hearth: 59 W × 12 projection inches, with a 3/4-inch modeled slab height.
- The upper fixed top is treated as 3/4-inch carcass stock.
- Lower adjustable shelves use the same per-side MDF span schedule as upper shelves.
- The finished filler is modeled as a 1-inch face over a 3/4-inch plywood backer, based on the drawing detail.

## Remaining issues and next task

- Any clear shelf span above 36 inches intentionally remains visible with a support warning and still requires an engineered support detail.
- Vite reports a non-blocking advisory for the single minified Three.js bundle exceeding 500 kB.
- Fabrication dimensions still require verified field measurements.
- Next recommended task: replace the overall study assumptions with field measurements, then confirm the above-36-inch shelf support design with the fabricator/engineer.

## Publication state

- The GitHub Pages workflow remains configured to verify and deploy pushes to `main`.
- This revision must not be reported as deployed until the workflow succeeds and the public WebGL page is opened and visually verified.
