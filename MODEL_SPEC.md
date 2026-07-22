# Model specification and drawing mapping

## Scope

This repository contains only the fireplace-bookcase room study. It does not inherit code, components, naming, layouts, or assets from any earlier project. The model is created procedurally in Three.js and rebuilds from a single parameter state.

## Coordinate system and units

- All model dimensions are inches.
- X = left/right across the fireplace wall.
- Y = vertical from finished floor.
- Z = projection into the room from the back-wall finish plane.

## Bookcase construction

Each left/right assembly contains:

1. **Finished side fillers** at the outer edges. The drawing establishes a 3/4-inch minimum; the study defaults to 1-1/2 inches.
2. **Base carcass** with 3/4-inch side panels and center divider, 1/4-inch finished back, bottom panel, one shelf per bay, recessed toe-kick panel, and adjustable feet.
3. **Base face frame** with fixed 1-1/2-inch rails and stiles.
4. **Four Shaker doors** with 3/4-inch thickness, recessed center panels, consistent reveals, and paired hardware positions.
5. **1-1/4-inch countertop/transition shelf** with a finished overhang.
6. **Upper carcass** with two bays, 3/4-inch side panels and divider, 1/4-inch back, 1-1/4-inch fixed lower shelf, and fixed top.
7. **Upper face frame** with three fixed 1-1/2-inch stiles and top/bottom rails.
8. **Adjustable shelves** snapped to the 2-inch pin grid.
9. **5 mm shelf-pin rows** at front and rear positions on each bearing side.
10. **Crown/top filler** with a stepped cap and reveal.
11. **Unfinished plywood filler backers** behind the finished side fillers.

## Required adjustable-shelf rule

Clear shelf span is derived from finished overall width after fillers, carcass sides, and center construction are deducted. Adjustable shelf thickness must be selected automatically:

```text
clear span <= 27 in  -> 1 in MDF
clear span <= 31 in  -> 1-1/4 in MDF
clear span <= 36 in  -> 1-1/2 in MDF
clear span > 36 in   -> 1-1/2 in geometry plus support/design warning
```

Overall room, bookcase, and fireplace dimensions may change. Carcass thickness, back thickness, face-frame width, door thickness, pin diameter, and pin spacing do not scale with those changes.

## Fireplace assembly

- Full-height projected chimney breast.
- Herringbone field behind the surround.
- Stone surround and projecting hearth slab.
- Classical mantel with layered shelf/cap, pilasters, fluting, capitals, frieze, and decorative blocks.
- Metal electric insert with frame, glass, grate, logs, embers, flame elements, and flickering light.

## Room shell

- Finished wood floor generated from a procedural plank texture.
- Back wall and partial side returns based on the supplied room-layout image.
- Baseboard and ceiling datum.
- Room shell can be hidden for unobstructed inspection.

## Interface behavior

- Desktop-only control panel.
- Overall room, bookcase, and fireplace controls.
- Automatic clamping where parameters depend on one another.
- Live calculated clear span, derived shelf thickness, fit result, and design warnings.
- Presentation finish choices.
- Hero, front, plan, and room camera views.
- Dimension labels, shelf-pin display, room shell, hardware, fire, and ceiling toggles.
- PNG capture and URL-based share state.

## Current scope boundary

The references do not contain a complete dimension schedule for the room, overall bookcase width/height, fireplace chase, mantel, or electrical insert. Those overall values are editable study defaults. Replace defaults in `src/model/config.ts` when verified field dimensions or a dimensioned elevation are supplied; do not change the construction rules merely to force a fit.
