# Codex handoff

## Purpose

Continue the prepared fireplace-bookcase baseline inside one shared GitHub repository. Do not create an unrelated replacement and do not use any prior cabinet/bookcase repository as a reference.

## Required reading order

1. `AGENTS.md`
2. `PROJECT_STATUS.md`
3. `MODEL_SPEC.md`
4. `README.md`
5. Both files under `reference/`
6. `src/model/config.ts`
7. `src/model/sceneBuilder.ts`
8. `src/model/bookcase.ts`
9. `src/model/fireplace.ts`
10. `src/model/room.ts`
11. `src/main.ts`
12. `src/ui/controls.ts`

## Current architecture

- `src/main.ts`: renderer, cameras, controls, selection, rebuild lifecycle, screenshots, URL state.
- `src/model/config.ts`: editable state, clamping, derived layout, dimension formatting, URL serialization.
- `src/model/primitives.ts`: reusable geometry, metadata, edge treatment, cleanup.
- `src/model/materials.ts`: procedural finish materials.
- `src/model/room.ts`: floor, walls, baseboards, and ceiling context.
- `src/model/bookcase.ts`: left/right parametric millwork assemblies.
- `src/model/fireplace.ts`: chimney, surround, mantel, insert, and fire.
- `src/model/dimensions.ts`: measurement lines and labels.
- `src/model/sceneBuilder.ts`: complete scene assembly and lighting.
- `src/ui/controls.ts`: desktop controls and status panels.

## First Codex mission

Perform an evidence-based takeover audit and deliver a reliable, visually polished v1.

1. Run `npm ci` and `npm run verify` before editing.
2. Inspect the two reference images before changing geometry.
3. Launch the desktop app and review hero/room, front, and plan views near 1440 × 900.
4. Lock drawing-derived construction thicknesses so ordinary dimension changes cannot alter or scale them.
5. Derive adjustable shelf thickness automatically from clear span: 1 in through 27 in, 1-1/4 in through 31 in, 1-1/2 in through 36 in, warning above 36 in.
6. Verify left and right overall widths remain independently editable while both use the same construction formulas.
7. Test minimum, default, maximum, near-full-wall, and unsupported-shelf-span configurations.
8. Correct obvious intersections, missing parts, clipping, z-fighting, weak edge definition, bad shelf placement, console errors, URL-state problems, or camera framing.
9. Improve visual fidelity only where supported by the references or clearly needed for architectural presentation.
10. Keep the interface desktop-only and secondary to the model viewport.
11. Save updated review screenshots in `docs/`.
12. Run `npm run verify` again, update `PROJECT_STATUS.md`, and open a focused PR if the environment supports it.

## Deployment mission

After the remote repository exists:

1. Preserve `.github/workflows/deploy-pages.yml`.
2. Confirm Vite assets work from the repository Pages subpath.
3. Deploy the `dist/` artifact through GitHub Actions.
4. Confirm the public page loads and the WebGL model renders.
5. Record the verified live URL in `PROJECT_STATUS.md` and the PR.
6. Never report deployment complete based only on a successful build or expected URL.

## Working agreement

- Codex writes and tests code.
- ChatGPT reviews GitHub commits/PRs, checks construction logic, and prepares subsequent prompts.
- The owner judges visual direction and supplies missing dimensions.
- `PROJECT_STATUS.md` carries state between all three.
