# Specifications

This folder holds the **specifications** for the packages in this repository. Each spec is
a small, testable statement of observable behaviour. Specs come first: we write or change a
spec, then write an acceptance test that proves it, and then change the code until that test
passes.

## The four layers

The acceptance tests use Dave Farley's four-layer model, which keeps *what* the system should
do separate from *how* the test reaches it:

```
specs/<package>/*.md                      Specs:            requirements with stable IDs
        │  each accepted/implemented ID has ≥1 test case
tests/acceptance/<package>/*.spec.ts      Test cases:       one scenario per spec ID, DSL calls only
        │
tests/acceptance/src/dsl/                 DSL:              domain verbs and assertions; knows nothing of transport
        │
tests/acceptance/src/drivers/<package>/   Protocol drivers: one per way of reaching the system under test
        │
packages/<package>/dist, bin              System under test: the *built* artefacts we ship
```

Rules for each layer:

| Layer | May | Must not |
|-------|-----|----------|
| Test case | Call the DSL; name the spec ID it proves; say which driver capabilities it needs | Import a package, a driver, or `node:*` modules |
| DSL | Supply sensible defaults, hide incidental detail, make assertions | Know which driver it is talking to |
| Driver | Translate a domain request into a call over one channel (import, worker message, process spawn…) | Decide pass/fail for business behaviour |
| System under test | — | Be imported from `src/`; drivers use the built `dist/` or `bin/` output |

Because test cases depend only on the DSL, **the same scenario runs against every driver**
that has the capabilities it needs. One spec therefore covers Node, the browser, Node without
browser globals, and the CLI.

### Graphviz drivers

| Driver | Vitest project | Reaches the system under test via | Capabilities |
|--------|----------------|-----------------------------------|--------------|
| `node-inprocess` | node | `import "@hpcc-js/wasm-graphviz"` | all library capabilities |
| `node-no-globals` | node | `worker_threads`, with `navigator`, `window`, `fetch`, … deleted | all library capabilities |
| `browser` | browser (Playwright/Chromium) | `import` in the page | all library capabilities |
| `cli` | node | spawns `wasm-graphviz-cli` (`packages/graphviz-cli/bin/index.js`) | `layout`, `version`, `yInvert`, `nop`, `cli` |

To run a subset of drivers, set `ACCEPTANCE_DRIVERS` to a comma-separated list, for example
`ACCEPTANCE_DRIVERS=cli,node-inprocess`.

## Spec file format

Each package has a folder (`specs/graphviz/`, `specs/graphviz-cli/`, …) containing one Markdown
file per functional area. Each spec in a file looks like this:

```md
### GV-RENDER-001: Default render is SVG produced by the dot engine

Status: implemented

When DOT source is rendered without an explicit format or engine,
the result is an SVG document laid out by the `dot` engine.

Example: `digraph { a -> b }` → output contains `<svg` and both node ids.
```

* **ID**: `<PKG>-<AREA>-<NNN>`, for example `GV-RENDER-001` or `GVCLI-ERR-002`. IDs are
  permanent. Never renumber or reuse one; retire it instead.
* **Status**: one of
  * `draft`: proposed and under discussion. Test cases are optional.
  * `accepted`: agreed. It must have at least one test case, which may fail until it is
    implemented.
  * `implemented`: it must have at least one passing test case.
  * `retired`: no longer applies. It must have no test cases.
* **Statement**: describe observable behaviour from the user's point of view: inputs and
  outputs, not internals.
* **Example** (optional): a concrete input and output that pins down the behaviour.

## Traceability

`npm run check-specs` (also part of `npm run lint`) runs
[`scripts/check-spec-coverage.mjs`](../scripts/check-spec-coverage.mjs) and fails when:

* an `accepted` or `implemented` spec has no test case,
* a test case refers to an ID that is not in any spec,
* a `retired` spec still has test cases, or
* an ID is defined twice or has a missing or invalid status.

Test cases name their spec in the first argument of `scenario("GV-RENDER-001", ...)`.

## The loop

1. **Spec**: add or change a spec (status `draft`, then `accepted`). Copilot skill:
   `/new-spec`.
2. **Failing test**: add a scenario to `tests/acceptance/<package>/` that uses only the DSL.
   Extend the DSL or drivers only as far as the spec needs, then watch the test fail.
   Copilot skill: `/spec-to-test`.
3. **Implement**: change the package until the scenario passes on every applicable driver,
   then set the status to `implemented`. Copilot skill: `/implement-spec`.

## Running

```bash
npm run build-ws                       # the system under test is the built output
npm run check-specs                    # traceability only (no build needed)
npm run test-acceptance                # all drivers (node + browser projects)

cd tests/acceptance
npm run test-node                      # node-inprocess, node-no-globals and cli
npm run test-browser                   # browser
ACCEPTANCE_DRIVERS=cli npm run test-node   # a single driver
```

## Onboarding another package

1. Create `specs/<package>/` and capture its current behaviour as `implemented` specs. Start
   from the package README and its existing tests.
2. In `tests/acceptance/src/drivers/<package>/`, define a driver interface, its capabilities,
   and a driver per channel. The graphviz `executor.mjs`, `node-no-globals` worker and `cli`
   driver are the templates to copy.
3. Add `tests/acceptance/src/dsl/<package>.ts`, plus a runner modelled on
   `forEachGraphvizDriver`.
4. Write the scenarios and run `npm run check-specs`.

`util` is also onboarded: its shared Node and browser scenarios run against the built
`@hpcc-js/wasm-util` entry point, with a Node no-globals driver for import compatibility.
Good next candidates are `zstd` and `base91`, which have small APIs and already have Node,
browser, worker and no-globals channels. The planned next drivers are `web-worker` (browser
`Worker`) and `bundlers` (webpack, rollup and esbuild outputs from `tests/bundlers`).

## Relationship to the existing tests

The `packages/*/tests` suites stay as they are. They are the unit and integration tier and
may reach into internals. The acceptance suite is the executable form of these specs and
only goes through the public, built interface.
