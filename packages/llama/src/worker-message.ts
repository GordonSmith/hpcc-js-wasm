import { Llama, WebBlob } from "@hpcc-js/wasm-llama";

//  Requests  ----------------------------------------------------------------
export interface WorkerMessage {
    type: unknown;
}

export interface EmbeddingMessage extends WorkerMessage {
    type: "embedding";
    content: string;
}
export const isEmbeddingMessage = (message: WorkerMessage): message is EmbeddingMessage => message.type === "embedding";

//  Responses  ---------------------------------------------------------------
export interface WorkerResponse {
    type: unknown;
}

export interface ErrorResponse extends WorkerResponse {
    type: "error";
    message: string;
    stack?: string;
}
export const isErrorResponse = (response: WorkerResponse): response is ErrorResponse => response.type === "error";

export interface EmbeddingResponse extends WorkerResponse {
    type: "embedding";
    vectors: number[][];
}
export const isEmbeddingResponse = (response: WorkerResponse): response is EmbeddingResponse => response.type === "embedding";

//  --------------------------------------------------------------------------  
const modelUrl = new URL("https://huggingface.co/CompendiumLabs/bge-base-en-v1.5-gguf/resolve/main/bge-base-en-v1.5-q4_k_m.gguf");
export const modelPromise = WebBlob.create(modelUrl)
    .then(blob => blob.arrayBuffer())
    .then(data => new Uint8Array(data))
    ;
export const llamaPromise = Llama.load();
