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
13. `src/customer-experience.css`

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
- `src/ui/controls.ts`: four-step homeowner workflow, room catalog, measurement controls, finish selection, status panels, and optional fine-tuning.
- `src/customer-experience.css`: desktop customer-planner visual layer applied after the baseline application styles.

## Current published planner state

- The published site uses four customer steps: **Design**, **Room**, **Measure**, and **Finish**.
- One bookcase family is currently available: **Classic Shaker built-in**. Do not imply that future families exist until each has approved geometry and construction logic.
- The Room step exposes ten scenarios and only the placement choices valid for the selected scenario.
- The Measure step asks for layout-relevant dimensions plus finished bookcase height. Window and door opening widths exclude trim because the model adds separate casing.
- Number fields commit on blur or Enter, then active bookcase widths fit to the selected opening. Fixed construction values never scale.
- The Finish step provides four presentation colors, a design review, sharing, and PNG saving. Detailed model controls remain under **Fine-tune your design**.
- Review screens are under `docs/homeowner-planner-*.png`. Full local and live verification is recorded at the top of `PROJECT_STATUS.md`.
- The homeowner planner is published on `main` and live-browser-verified at `https://zimap.github.io/fireplace-bookcases-3d/`.

## Next Codex mission

1. Run `npm ci` and `npm run verify` before modifying the verified baseline.
2. Inspect the owner references before changing geometry or construction behavior.
3. Review the published four-step flow and `docs/homeowner-planner-*.png` with the owner.
4. The next product phase should either extend Measure into a photo/obstacle/verification workflow or add a genuinely modeled second bookcase family.
5. Do not present placeholder design cards as available products; every new family needs approved geometry, construction logic, copy, and verification.
6. Keep recording every merged release, Pages workflow, and live-browser verification in `PROJECT_STATUS.md`.

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
