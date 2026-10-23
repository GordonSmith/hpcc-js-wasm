---
name: implement-spec
description: "Make a failing acceptance scenario pass and mark its spec implemented. Use after /spec-to-test, to implement a spec ID."
---

# Implement spec

Follow [spec-driven.instructions.md](../../instructions/spec-driven.instructions.md) and the
repository's build guidance in [copilot-instructions.md](../../copilot-instructions.md).

Spec ID(s): provided by the user (for example GV-RENDER-010); if missing, ask for it

1. Read the spec(s) and their scenarios. Run them and confirm they fail, so that you start
   from red.
2. Make the smallest change to the package (`packages/<package>/src`, or `src-cpp` when
   necessary) that satisfies the spec. Do not change the scenario to fit the code; if the spec
   is wrong, go back to `/new-spec`.
3. Rebuild the system under test: `cd packages/<package> && npm run build`. A C++ change
   needs `npm run build-cpp` first; see the vcpkg rebuild notes when a port changed.
4. Run the acceptance scenarios on **every** driver:
   `cd tests/acceptance && npm run test-node && npm run test-browser`. Then run the package's
   own tests (`cd packages/<package> && npm test`) to catch regressions.
5. Set the spec's status to `implemented`, then run `npm run check-specs` and
   `npm run lint` (in `tests/acceptance` and in the package).
6. Summarise: spec ID, files changed, and test results per driver.
