import { wrap } from "@hpcc-js/esbuild-plugins/sfx-wrapper";

try {
    console.log(await wrap(process.argv[2]));
} catch (e) {
    console.error(`Error:  ${e?.message} \n`);
}
