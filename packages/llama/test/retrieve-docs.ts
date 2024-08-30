import path from "path";
import { Llama } from "@hpcc-js/wasm-llama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { Embeddings } from "@langchain/core/embeddings";
import { readFile } from "fs/promises";

const modelPath = path.join(".", "docs", "models", "bge-base-en-v1.5-q4_k_m.gguf");

class LlamaEmbeddings extends Embeddings {

    private _modelData: Promise<Uint8Array>;

    constructor(fields?) {
        super(fields);
        this._modelData = readFile(modelPath).then(modelBin => {
            return new Uint8Array(modelBin);
        });
    }

    embedDocuments(documents: string[]): Promise<number[][]> {
        return Promise.all([Llama.load(), this._modelData]).then(([llama, modelData]) => {
            const embeddings: number[][] = [];
            for (const text of documents) {
                console.log(text);
                const vectors = llama.embedding(text, modelData);
                vectors.forEach(vector => {
                    embeddings.push(vector);
                });
                console.log(vectors);
                Llama.unload();
            }
            return embeddings;
        });
    }

    embedQuery(document: string): Promise<number[]> {
        return Promise.all([Llama.load(), this._modelData]).then(([llama, modelData]) => {
            const vectors = llama.embedding(document, modelData);
            return vectors[0];
        });
    }
}

async function load(folder: string) {
    return FaissStore.load(`docs/out/${folder}`, new LlamaEmbeddings());
}

const allStore = await load("all");

const result = await allStore.similaritySearch("How do I do I output a json file?", 9);
console.log(result);
