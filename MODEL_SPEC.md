# Model specification and drawing mapping

## Scope

This repository contains only the supplied room-layout and fireplace-bookcase study plus generated catalog planning scenarios created within this standalone project. It does not inherit code, components, naming, layouts, or assets from any earlier project. The model is procedural Three.js geometry rebuilt from a single parameter state.

The present product concept is a four-step desktop homeowner planner: choose a bookcase design, match it to the closest room condition and valid placement, enter the measurements that control its fit, then choose a finish and review/share/save the result. The only current design family is the **Classic Shaker built-in**, and every room uses the same detailed construction generator. Alternative bookcase styles remain a future phase.

## Coordinate system and units

- All model dimensions are inches.
- X = left/right across the feature wall.
- Y = vertical from finished floor.
- Z = projection into the room from the back-wall finish plane.

## Scenario source classes

The catalog deliberately distinguishes two source classes:

- **Owner-reference scenarios:** fireplace wall, straight wall, centered-window wall, center niche, and deep/offset alcove. Their spatial compositions are interpretations of the supplied room images. Dimensions not explicitly labeled in those images remain editable assumptions.
- **Catalog-study scenarios:** doorway wall, offset-window wall, double-window wall, media wall, and side nook. These are generated planning archetypes without owner-reference images. They are labeled **Common scenario** in the interface and must be replaced with customer measurements/photos before approval.

Owner-reference scenarios are labeled **Supplied** in the interface. Those labels identify source provenance; they do not make an unlabeled dimension field-verified.

General design precedent recognizes walls, windows, doors, alcoves, and other overlooked areas as useful built-in locations; see [This Old House: Bookcase Basics](https://www.thisoldhouse.com/moving/bookcase-basics) and [7 Surprising Built-In Bookcase Designs](https://www.thisoldhouse.com/furniture/7-surprising-built-in-bookcase-designs). These sources support the scenario taxonomy only. They do not control geometry, appearance, construction, or dimensions in this project.

## Room scenarios and installation targets

The same cabinet generator is placed into ten selectable room studies:

| Scenario | Placement targets | Opening used by automatic fit |
|---|---|---|
| Fireplace wall | Pair flanking fireplace | Left and right spans between the chimney gap and side walls |
| Straight wall | Left, centered, or right | Editable wall study span anchored at the chosen position |
| Centered-window wall | Left of window, right of window, or both | Side spans outside window casing and center gap |
| Center niche | Centered in niche | Editable niche clear width |
| Deep/offset alcove | Centered on rear wall | Editable alcove clear width |
| Doorway wall | Left of doorway, right of doorway, or both | Side spans outside the cased doorway and center gap |
| Offset-window wall | Left of window, right of window, or both | Unequal side spans outside the offset window casing |
| Double-window wall | Between windows or outside both windows | Center span inside the clear trim-to-trim gap, or paired outer spans |
| Media wall | Left of media zone, right of media zone, or both | Side spans outside the reserved centered media datum |
| Side nook | Nook at left or nook at right | Selected recessed side opening |

Changing the scenario applies its environment defaults, normalizes the placement target, preserves shared bookcase and presentation preferences, and re-fits the active bookcase or pair. Changing placement also re-runs the fit. Entering the Measure step brings the displayed unit widths to the same fitted state used by the final review. A measurement is committed when the customer leaves its field or presses Enter; decimal inches and tape-style fractions such as `67 1/2` are accepted. The planner fits each active overall width down to the nearest 1/8 inch when the opening can support the current design. Measured room and opening values are never enlarged to manufacture a valid fit: an opening below the 44-inch planning minimum keeps its entered size and displays an explicit design warning. The **Review my design** action repeats the fit before the Finish step. The drawing-controlled construction values below remain unchanged.

## Editable room-study inputs

The Measure step promotes only inputs relevant to the active room. Ceiling height and **Finished bookcase height** are primary inputs for every scenario; bookcase height is constrained to remain at least 1/2 inch below the ceiling. Other shared or secondary room values remain available without crowding the primary measurement list. Scenario-specific inputs are:

- Fireplace wall: chimney width and projection, with detailed fireplace controls retained.
- Straight wall: available study-span width.
- Centered-window wall: clear window opening width and height, plus sill height.
- Center niche: clear width and recess depth.
- Deep/offset alcove: clear width and modeled depth; these directly define its room envelope.
- Doorway wall: clear door opening width and height, plus horizontal offset from wall center.
- Offset-window wall: clear window opening width and height, sill height, and horizontal offset.
- Double-window wall: shared clear window opening width and height, sill height, and clear casing-to-casing gap.
- Media wall: reserved media-zone width and height. The dark plane is a room datum only, not a new cabinet or media-center design.
- Side nook: clear width and recess depth; left/right placement changes which side is recessed.

Window and door opening dimensions are measured between the opening edges and exclude trim. The model adds its separate 3-inch window/doorway casing and 2-1/4-inch presentation frame depth around those openings; these are room-study values, not cabinet construction constants. All scenario dimensions are visual-planning assumptions until field verified.

## Bookcase construction

Each bookcase assembly contains:

1. **One outboard field-fit filler** with finished base and upper filler faces over a full-height unfinished plywood backer. The drawing establishes a 3/4-inch minimum finished filler width; the study defaults to 1-1/2 inches.
2. **Base carcass** with 3/4-inch side panels and center divider, 1/4-inch finished back, bottom panel, one shelf per bay, recessed toe-kick panel, and adjustable feet.
3. **Base face frame** with fixed 1-1/2-inch rails and stiles.
4. **Four Shaker doors** with 3/4-inch thickness, recessed center panels, consistent reveals, and paired hardware positions.
5. **One 1-1/4-inch fixed countertop/transition shelf** spanning the complete bookcase width with a finished front and side overhang.
6. **Upper carcass** with two bays, 3/4-inch side panels and divider, 1/4-inch back, and fixed top. The transition shelf forms its fixed lower datum; no second shelf is stacked above it.
7. **Upper face frame** with three fixed 1-1/2-inch stiles and top/bottom rails.
8. **Adjustable shelves** snapped to the 2-inch pin grid.
9. **5 mm shelf-pin rows** at front and rear positions on each bearing side.
10. **Flat field-fit crown/top filler** with a 1-1/2-inch study height, reflecting the drawing's add-or-remove crown allowance rather than an invented moulding profile.

## Required adjustable-shelf rule

Clear shelf span is derived from finished overall width after the one outboard filler, carcass sides, and center construction are deducted. Adjustable shelf thickness is selected automatically and is not an ordinary user control:

```text
clear span <= 27 in  -> 1 in MDF
clear span <= 31 in  -> 1-1/4 in MDF
clear span <= 36 in  -> 1-1/2 in MDF
clear span > 36 in   -> 1-1/2 in geometry plus support/design warning
```

Overall room, bookcase, and fireplace dimensions may change. The 3/4-inch carcass, 1/4-inch back, 1-1/2-inch face frame/divider, 3/4-inch doors, 1-1/4-inch transition shelf, 5 mm pins, 2-inch pin spacing, and 3/4-inch minimum filler do not scale with those changes.

## Fireplace assembly

The fireplace-wall scenario alone includes:

- Full-height projected chimney breast.
- Recessed firebox with a light herringbone field.
- Painted classical surround with a low projecting hearth slab.
- Layered mantel shelf, paneled pilasters with repeated oval reliefs, and a relief-panel frieze with rosettes, medallions, ribbed center detail, and sunburst.
- Recessed metal electric insert with frame, glass, grate, logs, embers, restrained flame elements, and flickering light.

## Room shells

- Shared finished wood floor, side walls/returns, baseboard treatment, optional ceiling datum, and presentation lighting.
- True segmented back-wall openings for the centered, offset, and paired-window scenarios and for the floor-level doorway; glazing or a doorway is not merely overlaid on a solid wall.
- Centered divided-light window, offset divided-light window, and two divided-light windows using the same study casing/sill language.
- Center niche and side nook built from forward wall planes against the rear-wall datum.
- Deep U-shaped alcove whose clear width/depth define its modeled envelope.
- Centered media datum represented as a shallow dark surface only; no unsupported television cabinetry or alternative bookcase design is implied.
- The room shell can be hidden for unobstructed part inspection.

## Desktop interface behavior

- **Design:** presents the one current **Classic Shaker built-in** family, described as two open upper bays over four lower doors, while preserving a selection pattern for future approved families.
- **Room:** opens a modal catalog of ten scenario cards grouped as fireplace/media, clear walls/doorways, window walls, and niches/nooks. Each card uses the same readable architectural-elevation illustration system, recognition prompts use customer-observable conditions, source badges distinguish **Supplied** from **Common scenario**, and radio-style placement choices show only targets valid for the active scenario.
- **Measure:** promotes the active layout's important fields, including ceiling and finished bookcase height, while optional secondary room dimensions remain collapsed. Customers identify values as a **Planning estimate** or **Measured by me**, may enter decimal or tape-style fractional inches, and see an immediate feet-and-inches translation. Window and door openings exclude trim. Committing a field preserves the entered room value and automatically re-fits active bookcase widths; a fitted-size card above the fields reports the available opening, unit widths, and any minimum-width conflict.
- **Finish:** offers Warm white, Pure white, Soft gray, and Deep green cabinet colors; summarizes design, room, placement, overall size, color, measurement confidence, and warning status; and provides a review-opening share URL, copyable project details, and PNG saving. Every completion state remains labeled a planning preview requiring field verification.
- **Advanced details:** optionally exposes detailed bookcase, fireplace/mantel, installation, room/display, and source/reference groups without putting them in the primary homeowner journey.
- Automatic clamping where parameters depend on one another.
- Live clear-opening, fit-result, and plain-language design warnings, with detailed construction data still available through part inspection.
- Simplified 3D room and front camera buttons plus top, bookcase-detail, opposite-side, and fireplace-detail views under More views; display toggles and active-only URL share state remain available.

## Current scope boundary

The owner references do not contain a complete dimension schedule for any room shell, wall opening, window, niche, alcove, overall bookcase width/height, fireplace chase, mantel, or electrical insert. The five new catalog scenarios have no owner-supplied visual references at all. Every overall value is therefore an editable visual-study default and must be replaced by customer measurements or a verified field survey before fabrication use.

The paired views identified as IMG_6777 and IMG_6778 are currently interpreted as the deep/offset-alcove reference, but they may be oblique documentation related to IMG_6768; that relationship remains unresolved. Replace study defaults in `src/model/config.ts` when verified information is supplied. Do not change the shared cabinet construction rules merely to force a fit.

The current Measure step is a guided homeowner preview with self-reported measurement confidence, not a field-survey workflow. “Measured by me” means only that the customer used a tape measure; it does not imply professional verification. Photo upload, obstacle capture, professional measurement verification, and selectable bookcase design families remain logical future phases and are not part of the present implementation.
