# Graphviz: rendering DOT

Package: `@hpcc-js/wasm-graphviz`. Primary API: `layout(dot, format?, engine?, options?)` and
the per-engine shortcuts (`dot()`, `neato()`, …).

### GV-RENDER-001: Default render is SVG produced by the dot engine

Status: implemented

When DOT source is rendered without an explicit format or engine, the result is an SVG
document laid out by the `dot` engine.

Example: `digraph { a -> b }` produces output that contains `<svg` and an element for each of
`a` and `b`.

### GV-RENDER-002: Every layout engine can render a graph

Status: implemented

Each of the layout engines `circo`, `dot`, `fdp`, `sfdp`, `neato`, `osage`, `patchwork` and
`twopi` renders a simple graph to non-empty SVG.

### GV-RENDER-003: Supported output formats

Status: implemented

A graph can be rendered to each of these formats, and the output has the shape that format
requires:

| Format | Shape |
|--------|-------|
| `svg` | contains `<svg` |
| `dot`, `xdot`, `canon` | DOT text that begins with `digraph` |
| `json`, `dot_json`, `xdot_json` | parses as JSON with a `name` and `directed: true` |
| `plain`, `plain-ext` | lines that begin `graph`, then `node`/`edge` lines, ending with `stop` |

### GV-RENDER-004: Invalid DOT is reported as an error

Status: implemented

Rendering DOT that does not parse fails with an error. The message contains
`syntax error in line` and the line number.

Example: `digraph { a -> }` fails with `syntax error in line 1 …`

### GV-RENDER-005: Empty DOT renders to an empty result

Status: implemented

Rendering an empty string returns an empty string, not an error.

### GV-RENDER-006: The library recovers after an error

Status: implemented

After a render fails because the DOT is invalid, the next render of valid DOT succeeds.

### GV-RENDER-007: `yInvert` flips the Y axis in plain output

Status: implemented

With the `yInvert` option (CLI: `-y`), the Y coordinates in `plain` output are mirrored. A node
that is above another node in the default output is below it in the inverted output.

### GV-RENDER-008: Images can be supplied with explicit dimensions

Status: implemented

An image referenced by a node's `image` attribute can be declared with a path, width and
height through the `images` option. The rendered SVG contains an `<image>` element for that
path, scaled to fit the node.

Example: image `logo.png` at `272px × 92px` produces
`<image xlink:href="logo.png" width="204px" height="69px" …>`.

### GV-RENDER-009: `nop` keeps the positions already given in the input

Status: implemented

With the `neato` engine and `nop` set to `1` (CLI: `-K neato -n 1`), nodes keep the `pos`
attributes they were given instead of being laid out again. A node pinned to the right of
and above another stays to the right of and above it.
