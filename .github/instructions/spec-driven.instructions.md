---
applyTo: "specs/**,tests/acceptance/**,scripts/check-spec-coverage.mjs"
description: "Spec-driven development: specs -> acceptance test cases -> DSL -> protocol drivers -> system under test"
---

# Spec-driven development

The full conventions are in [specs/README.md](../../specs/README.md). Read it before you
change anything under `specs/` or `tests/acceptance/`.

## Non-negotiables

- **Spec first.** Before you change behaviour in a package that has a `specs/<package>/`
  folder, add or update a spec. Give it a new, never-reused ID such as `GV-RENDER-010` and set
  its status to `draft` or `accepted`.
- **One scenario per spec ID**, declared with `scenario("<ID>", "<title>", [capabilities], async gv => …)`.
  The ID must be the first argument so that `scripts/check-spec-coverage.mjs` can find it.
- **Test cases use only the DSL.** Files in `tests/acceptance/<package>/` may import from
  `src/dsl/` and `vitest`. They must never import a package, a driver or a `node:*` module.
- **The DSL is transport-agnostic.** Code in `src/dsl/` uses only the driver interface
  (`driver.ts`). Add assertions here as named, intention-revealing methods, such as
  `shouldContainNodes`.
- **Drivers translate, not judge.** Code in `src/drivers/<package>/` turns a request into a
  call over one channel and returns an `Outcome`. A new behaviour needs a new operation in
  `driver.ts`, an implementation in `executor.mjs` (shared by the in-process and
  `node-no-globals` drivers) and in `cli.ts` if the CLI supports it, plus a capability flag
  if not every driver can do it.
- **The system under test is built output.** Drivers import `@hpcc-js/wasm-<package>`
  (`dist/`) or spawn its `bin/`, never `src/`. Rebuild (`npm run build-ws`, or the package's
  `npm run build`) before running the acceptance tests.
- **Grow the DSL only when a spec needs it.** Don't add speculative verbs.
- **Status follows evidence.** A spec becomes `implemented` only when its scenario passes on
  every driver that has the capabilities it needs. Mark a spec `retired` instead of deleting
  it, and delete its scenarios.

## Commands

```bash
npm run check-specs                                  # traceability (fast, no build)
cd tests/acceptance && npm run test-node             # node-inprocess, node-no-globals, cli
cd tests/acceptance && npm run test-browser          # browser driver
cd tests/acceptance && ACCEPTANCE_DRIVERS=cli npm run test-node
cd tests/acceptance && npm run lint                  # eslint + check-specs (runs in CI before the build)
cd tests/acceptance && npm run lint-types            # tsc type-check (needs the built packages' types/)
```

## Skills (`.github/skills/`)

- `/new-spec`: draft a spec from a feature request or bug report.
- `/spec-to-test`: turn an accepted spec into a failing acceptance scenario.
- `/implement-spec`: make the scenario pass and mark the spec implemented.
