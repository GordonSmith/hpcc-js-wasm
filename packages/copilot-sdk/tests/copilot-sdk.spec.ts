import { describe, it, expect } from "vitest";
import { CopilotSdk } from "@hpcc-js/wasm-copilot-sdk";

describe("copilotSdk", function () {

    it("unload resets singleton and is idempotent", async function () {
        await CopilotSdk.unload();

        const base91a = await CopilotSdk.load();
        expect(await CopilotSdk.load()).to.equal(base91a);

        await CopilotSdk.unload();

        const base91b = await CopilotSdk.load();
        expect(base91b).to.not.equal(base91a);
        expect(await CopilotSdk.load()).to.equal(base91b);

        await CopilotSdk.unload();
        await CopilotSdk.unload();
    });

    it("version", async function () {
        let copilotSdk = await CopilotSdk.load();
        expect(await CopilotSdk.load()).to.equal(copilotSdk);
        let v = copilotSdk.version();
        expect(v).to.be.a.string;
        expect(v).to.equal("1.0.0");
        console.log("copilotSdk version: " + v);
        await CopilotSdk.unload();

        copilotSdk = await CopilotSdk.load();
        expect(await CopilotSdk.load()).to.equal(copilotSdk);
        v = copilotSdk.version();
        expect(v).to.be.a.string;
        expect(v).to.not.be.empty;
        await CopilotSdk.unload();
    });
});
