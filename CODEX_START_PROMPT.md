# Ready-to-paste Codex prompt

Work in the repository **`ZimaP/fireplace-bookcases-3d`**. This is a completely new standalone project for a highly detailed parametric Three.js model of two built-in bookcases flanking a fireplace inside the supplied room layout.

Do not inspect, copy, import, imitate, or reuse anything from `jq2`, `jq-bookcases`, John/JQ projects, or any other repository. Use only this repository and its two supplied reference images.

Before editing, read `AGENTS.md`, `PROJECT_STATUS.md`, `CODEX_HANDOFF.md`, `MODEL_SPEC.md`, `README.md`, and inspect both images under `reference/`. Treat the images as the primary visual source of truth.

Take the current baseline to a reliable, visually polished, shareable v1:

1. Run `npm ci` and `npm run verify`. Fix every install, TypeScript, runtime, or production-build issue before visual refinement.
2. Launch the app at a desktop viewport around 1440 × 900 and inspect hero/room, front, and plan views. Compare the front model to the bookcase drawing and the room view to the room-layout image.
3. Preserve the drawing-derived construction logic. Overall room, bookcase, and fireplace dimensions may change, but fixed construction values must not scale or appear as ordinary end-user controls: 3/4 in carcass, 1/4 in back, 1-1/2 in face frames, 3/4 in doors, 1-1/4 in fixed transition shelf, 5 mm pins, 2 in pin spacing, and 3/4 in minimum filler.
4. Make adjustable shelf thickness automatic from clear bay span: 1 in through 27 in, 1-1/4 in through 31 in, 1-1/2 in through 36 in, and a clear support warning above 36 in.
5. Keep two upper bays and four lower Shaker doors on each bookcase. Preserve fillers, face frames, finished backs, toe kick, levelers, fixed/adjustable shelves, shelf-pin rows, hardware, transition top, and crown/top filler.
6. Improve proportions, geometry, materials, lighting, shadows, edge definition, camera framing, and depth only where supported by the references or clearly needed for a high-quality architectural presentation.
7. Keep left and right overall bookcase widths independently editable while sharing the same construction formulas.
8. Test minimum, default, maximum, near-full-wall, and over-36-in shelf-span configurations. Prevent overlap, negative clear openings, clipping, disappearing parts, and broken proportions.
9. Keep the interface desktop-only and simple. The model is the priority. Preserve useful dimension controls, camera presets, URL share state, part inspection, and PNG export.
10. Save updated hero and front review screenshots under `docs/`.
11. Run `npm run verify` after all changes. Update `PROJECT_STATUS.md` with verified behavior, assumptions, remaining issues, and the next recommended task.
12. Keep the included GitHub Pages workflow working. Confirm the actual public page loads and renders before reporting deployment complete.

Use the branch/worktree supplied by Codex. At the end, provide a concise change summary, tests and visual checks performed, remaining dimensional assumptions, commit or PR reference, and the verified public Pages URL. If repository creation or push is blocked by permissions, identify that exact blocker and give the owner one precise action; do not claim the deployment succeeded.
