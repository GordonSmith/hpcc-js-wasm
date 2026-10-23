# Graphviz CLI

Package: `@hpcc-js/wasm-graphviz-cli` (bin: `wasm-graphviz-cli`, also documented as
`dot-wasm`). The rendering behaviour is specified in [../graphviz](../graphviz). The CLI is one
of the drivers for those specs. This file covers behaviour that only the command line has.

### GVCLI-ARGS-001: `-h` / `--help` prints usage

Status: implemented

`--help` (or `-h`) prints the usage text, which starts with `Usage:`, lists the options, and
exits successfully.

### GVCLI-ARGS-002: `-v` prints the Graphviz version

Status: implemented

`-v` prints `GraphViz version:  <major.minor.patch>` and exits successfully.

### GVCLI-ARGS-003: Layout engine and output format are selectable

Status: implemented

`-K <engine>` / `--layout <engine>` selects the layout engine, and `-T <format>` /
`--format <format>` (or `--format=<format>`) selects the output format. The defaults are `dot`
and `svg`. The supported layout engines are `circo`, `dot`, `fdp`, `sfdp`, `neato`, `osage`,
`patchwork`, `twopi`, `nop`, and `nop2`. The supported output formats are `svg`, `dot`, `json`,
`dot_json`, `xdot_json`, `plain`, and `plain-ext`.

### GVCLI-ARGS-004: Neato no-op mode requires the neato layout

Status: accepted

`-n <flag>` or `--neato-no-op <flag>` selects neato's no-op mode when the layout engine is
`neato`. Using either option with another layout engine fails with an error on stderr.

Example: `wasm-graphviz-cli -K neato -n 2 -T plain 'digraph { a -> b }'` runs with neato's
no-op flag set to `2`.

### GVCLI-ARGS-005: Y inversion applies to plain output

Status: accepted

`-y` or `--invert-y` inverts the Y axis in `plain` and `plain-ext` output: increasing Y
coordinates correspond to movement from top to bottom. It does not change the default output
format.

Example: `wasm-graphviz-cli -T plain -y 'digraph { a -> b }'` produces plain output with an
inverted Y axis.

### GVCLI-INPUT-001: The positional argument is a file path or inline DOT

Status: implemented

If the single positional argument names an existing file, the CLI renders that file's
contents. Otherwise the argument itself is treated as DOT source.

### GVCLI-ERR-001: Errors are reported on stderr with usage

Status: implemented

When the CLI cannot complete a request because its input or options are invalid, it writes an
error message beginning with `Error:  ` followed by the usage text to stderr, and writes
nothing to stdout.

### GVCLI-ERR-002: Errors set a non-zero exit code

Status: implemented

When the CLI reports an error (see GVCLI-ERR-001), the process exits with a non-zero exit
code, so that shell scripts and CI pipelines can detect the failure. A successful run exits
with code 0.
