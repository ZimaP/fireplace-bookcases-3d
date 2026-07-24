# Project status — Fireplace Bookcases 3D

**Last updated:** 2026-07-23

**Project stage:** Four-step homeowner planner released and live-verified on GitHub Pages

**Published branch:** `main`

**Working branch:** `agent/homeowner-planner-publication`

**Target repository:** `ZimaP/fireplace-bookcases-3d`

**Target public site:** `https://zimap.github.io/fireplace-bookcases-3d/`

## Homeowner planner UX release — verified

- The customer journey is now four plain-language steps: **Choose your bookcase**, **Match your room**, **Measure your space**, and **Make it yours**.
- The Design step truthfully presents one available family, **Classic Shaker built-in**, while leaving a clear pattern for future fully modeled design families.
- The Room step uses the existing ten-scenario modal catalog and shows a placement question only where a scenario has more than one valid position.
- The Measure step promotes only the dimensions relevant to the active layout, including ceiling height and finished bookcase height. Optional room values remain collapsed.
- Window and door widths are explicitly entered as clear opening widths without trim because the room model adds its separate 3-inch casing.
- Number fields apply after the customer leaves the field or presses Enter, avoiding mid-entry clamping. Committed room measurements and placement changes fit active bookcase widths to the selected opening; **Build my bookcase** repeats the fit before advancing.
- The Finish step adds four cabinet colors—Warm white, Pure white, Soft gray, and Deep green—plus a plain-language review card, share action, and image save action.
- Detailed bookcase, fireplace, installation, room/display, and reference controls remain available under optional **Fine-tune your design** groups.
- The top toolbar is reduced to **3D room**, **Front**, **More views**, **Start over**, **Share**, and **Save image**. Reset now requires confirmation.
- Placement and finish choices support radio-group arrow-key navigation with focus restoration after a model rebuild. Status and warning regions announce changes without exposing raw construction jargon.
- Duplicate structural warnings are collapsed into one customer-facing design note, while detailed construction logic remains unchanged.
- The Deep green material was lightened for readable face-frame, shelf, and door detail. This is a presentation finish, not a fabrication specification.
- No drawing-controlled construction thickness, shelf-span rule, or fixed material value changed in this UX task.

Local verification completed on 2026-07-23:

- `npm ci` completed successfully from the committed lockfile.
- `npm run verify` passed: 4 test files and all 151 tests, TypeScript checking, and the Vite production build.
- A 1440 × 900 browser review covered all four customer steps, the grouped ten-room catalog, doorway placement and measurement flow, the four finish choices, hero and front cameras, part inspection, URL sharing, reset confirmation, and image-export feedback.
- Geometry reviews covered minimum and maximum practical widths, a near-full-wall fit, and a clear shelf span above 36 inches with the required support warning.
- Responsive checks covered 1280 × 800 and 1100 × 720 desktop layouts; the unsupported-width notice appears at 1023 × 720.
- Keyboard review covered placement and finish radio groups. Slow numeric entry remains stable until commit, and the visible finished-height field reflects safety clamping.
- Browser review showed active WebGL rendering and no console warnings or errors.
- Current review images are `docs/homeowner-planner-design.png`, `docs/homeowner-planner-room-catalog.png`, `docs/homeowner-planner-measure.png`, `docs/homeowner-planner-finish.png`, and `docs/homeowner-planner-support-warning.png`, each captured at 1440 × 900.
- `git diff --check` passed.
- The Vite build continues to emit only the known non-blocking advisory for the minified Three.js bundle exceeding 500 kB.

Publication verification completed on 2026-07-23:

- Pull request [#8](https://github.com/ZimaP/fireplace-bookcases-3d/pull/8) merged the homeowner planner as commit `dcc675d5ed8d4996cf44081fe68d35e84c0dc851`.
- GitHub Pages workflow run [30061055491](https://github.com/ZimaP/fireplace-bookcases-3d/actions/runs/30061055491) completed dependency installation, all verification/build steps, artifact upload, and deployment successfully against that exact commit.
- The public site opened at `https://zimap.github.io/fireplace-bookcases-3d/` with the new page title, the four-step planner, active WebGL rendering, and ten room cards.
- Live interaction covered Classic Shaker selection, the room catalog, doorway placement, the relevant measurement step, automatic fit, and the final finish/review step.
- The deployed browser console had no warnings or errors.

## Source basis and catalog distinction

- Cabinet construction and fireplace elevation: `reference/bookcase-detail-drawing.png`.
- Owner-supplied room studies: `reference/room-fireplace-layout.jpg`, `reference/layout-straight-wall.jpg`, `reference/layout-window-wall.jpg`, `reference/layout-center-niche.jpg`, `reference/layout-deep-alcove-left.jpg`, and `reference/layout-deep-alcove-right.jpg`.
- The drawing continues to control cabinet construction, shelf stock, elevation rhythm, and mantel vocabulary. Owner room images control only the spatial composition of their five study shells.
- Five additional generated planning archetypes—doorway wall, offset-window wall, double-window wall, media wall, and side nook—have no owner-reference images. The interface identifies these as **Common scenario**, while the first five are identified as **Supplied**.
- The common-scenario taxonomy is supported generally by residential built-in guidance such as [This Old House: Bookcase Basics](https://www.thisoldhouse.com/moving/bookcase-basics) and [7 Surprising Built-In Bookcase Designs](https://www.thisoldhouse.com/furniture/7-surprising-built-in-bookcase-designs). Those sources do not supply this project's geometry, imagery, fabrication dimensions, or cabinet design.
- The paired owner views identified as IMG_6777 and IMG_6778 are currently interpreted as a deep/offset alcove. They may instead be oblique documentation related to IMG_6768, so that relationship still requires owner or field confirmation.
- No other code repository or project was used as a source.

## Verified ten-layout behavior

- The desktop selector is now a ten-card catalog grouped into feature walls, simple walls, window walls, and recesses.
- Each card uses a plain-language recognition prompt so a customer can choose the closest physical room condition before entering measurements.
- The desktop workflow is explicitly sequenced: **Choose your room layout**, **Choose the bookcase position**, then **Place & fit bookcase**.
- Source badges and explanatory copy distinguish owner-image interpretations from generated catalog studies.
- All ten scenarios reuse the same drawing-derived bookcase generator; no alternative bookcase family has been introduced.
- Placement choices are scenario-specific:
  - Fireplace wall: paired units flanking the fireplace.
  - Straight wall: left, centered, or right study span.
  - Centered-window wall: left, right, or both sides.
  - Center niche: centered in the niche.
  - Deep/offset alcove: centered on the rear wall.
  - Doorway wall: left, right, or both sides of the doorway.
  - Offset-window wall: left, right, or both unequal side zones.
  - Double-window wall: between the windows or outside both windows.
  - Media wall: left, right, or both sides of the reserved media zone.
  - Side nook: recessed opening at left or right.
- Scenario changes load that environment's defaults, normalize placement, retain shared cabinet/presentation preferences, and limit share URLs to active scenario values.
- **Place & fit bookcase** fits active single or paired units to their calculated openings and rounds widths down to the nearest 1/8 inch without changing fixed construction values.
- New room-shell geometry includes a true floor-level doorway opening and casing; one offset divided-light window; two divided-light windows; a shallow media datum; and a one-sided recessed nook.
- Only inputs relevant to the active scenario are shown. New editable values cover door width/height/offset, window offset, double-window clear gap, media-zone width/height, and side-nook width/depth.
- Camera presets, orbit/pan/zoom, part inspection, visibility controls, URL sharing, finish controls, dimension graphics, and PNG export remain in scope.

Local verification completed on 2026-07-22:

- `npm ci` completed successfully from the committed lockfile.
- `npm run verify` passed: 4 test files and 151 tests, including all 10 layouts and all 22 placement targets; TypeScript checking and the Vite production build both passed.
- Automated cases cover defaults, active-only URL state, fit-to-opening, minimum/adversarial dimensions, asymmetric openings, maximum study inputs, idempotent normalization, containment, and clear spans above 36 inches.
- A 1440 × 900 desktop review covered the grouped catalog, doorway hero and front views, plan and detail cameras, every room shell, every placement menu, source/assumption messaging, dialog Escape/focus behavior, part inspection, share-link copy, and PNG export.
- Browser review showed active WebGL rendering and no console warnings or errors.
- Current review images are `docs/layout-catalog-hero.png`, `docs/layout-catalog-front.png`, and `docs/layout-catalog-menu.png`, each verified at 1440 × 900.
- `git diff --check` passed.
- The Vite build continues to emit only the known non-blocking advisory for the minified Three.js bundle exceeding 500 kB.

## Previously verified baseline

Before the ten-layout catalog changes, the five-layout release on `main` had the following verified state:

- Fresh dependency installation passed with `npm ci`.
- `npm run verify` passed with 4 test files and 75 tests.
- TypeScript checking and the production Vite build passed.
- A 1440 × 900 production-preview review covered hero, front, and plan cameras; all five supplied scenarios; minimum, default, maximum, near-full-wall, and over-36-inch shelf-span cases; URL restore; fit-to-opening; part inspection; and PNG export.
- Review images were saved as `docs/layout-presets-hero.png` and `docs/layout-presets-front.png`.
- The prior live five-layout release was opened and browser-verified at `https://zimap.github.io/fireplace-bookcases-3d/`.

Those results must not be treated as verification of the new ten-layout branch.

## Previous ten-layout publication checks

- Pull request [#6](https://github.com/ZimaP/fireplace-bookcases-3d/pull/6) merged the catalog as commit `6e41d1a0f8f1e4ca06504429e5a62f9913edea6e`.
- GitHub Pages workflow run [29972350061](https://github.com/ZimaP/fireplace-bookcases-3d/actions/runs/29972350061) completed its verify/build, artifact upload, and deployment jobs successfully against that exact commit.
- The public home page was opened at `https://zimap.github.io/fireplace-bookcases-3d/` and confirmed the default fireplace room, 10 catalog cards, 143 detailed parts, and active WebGL rendering.
- Live interaction also covered the doorway and double-window scenarios, layout switching, place-and-fit, Perspective/Front/Plan cameras, part inspection, share-link copy, and PNG export. The deployed console had no warnings or errors.

## Drawing-controlled values

- 3/4-inch carcass.
- 1/4-inch finished back.
- 1-1/2-inch face-frame rails, stiles, and center divider.
- 3/4-inch doors.
- 1-1/4-inch fixed transition shelf.
- 5 mm shelf pins on 2-inch vertical centers.
- 3/4-inch minimum finished side filler.

These values remain centralized in `src/model/config.ts`; they are shared by every scenario and are not ordinary end-user controls or URL parameters.

Automatic shelf stock remains:

- 1-inch MDF through a 27-inch clear span.
- 1-1/4-inch MDF over 27 through 31 inches.
- 1-1/2-inch MDF over 31 through 36 inches.
- 1-1/2-inch shelf geometry plus a visible support/design warning above 36 inches.

## Remaining dimensional assumptions

No room scenario currently has a complete, field-verified dimension schedule. Defaults are visual-planning assumptions:

- Fireplace room: 222 W × 150 D × 108 H inches; chimney 58 W × 8 projection inches.
- Straight-wall room: 180 W × 132 D × 108 H inches with a 72-inch study span.
- Centered-window room: 180 W × 132 D × 108 H inches with a 48 W × 42 H-inch window and 40-inch sill.
- Center-niche room: 180 W × 132 D × 108 H inches with a 72-inch clear width and 24-inch recess.
- Deep/offset alcove: 84 W × 150 D × 108 H inches with an 84-inch clear rear wall.
- Doorway room: 180 W × 132 D × 108 H inches; 36 W × 80 H-inch centered opening; 3-inch study casing; default fitted side zones 67-1/2 inches each.
- Offset-window room: 192 W × 132 D × 108 H inches; 48 W × 42 H-inch window; 40-inch sill; window center 8 inches right of wall center; default side zones 75-1/2 and 59-1/2 inches.
- Double-window room: 264 W × 132 D × 108 H inches; two 36 W × 48 H-inch windows; 30-inch sill; 72-inch clear trim-to-trim gap; default center placement 69 inches or paired outer zones 52-1/2 inches each.
- Media room: 222 W × 132 D × 108 H inches; centered reserved datum 72 W × 50 H inches; default side zones 73-1/2 inches each. The media plane is not a cabinet-design proposal.
- Side-nook room: 180 W × 132 D × 108 H inches; 72-inch clear nook and 24-inch recess; selectable left/right orientation.
- Shared bookcase before scenario fitting: 72 W × 104 H inches; base 31-1/2 H × 22 D inches; upper 15 D inches.
- The 3-inch window/door casing and 2-1/4-inch frame depth are presentation assumptions, not drawing-controlled construction values.
- Fireplace opening, mantel, hearth, upper top treatment, lower shelf usage, and filler layering remain study assumptions recorded by earlier reference-alignment work.

Door swings, hardware clearances, electrical outlets, switches, HVAC/radiators, structural conditions, baseboard removal, floor level, wall plumb, and anchorage are not captured by the scenario defaults. They require customer information and field verification.

## Remaining issues and recommended next work

- Confirm whether IMG_6777 and IMG_6778 represent a distinct deep alcove or the same space as IMG_6768.
- Replace every room/opening study default with customer or field dimensions before treating a fit result as fabrication information.
- Any clear shelf span above 36 inches remains intentionally visible with a support warning and requires an engineered support detail.
- Vite reports a non-blocking advisory for the minified Three.js bundle exceeding 500 kB.
- Extend the current numeric Measure step into a verified survey workflow with photo upload, obstacle capture, missing-value validation, and an explicit estimated-versus-field-verified status.
- Add selectable bookcase design families only after each family has its own approved geometry, construction logic, thumbnail, copy, and verification coverage.

## Publication state

- Public URL: `https://zimap.github.io/fireplace-bookcases-3d/`.
- Implementation pull request: `https://github.com/ZimaP/fireplace-bookcases-3d/pull/8`.
- Published planner commit: `dcc675d5ed8d4996cf44081fe68d35e84c0dc851`.
- Verified GitHub Pages workflow: `https://github.com/ZimaP/fireplace-bookcases-3d/actions/runs/30061055491`.
- Live verification completed successfully on 2026-07-23 as described above.
