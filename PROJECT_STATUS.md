# Project status — Fireplace Bookcases 3D

**Last updated:** 2026-07-22
**Project stage:** Verified multi-layout implementation; publication pending
**Working branch:** `agent/layout-presets`
**Target repository:** `ZimaP/fireplace-bookcases-3d`
**Target public site:** `https://zimap.github.io/fireplace-bookcases-3d/`

## Reference basis

- Cabinet construction and fireplace elevation: `reference/bookcase-detail-drawing.png`.
- Fireplace room: `reference/room-fireplace-layout.jpg`.
- Additional rooms: `reference/layout-straight-wall.jpg`, `reference/layout-window-wall.jpg`, `reference/layout-center-niche.jpg`, `reference/layout-deep-alcove-left.jpg`, and `reference/layout-deep-alcove-right.jpg`.
- The drawing continues to control cabinet construction, shelf stock, elevation rhythm, and mantel vocabulary; the room images control only the visual composition of each study shell.
- The paired source views identified as IMG_6777 and IMG_6778 are currently interpreted as a deep/offset alcove. They may instead be oblique documentation related to IMG_6768, so that relationship requires owner or field confirmation.
- No other repository or project was used as a source.

## Verified behavior

- Five room presets are selectable: fireplace wall, straight wall, window wall, center niche, and deep/offset alcove documented by two supplied views.
- Placement targets are layout-specific: paired units around the fireplace; left, center, or right on the straight wall; left, right, or both sides of the window; centered in the niche; and centered on the alcove rear wall.
- Changing the room preset loads its study defaults, rebuilds the shell, normalizes the installation target, and keeps URL share state limited to relevant active values.
- **Fit selected opening** fits the active single or paired units to their clear installation openings, rounds down to the nearest 1/8 inch, and does not alter fixed construction values.
- New editable study dimensions cover the straight-wall span; window width, height, and sill height; niche width and recess depth; and alcove clear width and depth. Generic room width, depth, and height remain editable where applicable; for the deep-alcove preset, the clear opening width and alcove depth directly define the physical room envelope.
- Every bookcase continues to use the shared drawing-derived construction formulas, including two upper bays, four lower Shaker doors, one outboard finished filler over a plywood backer, fixed face frames and backs, one 1-1/4-inch transition shelf, lower shelves, toe kick, levelers, shelf-pin rows, and flat field-fit top filler.
- Automatic shelf stock remains 1 inch through a 27-inch clear span, 1-1/4 inches over 27 through 31 inches, 1-1/2 inches over 31 through 36 inches, and 1-1/2-inch geometry with a support warning above 36 inches.
- Layout-aware clamping keeps active cabinets inside their selected openings and prevents dormant fireplace dimensions from constraining non-fireplace layouts.
- Camera presets, orbit/pan/zoom, part inspection, visibility controls, URL sharing, and PNG export remain available in the desktop interface.

## Verification completed on this branch

- `npm run verify` passed.
- Automated coverage: 4 test files, 75 tests passed.
- TypeScript project checking and the production Vite build passed.
- The layout tests cover all five presets, every placement target, active URL state, fit-to-opening rounding, paired/single fitting, width warnings, and adversarial containment.
- Updated visual-review images: `docs/layout-presets-hero.png` and `docs/layout-presets-front.png`.
- `git diff --check` passed for the current worktree documentation update.

## Drawing-controlled values

- 3/4-inch carcass.
- 1/4-inch finished back.
- 1-1/2-inch face-frame rails, stiles, and center divider.
- 3/4-inch doors.
- 1-1/4-inch fixed transition shelf.
- 5 mm shelf pins on 2-inch vertical centers.
- 3/4-inch minimum finished side filler.

These values remain centralized in `src/model/config.ts`; they are shared by every layout and are not ordinary end-user controls or URL parameters.

## Remaining dimensional assumptions

The new room images do not provide a complete dimension schedule. All new room, wall-opening, window, niche, and alcove dimensions are visual-study assumptions rather than field-verified fabrication values:

- Fireplace room: 222 W × 150 D × 108 H inches; chimney 58 W × 8 projection inches.
- Straight-wall room: 180 W × 132 D × 108 H inches with a 72-inch study span.
- Window room: 180 W × 132 D × 108 H inches with a 48 W × 42 H-inch window and 40-inch sill.
- Center-niche room: 180 W × 132 D × 108 H inches with a 72-inch clear width and 24-inch recess.
- Deep/offset alcove: 84 W × 150 D × 108 H inches with an 84-inch clear rear wall and 150-inch modeled depth.
- Shared bookcase default before layout fitting: 72 W × 104 H inches; base 31-1/2 H × 22 D inches; upper 15 D inches.
- Fireplace opening, mantel, hearth, upper top treatment, lower shelf usage, and filler layering remain visual-study assumptions recorded by the prior reference-alignment work.

## Remaining issues and next task

- Confirm whether IMG_6777 and IMG_6778 are a distinct deep/offset alcove or oblique documentation of the space shown in IMG_6768.
- Replace every room/opening study default with verified field dimensions before treating placement or clearances as fabrication information.
- Any clear shelf span above 36 inches intentionally remains visible with a support warning and still requires an engineered support detail.
- Vite continues to report a non-blocking advisory for the single minified Three.js bundle exceeding 500 kB.
- Next recommended task: owner review of the five room interpretations followed by field-dimension entry and support-detail confirmation.

## Publication state

- The multi-layout implementation is pending on branch `agent/layout-presets`.
- It has not yet been merged, deployed, or publicly verified.
- The intended publication target remains `https://zimap.github.io/fireplace-bookcases-3d/`; only a post-deployment browser check may move this state to complete.
