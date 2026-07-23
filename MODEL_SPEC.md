# Model specification and drawing mapping

## Scope

This repository contains only the supplied room-layout and fireplace-bookcase study. It does not inherit code, components, naming, layouts, or assets from any earlier project. The model is created procedurally in Three.js and rebuilds from a single parameter state.

## Coordinate system and units

- All model dimensions are inches.
- X = left/right across the fireplace wall.
- Y = vertical from finished floor.
- Z = projection into the room from the back-wall finish plane.

## Room-layout presets and installation targets

The same cabinet generator is placed into five selectable room studies:

| Layout | Placement targets | Opening used for fit |
|---|---|---|
| Fireplace wall | Paired units flanking the fireplace | Left and right spans between the chimney gap and side walls |
| Straight wall | Left, centered, or right | Editable wall study span anchored at the selected position |
| Window wall | Left of window, right of window, or both | Side-wall spans outside the window casing and center gap |
| Center niche | Centered in niche | Editable niche clear width |
| Deep/offset alcove | Centered on rear wall | Editable alcove clear width |

Changing the layout applies its room defaults and normalizes the placement target. **Fit selected opening** changes only the width of each active bookcase, rounding down to the nearest 1/8 inch so geometry never exceeds the target opening. The drawing-controlled construction values below remain unchanged.

Editable layout-study inputs are room width, depth, and height; straight-wall study-span width; window width, height, and sill height; niche clear width and recess depth; alcove clear width and depth; and the fireplace chimney width and projection. These values are presentation assumptions, not drawing-derived fabrication dimensions.

## Bookcase construction

Each left/right assembly contains:

1. **One outboard field-fit filler** per bookcase. Each assembly uses finished base and upper filler faces over a full-height unfinished plywood backer. The drawing establishes a 3/4-inch minimum finished filler width; the study defaults to 1-1/2 inches.
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

Overall room, bookcase, and fireplace dimensions may change. Carcass thickness, back thickness, face-frame width, door thickness, pin diameter, and pin spacing do not scale with those changes.

## Fireplace assembly

- Full-height projected chimney breast.
- Recessed firebox with a light herringbone field.
- Painted classical surround with a low projecting hearth slab.
- Layered mantel shelf, paneled pilasters with repeated oval reliefs, and a relief-panel frieze with rosettes, medallions, ribbed center detail, and sunburst.
- Recessed metal electric insert with frame, glass, grate, logs, embers, restrained flame elements, and flickering light.

## Room shell

- Finished wood floor generated from a procedural plank texture.
- Layout-specific back walls and side returns based on the supplied room images.
- Straight-wall study span, centered divided-light window, recessed center niche, or deep U-shaped alcove geometry according to the active preset.
- Baseboard and ceiling datum.
- Room shell can be hidden for unobstructed inspection.

## Interface behavior

- Desktop-only control panel.
- Room-layout and placement-target selectors with only the relevant study dimensions exposed for each preset.
- Overall room, bookcase, and fireplace controls.
- Fit-to-opening for the active single or paired bookcase installation.
- Automatic clamping where parameters depend on one another.
- Live calculated clear span, derived shelf thickness, fit result, and design warnings.
- Presentation finish choices.
- Hero, front, plan, and room camera views.
- Dimension labels, shelf-pin display, room shell, hardware, fire, and ceiling toggles.
- PNG capture and URL-based share state.

## Current scope boundary

The references do not contain a complete dimension schedule for any room shell, wall opening, window, niche, alcove, overall bookcase width/height, fireplace chase, mantel, or electrical insert. Every such overall value is an editable visual-study default. The supplied views identified as IMG_6777 and IMG_6778 are currently interpreted as the paired deep/offset-alcove reference, but they may be oblique documentation related to IMG_6768; that relationship remains unresolved. Replace study defaults in `src/model/config.ts` when verified field dimensions or a dimensioned plan/elevation are supplied; do not change the shared cabinet construction rules merely to force a fit.
