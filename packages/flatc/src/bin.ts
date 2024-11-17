import process from "process";
import { FlatC } from "@hpcc-js/wasm-flatc";

async function main() {
    const flatc = await FlatC.load();
    console.log(process.argv.slice(2));
    const [int, retVal] = flatc.main(process.argv.slice(2))
}

await main();