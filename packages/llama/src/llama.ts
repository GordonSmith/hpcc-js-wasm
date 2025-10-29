import { llama } from "../../../build/packages/llama/llamalib.component.js";
import llamaMeta from "../../../vcpkg-overlays/llama/vcpkg.json" with { type: "json" };

//  Ref:  https://github.com/ggerganov/llama.cpp
//  Ref:  http://facebook.github.io/llama/llama_manual.html
//  Ref:  https://github.com/facebook/llama

// Dynamic import of the filesystem shim
let _setFileData: ((fileData: any) => void) | undefined;
async function getSetFileData() {
    if (!_setFileData) {
        try {
            const fs = await import("@bytecodealliance/preview2-shim/filesystem");
            _setFileData = (fs as any)._setFileData;
        } catch (e) {
            console.error("Failed to load filesystem shim:", e);
        }
    }
    return _setFileData;
}

let g_llama: Llama | undefined;

/**
 * The llama WASM library, provides a simplified wrapper around the llama.cpp library.
 * 
 * See [llama.cpp](https://github.com/ggerganov/llama.cpp) for more details.
 * 
 * ```ts
 * import { Llama, WebBlob } from "@hpcc-js/wasm-llama";
 * 
 * let llama = await Llama.load();
 * const model = "https://huggingface.co/CompendiumLabs/bge-base-en-v1.5-gguf/resolve/main/bge-base-en-v1.5-q4_k_m.gguf";
 * const webBlob: Blob = await WebBlob.create(new URL(model));
 * 
 * const data: ArrayBuffer = await webBlob.arrayBuffer();
 * 
 * const embeddings = llama.embedding("Hello and Welcome!", new Uint8Array(data));
 * ```
 */
export class Llama {

    private constructor() {
    }

    /**
     * Compiles and instantiates the raw wasm.
     * 
     * ::: info
     * In general WebAssembly compilation is disallowed on the main thread if the buffer size is larger than 4KB, hence forcing `load` to be asynchronous;
     * :::
     * 
     * @returns A promise to an instance of the Llama class.
     */
    static async load(): Promise<Llama> {
        if (!g_llama) {
            // Wait a tick to ensure the component module is fully loaded
            await new Promise(resolve => setTimeout(resolve, 0));
            g_llama = new Llama();
        }
        return g_llama;
    }

    /**
     * Unloades the compiled wasm instance.
     */
    static unload() {
        g_llama = undefined;
    }

    /**
     * @returns The Llama c++ version
     */
    version(): string {
        return llamaMeta["version-string"];
    }

    /**
     * Calculates the vector representation of the input text.
     * 
     * @param text The input text.
     * @param model The model to use for the embedding.
     * @param format The output format ("array" or "json")
     * 
     * @returns The embedding of the text using the model.
     */
    async embedding(text: string, model: Uint8Array, format: string = "array"): Promise<number[][]> {
        const modelPath = "embeddingModel.gguf";
        let retVal: number[][] = [];

        try {
            // Set up virtual filesystem with the model file
            const setFileData = await getSetFileData();
            if (!setFileData) {
                console.error("Failed to load filesystem shim");
                return retVal;
            }

            console.log("[embedding] Setting up virtual filesystem with model file, size:", model.byteLength);
            setFileData({
                dir: {
                    [modelPath]: {
                        source: model
                    }
                }
            });
            console.log("[embedding] Virtual filesystem set up complete");

            // Build command-line arguments for the embedding function
            const args: string[] = [
                "-m", modelPath,
                "--pooling", "mean",
                "--log-disable",
                "-p", text,
                "--embd-output-format", format
            ];

            console.log("[embedding] Calling llama.embedding with args:", args);
            // Call the WIT interface
            const result = llama.embedding(args);
            console.log("[embedding] Got result:", result);

            // Parse the output - first element should be stdout with JSON
            if (result.length > 0 && result[0]) {
                const stdout = result[0];
                try {
                    retVal = JSON.parse(stdout);
                } catch (e) {
                    console.error("Failed to parse embedding output:", stdout);
                    console.error(e);
                }
            }

            // Log any stderr output (second element)
            if (result.length > 1 && result[1]) {
                console.error("Embedding stderr:", result[1]);
            }
        } catch (e) {
            console.error("Embedding error:", e);
        } finally {
            // Clean up - reset the filesystem
            try {
                const setFileData = await getSetFileData();
                if (setFileData) {
                    setFileData({ dir: {} });
                }
            } catch (e) {
                console.error("Failed to clean up filesystem:", e);
            }
        }

        return retVal;
    }
}
