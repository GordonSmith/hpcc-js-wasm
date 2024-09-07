import { llamaPromise, modelPromise, isEmbeddingMessage, EmbeddingResponse } from "./worker-message.ts";

globalThis.onmessage = async (ev: MessageEvent) => {
    globalThis.postMessage("Hello from worker");

    if (isEmbeddingMessage(ev.data)) {
        globalThis.postMessage("Hello from worker 2 - " + ev.data.content);
        const [llama, model] = await Promise.all([llamaPromise, modelPromise]);
        const response: EmbeddingResponse = {
            type: "embedding",
            id: ev.data.id,
            vectors: llama.embedding(ev.data.content, model)
        };
        globalThis.postMessage(response);
    }
};

// async function test(prompt: string): Promise<number[][]> {
//     const [llama, model] = await Promise.all([llamaPromise, modelPromise]);
//     return llama.embedding(prompt, model);
// }

// function workerFunction() {
//     globalThis.onmessage = async (ev: MessageEvent) => {
//         if (isEmbeddingMessage(ev.data)) {
//             const response: EmbeddingResponse = {
//                 type: "embedding",
//                 vectors: await test(ev.data.content)
//             };
//             globalThis.postMessage(response);
//         }
//     };
// }