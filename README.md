# @hpcc-js/wasm

[![Build Status](https://travis-ci.org/hpcc-systems/hpcc-js-wasm.svg?branch=master)](https://travis-ci.org/hpcc-systems/hpcc-js-wasm)

This repository contains a collection of useful c++ libraries compiled to WASM for (re)use in Web Browsers and JavaScript Libraries.

## Installation 
The simplest way to include this project is via NPM:
```
npm install --save @hpcc-js/wasm
```

## Contents
@hpcc-js/wasm includes the following files in its `dist` folder:
* `index.js` / `index.min.js` files:  Exposes _all_ the available APIs for all WASM files.
* WASM Files:
    * `graphvizlib.wasm`
    * ...more to follow...

**Important**:  WASM files are dynamically loaded at runtime (this is a browser / emscripten requirement), which has a few implications for the consumer:  

**Pros**:
* While this package has potentially many large WASM files, only the ones being used will ever be downloaded from your CDN / Web Server.

**Cons**:
* Most browsers don't support `fetch` and loading pages via `file://` URN, so for testing / development work you will need to run a test web server.
* Bundlers (RollupJS / WebPack) will ignore the WASM files, so you will need to manually ensure they are present in your final distribution (typically they are placed in the same folder as the bundled JS)

## Quick Example (CDN hosting courtesy of [unpkg.com](https://unpkg.com))
```html
<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title>GraphViz WASM</title>
    <script src="https://unpkg.com/@hpcc-js/wasm/dist/index.min.js"></script>
    <script>
        var hpccWasm = window["@hpcc-js/wasm"];
    </script>
</head>

<body>
    <div id="placeholder"></div>
    <script>
        const dot = `
            digraph G {
                node [shape=rect];

                subgraph cluster_0 {
                    style=filled;
                    color=lightgrey;
                    node [style=filled,color=white];
                    a0 -> a1 -> a2 -> a3;
                    label = "process #1";
                }

                subgraph cluster_1 {
                    node [style=filled];
                    b0 -> b1 -> b2 -> b3;
                    label = "process #2";
                    color=blue
                }

                start -> a0;
                start -> b0;
                a1 -> b3;
                b2 -> a3;
                a3 -> a0;
                a3 -> end;
                b3 -> end;

                start [shape=Mdiamond];
                end [shape=Msquare];
            }
        `;

        hpccWasm.graphviz.layout(dot, "svg", "dot").then(svg => {
            const div = document.getElementById("placeholder");
            div.innerHTML = svg;
        });
    </script>

</body>

</html>
```

## API Reference
* [Common](#common)
* [GraphViz](#graphviz)

### Common
Utility functions relating to @hpcc-js/wasm as a package

[#](#wasmFolder) **wasmFolder**([_url_]) · [Source](https://github.com/hpcc-systems/hpcc-js-wasm/blob/master/src/util.ts)

<a name="wasmFolder" href="#wasmFolder">#</a> <b>wasmFolder</b>([<i>url</i>]) · [Source](https://github.com/hpcc-systems/hpcc-js-wasm/blob/master/src/util.ts)

If _url_ is specified, sets the default location for all WASM files.  If _url_ is not specified it returns the current _url_ (defaults to `undefined`).

<a name="__hpcc_wasmFolder" href="#__hpcc_wasmFolder">#</a> <b>__hpcc_wasmFolder</b> · [Source](https://github.com/hpcc-systems/hpcc-js-wasm/blob/master/src/util.ts)

Global variable for setting default WASM location, this is an alternative to [wasmFolder](#wasmFolder)

### GraphViz (namespace `graphviz`)
GraphViz WASM library, see [graphviz.org](https://www.graphviz.org/) for c++ details.  While this package is similar to [Viz.js](https://github.com/mdaines/viz.js), it employs a completely different build methodology taken from [GraphControl](https://github.com/hpcc-systems/GraphControl).

<a name="layout" href="#layout">#</a> **layout**(_dotSource_[, _outputFormat_][, _layoutEngine_]) · [Source](https://github.com/hpcc-systems/hpcc-js-wasm/blob/master/src/graphviz.ts)

Performs layout for the supplied _dotSource_, see [The DOT Language](https://graphviz.gitlab.io/_pages/doc/info/lang.html) for specification.

_outputFormat_ supports the following options:
* dot
* dot_json
* json
* svg (default)
* xdot_json

See [Output Formats](https://graphviz.gitlab.io/_pages/doc/info/output.html) for more information.

_layoutEngine_ supports the following options:
* circo
* dot (default)
* fdp
* neato
* osage
* patchwork
* twopi

See [Layout manual pages](https://www.graphviz.org/documentation/) for more information.

<a name="circo" href="#circo">#</a> <b>circo</b>(<i>dotSource</i>[, <i>outputFormat</i>]) · [Source](https://github.com/hpcc-systems/hpcc-js-wasm/blob/master/src/graphviz.ts)

Convenience function that performs **circo** layout, is equivalent to `layout(dotSource, outputFormat, "circo");`

<a name="dot" href="#dot">#</a> <b>dot</b>(<i>dotSource</i>[, <i>outputFormat</i>]) · [Source](https://github.com/hpcc-systems/hpcc-js-wasm/blob/master/src/graphviz.ts)

Convenience function that performs **dot** layout, is equivalent to `layout(dotSource, outputFormat, "dot");`

<a name="fdp" href="#fdp">#</a> <b>fdp</b>(<i>dotSource</i>[, <i>outputFormat</i>]) · [Source](https://github.com/hpcc-systems/hpcc-js-wasm/blob/master/src/graphviz.ts)

Convenience function that performs **circo** layout, is equivalent to `layout(dotSource, outputFormat, "fdp");`

<a name="neato" href="#neato">#</a> <b>neato</b>(<i>dotSource</i>[, <i>outputFormat</i>]) · [Source](https://github.com/hpcc-systems/hpcc-js-wasm/blob/master/src/graphviz.ts)

Convenience function that performs **neato** layout, is equivalent to `layout(dotSource, outputFormat, "neato");`

<a name="osage" href="#osage">#</a> <b>osage</b>(<i>dotSource</i>[, <i>outputFormat</i>]) · [Source](https://github.com/hpcc-systems/hpcc-js-wasm/blob/master/src/graphviz.ts)

Convenience function that performs **osage** layout, is equivalent to `layout(dotSource, outputFormat, "osage");`

<a name="patchwork" href="#patchwork">#</a> <b>patchwork</b>(<i>dotSource</i>[, <i>outputFormat</i>]) · [Source](https://github.com/hpcc-systems/hpcc-js-wasm/blob/master/src/graphviz.ts)

Convenience function that performs **patchwork** layout, is equivalent to `layout(dotSource, outputFormat, "patchwork");`

<a name="twopi" href="#twopi">#</a> <b>twopi</b>(<i>dotSource</i>[, <i>outputFormat</i>]) · [Source](https://github.com/hpcc-systems/hpcc-js-wasm/blob/master/src/graphviz.ts)

Convenience function that performs **twopi** layout, is equivalent to `layout(dotSource, outputFormat, "twopi");`

## Building @hpcc-js/wasm
_Building is supported on both Linux (Ubuntu 18.04) and Windows (with WSL installed)_

Build steps:
```
git clone https://github.com/hpcc-systems/hpcc-js-wasm.git
cd hpcc-js-wasm
npm ci
npm run install-build-deps
npm run build
```

**Note**: The `install-build-deps` calls `apt install` for several packages, you may want to review:  [scripts/cpp-install-prerequisites.sh](./scripts/cpp-install-prerequisites.sh) before proceeding.
