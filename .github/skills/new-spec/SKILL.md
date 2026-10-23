---
name: new-spec
description: "Draft a new spec (or change an existing one) in specs/<package>/ from a feature request or bug report. Use when adding or changing a requirement for a spec-driven package (graphviz, graphviz-cli)."
---

# New spec

Follow [spec-driven.instructions.md](../../instructions/spec-driven.instructions.md) and
[specs/README.md](../../../specs/README.md).

The request is: provided by the user (for example Describe the behaviour you want (feature, bug or change)); if missing, ask for it

1. Find the package and the matching file under `specs/<package>/`. Read the existing specs
   there so you neither duplicate one nor contradict one. If no spec folder exists, stop and
   suggest onboarding the package (see "Onboarding another package" in `specs/README.md`).
2. Write the behaviour as one or more specs, each with:
   - a new ID `<PKG>-<AREA>-<NNN>` (next free number; never reuse one),
   - a one-line title,
   - `Status: draft`,
   - a statement of **observable** behaviour (inputs and outputs, error messages, exit codes)
     from the user's point of view, with no implementation details,
   - a concrete `Example:` where one helps.
3. If the request changes behaviour that an existing spec already describes, edit that spec,
   or mark it `retired` and add a new one. Never renumber.
4. Check which environments and drivers the spec applies to (library, browser, no-globals,
   CLI). If some cannot support it, say so in the spec.
5. List anything that is unclear and ask the user about it. When they agree, set the status
   to `accepted`.
6. Run `npm run check-specs`. Do **not** write tests or implementation in this step.
