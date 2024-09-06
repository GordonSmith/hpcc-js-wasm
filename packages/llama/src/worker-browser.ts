import { llamaPromise, modelPromise, isEmbeddingMessage, EmbeddingResponse } from "./worker-message.ts";

globalThis.onmessage = async (ev: MessageEvent) => {

    if (isEmbeddingMessage(ev.data)) {
        const [llama, model] = await Promise.all([llamaPromise, modelPromise]);
        const response: EmbeddingResponse = {
            type: "embedding",
            vectors: llama.embedding(ev.data.content, model)
        };
        globalThis.postMessage(response);
    }
};
