### UTIL-HEAP-001: Heap helpers preserve byte allocation and view behavior

Status: implemented

`malloc(size)` returns a `HeapU8` with the requested size and an allocated pointer. Calling
`free()` or the allocation's `dispose()` releases that pointer. `dataToHeap()` copies the
input bytes to the heap; `heapView()` returns a view of those live bytes, while
`heapToUint8Array()` returns an independent copy. Zero-length input produces a zero-length
heap view.

Example: Copying `[1, 2, 3]` to the heap and changing the first byte through `heapView()`
changes the heap byte but not a copy previously returned by `heapToUint8Array()`.

Applies to: Node and browser library drivers.

### UTIL-STRING-001: String helpers use UTF-8 byte lengths

Status: implemented

`lengthBytes()` returns the UTF-8 encoded byte length. `stringToHeap()` allocates that length
plus one byte for a null terminator, and `heapToString()` returns the original string.

Example: `lengthBytes("a😀")` returns 5, and a string stored with `stringToHeap()` ends in a
null byte and round-trips through `heapToString()`.

Applies to: Node and browser library drivers.

### UTIL-FS-001: Filesystem helpers detect and forward filesystem operations

Status: implemented

`hasFilesystem()` returns `true` only when all four filesystem functions are available on the
module. `createPath()`, `createDataFile()`, and `preloadFile()` forward their arguments with
the root directory and their documented default flags; `unlink()` forwards the requested
path.

Applies to: Node and browser library drivers.

### UTIL-IMPORT-001: The public entry can load without optional browser globals

Status: implemented

The public `@hpcc-js/wasm-util` entry loads and exposes `MainModuleEx` when optional
browser globals are absent.

Applies to: Node no-globals driver only; this requirement does not need to run in a browser.
