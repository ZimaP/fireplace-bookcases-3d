# GitHub + Codex setup

## Target

- GitHub owner: `ZimaP`
- New repository: `fireplace-bookcases-3d`
- Recommended visibility: public, because the owner wants a shareable GitHub Pages link.
- Default branch: `main`

## Publish the prepared local Git repository

Create an empty repository with the exact name `fireplace-bookcases-3d`. Do not initialize it with a README, license, or `.gitignore`, because this project already contains them.

From the project folder:

```bash
git remote add origin https://github.com/ZimaP/fireplace-bookcases-3d.git
git push -u origin main
```

A portable Git bundle is also included in the transfer package. It can be restored with:

```bash
git clone fireplace-bookcases-3d-codex-transfer.bundle fireplace-bookcases-3d
cd fireplace-bookcases-3d
git remote add origin https://github.com/ZimaP/fireplace-bookcases-3d.git
git push -u origin main
```

## Enable the live site

Open **Settings → Pages**, choose **GitHub Actions** as the source, and run or re-run the `Build and deploy GitHub Pages` workflow.

The expected address is:

```text
https://zimap.github.io/fireplace-bookcases-3d/
```

Treat it as an expected address only. Deployment is complete only after the page loads and the Three.js model renders.

## Connect it to Codex

1. Open Codex and sign in with the same ChatGPT account.
2. Connect GitHub if it is not already connected.
3. Create or select an environment for `ZimaP/fireplace-bookcases-3d`.
4. Paste the contents of `CODEX_START_PROMPT.md` into a Code task.
5. Let Codex work in its supplied worktree/branch and open a PR when available.
6. Keep `PROJECT_STATUS.md` updated so ChatGPT and Codex share context.

A newly created or private repository may require repository access to be enabled in the ChatGPT GitHub app before it appears in Codex.
