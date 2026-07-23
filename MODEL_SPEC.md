# Model specification and drawing mapping

## Scope

This repository contains only the supplied room-layout and fireplace-bookcase study plus generated catalog planning scenarios created within this standalone project. It does not inherit code, components, naming, layouts, or assets from any earlier project. The model is procedural Three.js geometry rebuilt from a single parameter state.

The present product concept is a desktop room-recognition workflow: a customer chooses the room condition closest to their home, chooses a valid bookcase position, and fits the same detailed bookcase generator into that opening. Alternative bookcase styles are a future phase and are not part of the ten-layout catalog work.

## Coordinate system and units

- All model dimensions are inches.
- X = left/right across the feature wall.
- Y = vertical from finished floor.
- Z = projection into the room from the back-wall finish plane.

## Scenario source classes

The catalog deliberately distinguishes two source classes:

- **Owner-reference scenarios:** fireplace wall, straight wall, centered-window wall, center niche, and deep/offset alcove. Their spatial compositions are interpretations of the supplied room images. Dimensions not explicitly labeled in those images remain editable assumptions.
- **Catalog-study scenarios:** doorway wall, offset-window wall, double-window wall, media wall, and side nook. These are generated planning archetypes without owner-reference images. They are labeled **Common scenario** in the interface and must be replaced with customer measurements/photos before approval.

General design precedent recognizes walls, windows, doors, alcoves, and other overlooked areas as useful built-in locations; see [This Old House: Bookcase Basics](https://www.thisoldhouse.com/moving/bookcase-basics) and [7 Surprising Built-In Bookcase Designs](https://www.thisoldhouse.com/furniture/7-surprising-built-in-bookcase-designs). These sources support the scenario taxonomy only. They do not control geometry, appearance, construction, or dimensions in this project.

## Room scenarios and installation targets

The same cabinet generator is placed into ten selectable room studies:

| Scenario | Placement targets | Opening used by place-and-fit |
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

Changing the scenario applies its environment defaults, normalizes the placement target, and preserves shared bookcase and presentation preferences. **Place & fit bookcase** changes only each active bookcase's overall width, rounding down to the nearest 1/8 inch so geometry does not exceed the target opening. The drawing-controlled construction values below remain unchanged.

## Editable room-study inputs

Shared inputs are room width, depth, and height plus overall bookcase dimensions. Scenario-specific inputs are:

- Fireplace wall: chimney width and projection, with detailed fireplace controls retained.
- Straight wall: available study-span width.
- Centered-window wall: window width, height, and sill height.
- Center niche: clear width and recess depth.
- Deep/offset alcove: clear width and modeled depth; these directly define its room envelope.
- Doorway wall: clear door width, clear height, and horizontal offset from wall center.
- Offset-window wall: window width, height, sill height, and horizontal offset.
- Double-window wall: shared window width, height, sill height, and clear casing-to-casing gap.
- Media wall: reserved media-zone width and height. The dark plane is a room datum only, not a new cabinet or media-center design.
- Side nook: clear width and recess depth; left/right placement changes which side is recessed.

The 3-inch window and doorway casing widths and 2-1/4-inch presentation frame depth are room-study values, not cabinet construction constants. All scenario dimensions are visual-planning assumptions until field verified.

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

- A modal catalog of ten scenario cards grouped as feature walls, simple walls, window walls, and recesses.
- Recognition prompts phrased as customer-observable room conditions.
- Visible **Supplied** versus **Common scenario** source badges.
- A three-step workflow: choose room, choose position, place and fit.
- Placement choices shown as radio-style buttons with only targets valid for the active scenario.
- Only the active scenario's room/opening dimensions are exposed.
- Overall room, bookcase, and fireplace controls remain available where relevant.
- Automatic clamping where parameters depend on one another.
- Live clear opening, calculated bay span, shelf thickness, fit result, and design warnings.
- Hero, front, plan, room, and detail camera views; presentation finishes; part inspection; display toggles; PNG capture; and active-only URL share state.

## Current scope boundary

The owner references do not contain a complete dimension schedule for any room shell, wall opening, window, niche, alcove, overall bookcase width/height, fireplace chase, mantel, or electrical insert. The five new catalog scenarios have no owner-supplied visual references at all. Every overall value is therefore an editable visual-study default and must be replaced by customer measurements or a verified field survey before fabrication use.

The paired views identified as IMG_6777 and IMG_6778 are currently interpreted as the deep/offset-alcove reference, but they may be oblique documentation related to IMG_6768; that relationship remains unresolved. Replace study defaults in `src/model/config.ts` when verified information is supplied. Do not change the shared cabinet construction rules merely to force a fit.

Customer measurement capture and selectable bookcase design families are logical future phases, but neither belongs in the current scenario-catalog implementation.
