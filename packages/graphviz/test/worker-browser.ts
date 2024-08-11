import { Graphviz } from "@hpcc-js/wasm-graphviz";

onmessage = async function (e) {
    let graphviz = await Graphviz.load();
    let v = graphviz.version();
    Graphviz.unload();
    postMessage(e.data + v);
};
