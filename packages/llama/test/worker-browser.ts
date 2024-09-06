import { expect } from "chai";
import { isEmbeddingResponse, isErrorResponse, type EmbeddingMessage } from "../src/worker-message";

describe("llama-worker", function () {
    it("version", async function () {
    });

    it("test", async function () {
        return new Promise<void>((resolve, reject) => {
            const worker = new Worker("./dist/worker-browser.js");
            worker.onmessage = (e) => {
                if (isEmbeddingResponse(e.data)) {
                    console.log("EmbeddingResponse", e.data.vectors);
                    const embeddings = e.data.vectors;
                    expect(embeddings).to.be.instanceOf(Array);
                    expect(embeddings.length).equals(1);
                    expect(embeddings[0]).to.be.a.instanceOf(Array);
                    expect(embeddings[0].length).to.be.greaterThan(0);
                    expect(embeddings[0][0]).to.be.a("string");
                    resolve();
                } else if (isErrorResponse(e.data)) {
                    console.error("ErrorResponse", e.data.message, e.data.stack);
                    reject();
                }
            };
            const msg: EmbeddingMessage = {
                type: "embedding",
                content: "Hello and Welcome!"
            };
            worker.postMessage(msg);
        });
    });
});
