import { expect } from "chai";
import { isEmbeddingResponse, isErrorResponse, type EmbeddingMessage } from "../src/worker-message";

describe("llama-worker", function () {
    it("version", async function () {
    });

    it("test", function () {
        this.timeout(1000000);
        return new Promise((resolve, reject) => {
            const workers: Worker[] = [];
            for (let i = 0; i < 10; ++i) {
                workers.push(new Worker("./dist/worker-browser.js"));
                workers[i].onmessage = (e) => {
                    if (isEmbeddingResponse(e.data)) {
                        console.log("EmbeddingResponse", e.data.id);
                        const embeddings = e.data.vectors;
                        expect(embeddings).to.be.instanceOf(Array);
                        expect(embeddings.length).equals(1);
                        expect(embeddings[0]).to.be.a.instanceOf(Array);
                        expect(embeddings[0].length).to.be.greaterThan(0);
                        expect(embeddings[0][0]).to.be.a("number");
                        if (e.data.id === 9) {
                            resolve("done");
                        }
                    } else if (isErrorResponse(e.data)) {
                        console.error("ErrorResponse", e.data.message, e.data.stack);
                        reject(e.data.message);
                    }
                };
            }
            for (let i = 0; i < 10; ++i) {
                for (let j = 0; j < 10; ++i) {
                    const msg: EmbeddingMessage = {
                        type: "embedding",
                        id: i,
                        content: "Hello and Welcome!"
                    };
                    workers[j].postMessage(msg);
                }
            }
        });
    });
});
