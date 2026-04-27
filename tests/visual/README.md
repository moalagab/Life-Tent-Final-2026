# Dashboard RTL Visual Regression

Scaffold using **Playwright** to catch layout/breakpoint regressions on the
RTL dashboard across mobile / tablet / desktop and the three layout presets
(Focus, Finance, Execution).

## Install

```bash
bun add -D @playwright/test
bunx playwright install --with-deps
```

## Run locally

1. Start the app: `bun run dev` (default `http://localhost:8080`)
2. Capture a logged-in storage state once:
   ```bash
   bunx playwright codegen http://localhost:8080
   # after logging in:  File → Save Storage State → tests/visual/.auth.json
   ```
3. Generate baseline screenshots:
   ```bash
   TEST_STORAGE_STATE=tests/visual/.auth.json \
     bunx playwright test --update-snapshots
   ```
4. Future runs:
   ```bash
   TEST_STORAGE_STATE=tests/visual/.auth.json bunx playwright test
   ```

## Run in CI

```yaml
# .github/workflows/visual.yml (example)
- run: bun install
- run: bunx playwright install --with-deps
- run: bunx playwright test
  env:
    BASE_URL: ${{ secrets.PREVIEW_URL }}
    TEST_STORAGE_STATE: ${{ secrets.PW_STORAGE_STATE_PATH }}
```

If `TEST_STORAGE_STATE` is not set, the suite will skip auth-protected
tests rather than fail on the login screen.

## Projects (breakpoints × theme)

| Project          | Viewport            | Scheme |
| ---------------- | ------------------- | ------ |
| `mobile-rtl`     | iPhone 13           | dark   |
| `tablet-rtl`     | iPad (gen 7)        | dark   |
| `desktop-rtl`    | 1440 × 900          | dark   |
| `mobile-light`   | iPhone 13           | light  |
| `tablet-light`   | iPad (gen 7)        | light  |
| `desktop-light`  | 1440 × 900          | light  |

All projects force `locale=ar-SA` and `dir=rtl` on `<html>` before render.

## Specs

- `dashboard-rtl.spec.ts` — full dashboard, three presets, dark mode (×3 sizes).
- `dashboard-light.spec.ts` — Dashboard / KPI strip / Today's Rhythm widgets,
  forced light mode (×3 sizes). Skipped automatically on `*-rtl` projects.

## Updating baselines after intentional theme changes

```bash
TEST_STORAGE_STATE=tests/visual/.auth.json \
  bunx playwright test tests/visual/dashboard-light.spec.ts \
  --project=desktop-light --project=tablet-light --project=mobile-light \
  --update-snapshots
```

