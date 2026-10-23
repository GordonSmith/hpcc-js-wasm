---
name: spec-to-test
description: "Turn an accepted spec into a failing acceptance scenario (test case -> DSL -> protocol driver). Use after /new-spec, when a spec ID needs an acceptance test."
---

# Spec to failing test

Follow [spec-driven.instructions.md](../../instructions/spec-driven.instructions.md).

Spec ID(s): provided by the user (for example GV-RENDER-010); if missing, ask for it

1. Read the spec(s) in `specs/**`. They must be `accepted`. If one is still `draft`, stop
   and ask.
2. Add one `scenario("<ID>", "<title>", [capabilities], async gv => …)` per spec to the
   matching file in `tests/acceptance/<package>/`. Library behaviour goes through
   `forEachGraphvizDriver`. CLI-only behaviour goes through `forGraphvizCli` in a
   `*.node.spec.ts` file. Write the scenario as **what**, using DSL verbs only.
3. If the DSL has no verb or assertion for this yet, add the smallest one to `src/dsl/`. If
   the drivers cannot carry the request yet, extend `driver.ts` (operation and/or capability),
   `executor.mjs`, and `cli.ts` where it applies. Drivers translate; they do not assert.
4. Run the scenario and **confirm it fails for the right reason**, meaning the behaviour is
   missing, not a broken harness:
   `cd tests/acceptance && npx vitest run --project node -t "<ID>"`, and `--project browser`
   when the scenario applies there.
5. Run `npm run check-specs` and `cd tests/acceptance && npm run lint`.
6. Do **not** change the package implementation in this step. Report the failing output.
