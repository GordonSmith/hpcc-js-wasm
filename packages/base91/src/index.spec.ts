import { expect } from "chai";
import { decode, encode, load } from "./index";
const fs = require("fs/promises");

describe("base91", function () {

    // it("encode/decode", async function () {
    //     const str = "The\tquick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.";
    //     const b91 = await encode(str, "./dist");
    //     expect(b91.length).to.be.greaterThan(0);
    //     expect(b91.length).to.be.greaterThan(str.length);
    //     const str2 = await decode(b91, "./dist");
    //     expect(str2).to.equal(str);
    //     console.log(str);
    //     console.log(b91);
    //     console.log(str2);
    // });

    it("encode file", async function () {
        const module: any = await load("./dist");
        //        expect(module.lerp(1, 2, 3)).to.be.equal(4);
        const d1 = await fs.readFile("./dist/base91.wasm");

        const str = "Hello and Welcome!";
        // const d1 = new Uint8Array(Array.from(str).map(c => c.charCodeAt(0)));
        const s1 = await encode(d1, "./dist");
        const d2 = await decode(s1, "./dist");
        expect(d2).to.deep.equal(Array.from(d1));

        console.log(module.test(">OwJh>eGlTztI8KmarLgZ"));


        const encStr = ">OwJh>eGlTztI8KmarLgZ";
        const xxx = await decode(encStr);
        console.log(xxx.map(x => String.fromCharCode(x)).join(""));
        console.log(module.test(encStr));

        const data = Array.from("He").map(c => c.charCodeAt(0));

        const vec = module.uint8ArrayToVector([] as any);
        vec.push_back(data[0]);
        vec.push_back(data[1]);
        vec.push_back(0);
        const enc = module.encode(vec);
        console.log(enc);



        // const data = new Uint8Array([49, 50]);
        // const vec = module.uint8ArrayToVector(data as any);
        // const data2 = module.uint8VectorToArray(vec);
        // expect(data2).to.deep.equal(Array.from(data));
        // const dataB = Array.from("He").map(c => c.charCodeAt(0));
        // const vecB = module.uint8ArrayToVector(dataB as any);
        // const dataB2 = module.uint8VectorToArray(vecB);
        // // expect(dataB2).to.deep.equal(Array.from(dataB));
        // // const test = await decode("xJ,Jc,|LK!90+NG");
        // // console.log(test.map(x => String.fromCharCode(x)).join(""));

        // const b91 = await encode(data, "./dist");
        // const b91B = await encode(dataB as any, "./dist");
        // expect(b91).to.equal(b91B);
        // // console.log(b91);
        // // expect(b91.length).to.be.greaterThan(0);
        // // expect(b91.length).to.be.greaterThan(data.length);
        // const data3 = await decode(b91, "./dist");
        // expect(data3).to.deep.equal(Array.from(data));
    });
});
