# Aivora Supply Radar agent rules

- Preserve the independence of `Aivora-Supply-Radar`; it may read public AI Daily artifacts but must never trigger or block the AI Daily pipeline.
- Treat `origin/main` and the deployed site as release baselines. Do not overwrite unrelated dirty work.
- Run npm, Node, Wrangler, Playwright, browser, build, and test commands through `project-cache-hygiene` so process-scoped temporary files stay under `D:\CodexCache`.
- Do not print, commit, or log GitHub, Cloudflare, admin, or test-trigger secrets.
- Do not weaken source verification to fill catalog counts. Preserve original names, URLs, timestamps, and status.
- Public source fetches must remain HTTPS-only, size-bounded, timeout-bounded, and protected from private-network redirects.
- A source, image, opportunity, community, or single offer failure must degrade independently and must not make verified catalog data unavailable.
- Before release, run lint, typecheck, full tests, content checks, seed dry-run, production build, and desktop/mobile light/dark visual checks.
