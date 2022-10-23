import { interop } from "./util.js";
import { doFetch, scriptDir } from "./fetch-node.js";
interop.doFetch = doFetch;
interop.scriptDir = scriptDir;

export * from "./expat.js";
export * from "./graphviz.js";
export { wasmFolder } from "./util.js";
