import process from "process";
import { FlatC } from "@hpcc-js/wasm-flatc";
import { hostExists, hostToWasm } from "@hpcc-js/wasm-utils/node";

async function main() {
    const flatc = await FlatC.load();
    const args = await Promise.all(process.argv.slice(2).map(async arg => {
        if (hostExists(arg)) {
            return await hostToWasm(arg, arg, flatc._module);
        }
        return arg;
    }));
    const [int, retVal] = flatc.main(args)
    console.log(int, retVal);
}

await main();