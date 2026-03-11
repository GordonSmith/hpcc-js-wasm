import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");

describe("build pipeline configuration", () => {

    describe("build-wasm.js", () => {
        it("should exist", () => {
            expect(existsSync(resolve(pkgRoot, "build-wasm.js"))).toBe(true);
        });

        it("should reference src-ts/copilot-sdk.ts as entry point", () => {
            const content = readFileSync(resolve(pkgRoot, "build-wasm.js"), "utf-8");
            expect(content).toContain("src-ts/copilot-sdk.ts");
        });

        it("should output to copilot-sdklib.wasm", () => {
            const content = readFileSync(resolve(pkgRoot, "build-wasm.js"), "utf-8");
            expect(content).toContain("copilot-sdklib.wasm");
        });

        it("should use componentize-js to compile", () => {
            const content = readFileSync(resolve(pkgRoot, "build-wasm.js"), "utf-8");
            expect(content).toContain("componentize-js");
            expect(content).toContain("componentize");
        });

        it("should bundle with esbuild first", () => {
            const content = readFileSync(resolve(pkgRoot, "build-wasm.js"), "utf-8");
            expect(content).toContain('import { build } from "esbuild"');
        });

        it("should use ESM format for bundled JS", () => {
            const content = readFileSync(resolve(pkgRoot, "build-wasm.js"), "utf-8");
            expect(content).toContain('format: "esm"');
        });

        it("should output intermediate JS to build directory", () => {
            const content = readFileSync(resolve(pkgRoot, "build-wasm.js"), "utf-8");
            expect(content).toContain("copilot-sdklib.js");
            expect(content).toContain("build/packages/copilot-sdk");
        });
    });

    describe("esbuild.js", () => {
        it("should exist", () => {
            expect(existsSync(resolve(pkgRoot, "esbuild.js"))).toBe(true);
        });

        it("should copy WASM component to dist/ for Java/C++ consumers", () => {
            const content = readFileSync(resolve(pkgRoot, "esbuild.js"), "utf-8");
            expect(content).toContain("copilot-sdklib.wasm");
            expect(content).toContain("copyFileSync");
        });

        it("should use neutralTpl", () => {
            const content = readFileSync(resolve(pkgRoot, "esbuild.js"), "utf-8");
            expect(content).toContain("neutralTpl");
            expect(content).toContain('@hpcc-js/esbuild-plugins');
        });

        it("should build src/index.ts to dist/index", () => {
            const content = readFileSync(resolve(pkgRoot, "esbuild.js"), "utf-8");
            expect(content).toContain("src/index.ts");
            expect(content).toContain("dist/index");
        });

        it("should mark @github/copilot-sdk as external (optional peer dep, Node.js only)", () => {
            const content = readFileSync(resolve(pkgRoot, "esbuild.js"), "utf-8");
            expect(content).toContain("@github/copilot-sdk");
        });
    });

    describe("package.json", () => {
        let pkg: Record<string, unknown>;

        it("should be valid JSON", () => {
            const content = readFileSync(resolve(pkgRoot, "package.json"), "utf-8");
            pkg = JSON.parse(content);
            expect(pkg).toBeDefined();
        });

        it("should have build-wasm script", () => {
            const content = readFileSync(resolve(pkgRoot, "package.json"), "utf-8");
            pkg = JSON.parse(content);
            const scripts = pkg.scripts as Record<string, string>;
            expect(scripts["build-wasm"]).toBe("node build-wasm.js");
        });

        it("should have build script using run-p", () => {
            const content = readFileSync(resolve(pkgRoot, "package.json"), "utf-8");
            pkg = JSON.parse(content);
            const scripts = pkg.scripts as Record<string, string>;
            expect(scripts["build"]).toContain("run-p");
            expect(scripts["build"]).toContain("gen-types");
            expect(scripts["build"]).toContain("bundle");
        });

        it("should have bundle script running esbuild.js", () => {
            const content = readFileSync(resolve(pkgRoot, "package.json"), "utf-8");
            pkg = JSON.parse(content);
            const scripts = pkg.scripts as Record<string, string>;
            expect(scripts["bundle"]).toBe("node esbuild.js");
        });

        it("should not have @github/copilot-sdk in dependencies (it is an optional peerDependency)", () => {
            const content = readFileSync(resolve(pkgRoot, "package.json"), "utf-8");
            pkg = JSON.parse(content);
            const deps = pkg.dependencies as Record<string, string>;
            expect(deps).not.toHaveProperty("@github/copilot-sdk");
            // Should be an optional peerDependency instead
            const peerDeps = pkg.peerDependencies as Record<string, string>;
            expect(peerDeps).toHaveProperty("@github/copilot-sdk");
        });

        it("should have empty dependencies", () => {
            const content = readFileSync(resolve(pkgRoot, "package.json"), "utf-8");
            pkg = JSON.parse(content);
            const deps = pkg.dependencies as Record<string, string>;
            expect(Object.keys(deps)).toHaveLength(0);
        });

        it("should have @hpcc-js/esbuild-plugins in devDependencies", () => {
            const content = readFileSync(resolve(pkgRoot, "package.json"), "utf-8");
            pkg = JSON.parse(content);
            const devDeps = pkg.devDependencies as Record<string, string>;
            expect(devDeps).toHaveProperty("@hpcc-js/esbuild-plugins");
        });

        it("should have @bytecodealliance/componentize-js in devDependencies", () => {
            const content = readFileSync(resolve(pkgRoot, "package.json"), "utf-8");
            pkg = JSON.parse(content);
            const devDeps = pkg.devDependencies as Record<string, string>;
            expect(devDeps).toHaveProperty("@bytecodealliance/componentize-js");
        });
    });
});
