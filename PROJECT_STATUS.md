# Project status — Fireplace Bookcases 3D

**Last updated:** 2026-07-21
**Project stage:** Visually verified v1; GitHub publication pending
**Branch:** `main`
**Target repository:** `ZimaP/fireplace-bookcases-3d`
**Target public site:** `https://zimap.github.io/fireplace-bookcases-3d/`

## Source and reference confirmation

- The standalone transfer was imported without Git metadata or files from any unrelated repository.
- Primary construction reference confirmed: `reference/bookcase-detail-drawing.png`.
- Primary room-composition reference confirmed: `reference/room-fireplace-layout.jpg`.
- Both references also exist under `public/reference/` for the deployed viewer.

## Verified v1 feature set

- Procedural TypeScript + Three.js room, central chimney/fireplace, and two independently sized bookcases.
- Two upper bays and four lower Shaker doors per bookcase.
- Detailed face frames, finished backs, fillers/backers, transition tops, fixed and adjustable shelves, pin rows, toe kicks, levelers, crown, hardware, mantel carving, insert, logs, embers, and animated flame layers.
- Desktop controls for room, independent left/right bookcase, and fireplace dimensions; finish and visibility controls; fit-to-wall action; camera presets; orbit/pan/zoom; semantic part inspection; URL state; share link; and PNG export.
- Live per-side clear-span readouts, automatic shelf stock selection, and design warnings.
- Camera presets frame current geometry and remain stable after resizing; rebuilds dispose transient geometry, materials, CSS labels, and shadow targets.

## Drawing-controlled rules

- Carcass: 3/4 in.
- Finished back: 1/4 in.
- Face frames and center divider: 1-1/2 in.
- Doors: 3/4 in.
- Fixed transition/lower upper-cabinet shelf: 1-1/4 in.
- Shelf pins: 5 mm diameter on 2 in vertical centers.
- Minimum side filler: 3/4 in.
- Adjustable shelf clear span: 1 in through 27 in; 1-1/4 in over 27 through 31 in; 1-1/2 in over 31 through 36 in; 1-1/2 in plus a support warning over 36 in.

These values are centralized in `src/model/config.ts` and are not ordinary user inputs or URL parameters.

## Verification completed

- Clean dependency install: passed with the public npm registry.
- Strict TypeScript check: passed.
- Automated tests: 2 files, 24 assertions passed.
- Production build: passed.
- Git whitespace check: passed.
- Manual browser review at 1440 × 900: perspective, front, plan, left detail, right detail, and fireplace views passed.
- Parameter review: default; 44 in minimum widths; 108 in maximum widths; 60/79 in asymmetric widths; 79/79 in near-full-wall fit; 140 in bookcase height in a 150 in room; 21/26 in upper/base depths; and over-36-in span warnings passed.
- Part selection, drag-orbit suppression, URL reload round trip, share-link copy, PNG export, and visibility toggles passed.
- Review images: `docs/perspective-review.jpg`, `docs/front-elevation-review.jpg`, and `docs/bookcase-detail-review.jpg`.

## Study assumptions

The references do not provide a complete field-verified dimension schedule. Current defaults remain editable visual-study assumptions:

- Room: 222 W × 150 D × 108 H in.
- Each bookcase: 72 W × 104 H in.
- Base: 31-1/2 H × 22 D in.
- Upper: 15 D in.
- Chimney breast: 58 W × 8 projection in.
- Fireplace opening: 32 W × 24 H in.
- Mantel: 57 W × 45 H × 11 D in.
- Hearth: 62 W × 18 D in.
- Upper fixed top is treated as 3/4-in carcass stock.
- Lower adjustable shelves use the same per-side MDF span schedule as upper adjustable shelves.

Do not present these overall defaults as fabrication dimensions until verified field measurements are supplied.

## Remaining notes and next task

- Vite reports a non-blocking advisory for the single Three.js bundle being larger than 500 kB.
- Any clear shelf span above 36 in intentionally remains visible with a support/design warning and requires a verified support solution.
- The interface is intentionally desktop-only.
- Next recommended task: replace study assumptions with verified field dimensions when the owner provides them.

## Repository and deployment

- Implementation commit: pending initial commit.
- Repository publication: pending.
- GitHub Pages deployment: pending.
