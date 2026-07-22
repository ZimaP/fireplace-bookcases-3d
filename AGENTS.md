# AGENTS.md — Fireplace Bookcases 3D

These instructions apply to every coding agent working in this repository, including Codex.

## Project identity and boundary

- Repository name: `fireplace-bookcases-3d`.
- This is a completely new, standalone project.
- Work only inside this repository.
- Do **not** inspect, copy, import, imitate, or reuse code, geometry, assets, naming, or UI from `jq2`, `jq-bookcases`, John/JQ projects, or any other existing repository unless the owner explicitly changes this rule in writing.
- Scope is a desktop web-based, highly detailed, parametric 3D model of the supplied fireplace wall, two flanking bookcases, and enough room shell to communicate the installation.
- Do not create a separate mobile version. Protect the desktop visual experience first.

## Source of truth

Read these before modifying geometry or behavior:

1. `reference/bookcase-detail-drawing.png`
2. `reference/room-fireplace-layout.jpg`
3. `MODEL_SPEC.md`
4. `PROJECT_STATUS.md`
5. `CODEX_HANDOFF.md`
6. `src/model/config.ts`

The drawing controls construction details. The room image controls the overall spatial composition. Overall dimensions not shown in the references are study assumptions and must remain clearly labeled as editable assumptions.

## Non-negotiable modeling rules

- Model units are inches.
- X = left/right, Y = vertical, Z = projection into the room.
- Overall room, bookcase, and fireplace dimensions may change parametrically.
- Material and construction thicknesses must **not** scale when an overall dimension changes.
- Preserve the drawing rules:
  - 3/4 in carcass material.
  - 1/4 in finished back.
  - 1-1/2 in face-frame rails and stiles.
  - 3/4 in door thickness.
  - 1-1/4 in fixed transition/counter shelf unless a verified drawing revision says otherwise.
  - 5 mm shelf pins on 2 in vertical centers.
  - 3/4 in minimum field-fit side filler.
  - Clear span up to 27 in: 1 in MDF adjustable shelf.
  - Clear span over 27 through 31 in: 1-1/4 in MDF adjustable shelf.
  - Clear span over 31 through 36 in: 1-1/2 in MDF adjustable shelf.
  - Clear span over 36 in: retain 1-1/2 in shelf geometry and display a clear support/design warning.
- Standard user controls should change overall/layout dimensions, not fixed construction values.
- Resizing must preserve construction logic and report impossible combinations as design warnings.
- Never silently invent fabrication dimensions. Record assumptions in `PROJECT_STATUS.md`.

## Technical rules

- Stack: Vite + TypeScript + Three.js.
- Source files under `src/` must remain TypeScript. Do not create duplicate `.js` versions beside `.ts` source files.
- Keep responsibilities separated:
  - `config.ts`: state, constraints, derived layout, units, URL state.
  - `primitives.ts`: reusable geometry and part metadata.
  - `materials.ts`: visual materials/textures.
  - `room.ts`: room shell.
  - `bookcase.ts`: millwork geometry.
  - `fireplace.ts`: fireplace/mantel geometry and animation.
  - `dimensions.ts`: measurement graphics.
  - `sceneBuilder.ts`: assembly.
  - `controls.ts`: desktop interface.
- Do not replace Three.js or rewrite the architecture without documenting a concrete reason.
- Dispose Three.js geometry, materials, textures, render targets, and DOM labels when rebuilding.
- Keep GitHub Pages compatibility; asset paths must work from a repository subpath.
- Do not commit `node_modules/`, `dist/`, credentials, access tokens, or machine-specific files.

## Visual requirements

- Match the supplied elevation: two upper bays and four lower Shaker doors per bookcase.
- Include field-fit fillers, crown/top filler, fixed and adjustable shelves, face frames, finished backs, toe kick, hardware, and transition top.
- Preserve realistic shadows, material response, crisp edge definition, and readable depth hierarchy.
- The fireplace must remain the central architectural feature and integrate with the supplied room layout.
- Avoid unsupported decorative inventions unless clearly presentation-only and easy to disable.

## Required verification

Run before claiming a code task is complete:

```bash
npm ci
npm run verify
```

For visual changes, also launch the app and inspect at least:

- Front view against the millwork drawing.
- Hero/room perspective against the room-layout reference.
- Minimum and maximum practical bookcase widths.
- A combination above the 36 in shelf-span limit.
- A near-full-wall fit without overlap.
- Desktop viewport near 1440 × 900.

Save a current review screenshot under `docs/` whenever appearance changes materially.

## Git and collaboration

- Use the branch/worktree supplied by the active Codex environment; do not rewrite unrelated history.
- Keep changes focused and reviewable.
- Keep `main` deployable.
- Prefer a pull request for substantial visual or parametric changes.
- PR notes must include what changed, which drawing rule is affected, verification results, screenshots for visual changes, and remaining assumptions.
- Update `PROJECT_STATUS.md` after every substantial task so the owner, ChatGPT, and Codex share the same state.
- Intended remote repository: `ZimaP/fireplace-bookcases-3d`.
- Do not claim the site is deployed until the GitHub Pages URL actually loads and renders the model.
