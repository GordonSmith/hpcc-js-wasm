import { defineConfig } from "vite";
import arraybuffer from "vite-plugin-arraybuffer"
import { resolve } from "path";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: pkg.name,
            fileName: "index",
            formats: ["es"]
        },
        rollupOptions: {
            output: {
            },
        },
        target: ["es2022"]
    },
    resolve: {
    },
    esbuild: {
        minifyIdentifiers: false
    },

    plugins: [
        arraybuffer()
    ]
});
