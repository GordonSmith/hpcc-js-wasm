import { describe, it, expect, beforeEach } from "vitest";
import { WasiShim } from "../src/wasi-shim.ts";

// Typed accessors to avoid `as Function` lint errors
type WasiFdRead = (fd: number, iovsPtr: number, iovsLen: number, nreadPtr: number) => number;
type WasiFdWrite = (fd: number, iovsPtr: number, iovsLen: number, nwrittenPtr: number) => number;
type WasiFdClose = (fd: number) => number;
type WasiFdSeek = (fd: number, offset: number, whence: number, newOffsetPtr: number) => number;
type WasiFdFdstatGet = (fd: number, statPtr: number) => number;
type WasiEnvironGet = (environPtr: number, environBufPtr: number) => number;
type WasiEnvironSizesGet = (countPtr: number, sizePtr: number) => number;
type WasiClockTimeGet = (clockId: number, precision: bigint, timePtr: number) => number;
type WasiProcExit = (code: number) => void;

function getFdRead(imports: WebAssembly.ModuleImports): WasiFdRead {
    return imports.fd_read as WasiFdRead;
}
function getFdWrite(imports: WebAssembly.ModuleImports): WasiFdWrite {
    return imports.fd_write as WasiFdWrite;
}
function getFdClose(imports: WebAssembly.ModuleImports): WasiFdClose {
    return imports.fd_close as WasiFdClose;
}
function getFdSeek(imports: WebAssembly.ModuleImports): WasiFdSeek {
    return imports.fd_seek as WasiFdSeek;
}
function getFdFdstatGet(imports: WebAssembly.ModuleImports): WasiFdFdstatGet {
    return imports.fd_fdstat_get as WasiFdFdstatGet;
}
function getEnvironGet(imports: WebAssembly.ModuleImports): WasiEnvironGet {
    return imports.environ_get as WasiEnvironGet;
}
function getEnvironSizesGet(imports: WebAssembly.ModuleImports): WasiEnvironSizesGet {
    return imports.environ_sizes_get as WasiEnvironSizesGet;
}
function getClockTimeGet(imports: WebAssembly.ModuleImports): WasiClockTimeGet {
    return imports.clock_time_get as WasiClockTimeGet;
}
function getProcExit(imports: WebAssembly.ModuleImports): WasiProcExit {
    return imports.proc_exit as WasiProcExit;
}

describe("WasiShim", function () {

    let shim: WasiShim;
    let memory: WebAssembly.Memory;

    beforeEach(() => {
        shim = new WasiShim();
        memory = new WebAssembly.Memory({ initial: 1 }); // 64KB
        shim.setMemory(memory);
    });

    describe("constructor and reset", () => {
        it("creates a new instance with empty state", () => {
            const s = new WasiShim();
            expect(s.getStdout()).toBe("");
        });

        it("reset clears stdin and stdout state", () => {
            shim.setStdin("hello");
            // Write something to stdout via fd_write
            const imports = shim.imports;
            const mem = new DataView(memory.buffer);
            const dataStr = "output";
            const encoder = new TextEncoder();
            const data = encoder.encode(dataStr);
            // Place data at offset 256
            new Uint8Array(memory.buffer).set(data, 256);
            // iov at offset 0: ptr=256, len=data.length
            mem.setUint32(0, 256, true);
            mem.setUint32(4, data.length, true);
            // nwritten at offset 64
            getFdWrite(imports)(1, 0, 1, 64);

            expect(shim.getStdout()).toBe("output");

            shim.reset();
            expect(shim.getStdout()).toBe("");
        });
    });

    describe("setStdin / fd_read", () => {
        it("reads stdin data correctly", () => {
            shim.setStdin("hello");

            const imports = shim.imports;
            const mem = new DataView(memory.buffer);

            // Set up iov: ptr=256, len=32
            mem.setUint32(0, 256, true);  // iov[0].buf
            mem.setUint32(4, 32, true);   // iov[0].buf_len
            // nread at offset 64

            const result = getFdRead(imports)(0, 0, 1, 64);
            expect(result).toBe(0); // success

            const nread = mem.getUint32(64, true);
            expect(nread).toBe(5); // "hello" = 5 bytes

            const output = new Uint8Array(memory.buffer, 256, nread);
            const text = new TextDecoder().decode(output);
            expect(text).toBe("hello");
        });

        it("returns EBADF (8) for non-stdin fd", () => {
            const imports = shim.imports;
            const result = getFdRead(imports)(3, 0, 0, 0);
            expect(result).toBe(8);
        });

        it("handles multiple iovs", () => {
            shim.setStdin("abcdef");

            const imports = shim.imports;
            const mem = new DataView(memory.buffer);

            // iov[0]: ptr=256, len=3
            mem.setUint32(0, 256, true);
            mem.setUint32(4, 3, true);
            // iov[1]: ptr=512, len=3
            mem.setUint32(8, 512, true);
            mem.setUint32(12, 3, true);

            const result = getFdRead(imports)(0, 0, 2, 64);
            expect(result).toBe(0);

            const nread = mem.getUint32(64, true);
            expect(nread).toBe(6);

            const chunk1 = new TextDecoder().decode(new Uint8Array(memory.buffer, 256, 3));
            const chunk2 = new TextDecoder().decode(new Uint8Array(memory.buffer, 512, 3));
            expect(chunk1).toBe("abc");
            expect(chunk2).toBe("def");
        });

        it("handles partial read when buffer is smaller than data", () => {
            shim.setStdin("hello world");

            const imports = shim.imports;
            const mem = new DataView(memory.buffer);

            // iov[0]: ptr=256, len=5 (only read 5 bytes)
            mem.setUint32(0, 256, true);
            mem.setUint32(4, 5, true);

            const result = getFdRead(imports)(0, 0, 1, 64);
            expect(result).toBe(0);

            const nread = mem.getUint32(64, true);
            expect(nread).toBe(5);

            const text = new TextDecoder().decode(new Uint8Array(memory.buffer, 256, nread));
            expect(text).toBe("hello");
        });

        it("reads remaining data on subsequent calls", () => {
            shim.setStdin("hello world");

            const imports = shim.imports;
            const mem = new DataView(memory.buffer);

            // First read: 5 bytes
            mem.setUint32(0, 256, true);
            mem.setUint32(4, 5, true);
            getFdRead(imports)(0, 0, 1, 64);

            // Second read: remaining bytes
            mem.setUint32(0, 512, true);
            mem.setUint32(4, 32, true);
            getFdRead(imports)(0, 0, 1, 64);

            const nread = mem.getUint32(64, true);
            expect(nread).toBe(6);

            const text = new TextDecoder().decode(new Uint8Array(memory.buffer, 512, nread));
            expect(text).toBe(" world");
        });

        it("returns 0 bytes when stdin is exhausted", () => {
            shim.setStdin("hi");

            const imports = shim.imports;
            const mem = new DataView(memory.buffer);

            // Read all data
            mem.setUint32(0, 256, true);
            mem.setUint32(4, 32, true);
            getFdRead(imports)(0, 0, 1, 64);

            // Try to read again - should get 0 bytes
            mem.setUint32(0, 512, true);
            mem.setUint32(4, 32, true);
            const result = getFdRead(imports)(0, 0, 1, 64);
            expect(result).toBe(0);

            const nread = mem.getUint32(64, true);
            expect(nread).toBe(0);
        });
    });

    describe("fd_write", () => {
        it("writes to stdout (fd 1)", () => {
            const imports = shim.imports;
            const mem = new DataView(memory.buffer);
            const data = new TextEncoder().encode("hello");

            new Uint8Array(memory.buffer).set(data, 256);
            mem.setUint32(0, 256, true);
            mem.setUint32(4, data.length, true);

            const result = getFdWrite(imports)(1, 0, 1, 64);
            expect(result).toBe(0);

            const nwritten = mem.getUint32(64, true);
            expect(nwritten).toBe(5);
            expect(shim.getStdout()).toBe("hello");
        });

        it("accepts stderr (fd 2) without error", () => {
            const imports = shim.imports;
            const mem = new DataView(memory.buffer);
            const data = new TextEncoder().encode("error msg");

            new Uint8Array(memory.buffer).set(data, 256);
            mem.setUint32(0, 256, true);
            mem.setUint32(4, data.length, true);

            const result = getFdWrite(imports)(2, 0, 1, 64);
            expect(result).toBe(0);

            const nwritten = mem.getUint32(64, true);
            expect(nwritten).toBe(9);
        });

        it("stderr does not appear in getStdout", () => {
            const imports = shim.imports;
            const mem = new DataView(memory.buffer);
            const data = new TextEncoder().encode("error");

            new Uint8Array(memory.buffer).set(data, 256);
            mem.setUint32(0, 256, true);
            mem.setUint32(4, data.length, true);

            getFdWrite(imports)(2, 0, 1, 64);
            expect(shim.getStdout()).toBe("");
        });

        it("returns EBADF (8) for invalid fd", () => {
            const imports = shim.imports;
            const result = getFdWrite(imports)(3, 0, 0, 0);
            expect(result).toBe(8);
        });

        it("handles multiple iovs", () => {
            const imports = shim.imports;
            const mem = new DataView(memory.buffer);
            const buf = new Uint8Array(memory.buffer);

            const data1 = new TextEncoder().encode("hello ");
            const data2 = new TextEncoder().encode("world");

            buf.set(data1, 256);
            buf.set(data2, 512);

            // iov[0]: ptr=256, len=6
            mem.setUint32(0, 256, true);
            mem.setUint32(4, data1.length, true);
            // iov[1]: ptr=512, len=5
            mem.setUint32(8, 512, true);
            mem.setUint32(12, data2.length, true);

            const result = getFdWrite(imports)(1, 0, 2, 64);
            expect(result).toBe(0);

            const nwritten = mem.getUint32(64, true);
            expect(nwritten).toBe(11);
            expect(shim.getStdout()).toBe("hello world");
        });

        it("accumulates writes across multiple calls", () => {
            const imports = shim.imports;
            const mem = new DataView(memory.buffer);
            const buf = new Uint8Array(memory.buffer);

            // First write
            const data1 = new TextEncoder().encode("foo");
            buf.set(data1, 256);
            mem.setUint32(0, 256, true);
            mem.setUint32(4, data1.length, true);
            getFdWrite(imports)(1, 0, 1, 64);

            // Second write
            const data2 = new TextEncoder().encode("bar");
            buf.set(data2, 256);
            mem.setUint32(0, 256, true);
            mem.setUint32(4, data2.length, true);
            getFdWrite(imports)(1, 0, 1, 64);

            expect(shim.getStdout()).toBe("foobar");
        });
    });

    describe("getStdout", () => {
        it("returns empty string when nothing written", () => {
            expect(shim.getStdout()).toBe("");
        });

        it("handles UTF-8 multi-byte characters", () => {
            const imports = shim.imports;
            const mem = new DataView(memory.buffer);
            const data = new TextEncoder().encode("héllo 🌍");

            new Uint8Array(memory.buffer).set(data, 256);
            mem.setUint32(0, 256, true);
            mem.setUint32(4, data.length, true);

            getFdWrite(imports)(1, 0, 1, 64);
            expect(shim.getStdout()).toBe("héllo 🌍");
        });
    });

    describe("fd_close", () => {
        it("returns 0 (success)", () => {
            const imports = shim.imports;
            const result = getFdClose(imports)(0);
            expect(result).toBe(0);
        });
    });

    describe("fd_seek", () => {
        it("returns 0 (success)", () => {
            const imports = shim.imports;
            const result = getFdSeek(imports)(0, 0, 0, 0);
            expect(result).toBe(0);
        });
    });

    describe("fd_fdstat_get", () => {
        it("returns 0 and writes stat data for stdin (fd 0)", () => {
            const imports = shim.imports;
            const mem = new DataView(memory.buffer);

            const result = getFdFdstatGet(imports)(0, 128);
            expect(result).toBe(0);

            // stdin: filetype = 0 (unknown)
            expect(mem.getUint8(128)).toBe(0);
        });

        it("returns 0 and writes stat data for stdout (fd 1)", () => {
            const imports = shim.imports;
            const mem = new DataView(memory.buffer);

            const result = getFdFdstatGet(imports)(1, 128);
            expect(result).toBe(0);

            // stdout: filetype = 1 (character_device - but actually the type value for non-stdin)
            expect(mem.getUint8(128)).toBe(1);
        });
    });

    describe("environ_get", () => {
        it("returns 0 (success)", () => {
            const imports = shim.imports;
            const result = getEnvironGet(imports)(0, 0);
            expect(result).toBe(0);
        });
    });

    describe("environ_sizes_get", () => {
        it("returns 0 and writes count=0, size=0", () => {
            const imports = shim.imports;
            const mem = new DataView(memory.buffer);

            const result = getEnvironSizesGet(imports)(128, 132);
            expect(result).toBe(0);

            expect(mem.getUint32(128, true)).toBe(0);
            expect(mem.getUint32(132, true)).toBe(0);
        });
    });

    describe("clock_time_get", () => {
        it("returns 0 and writes a timestamp in nanoseconds", () => {
            const imports = shim.imports;
            const mem = new DataView(memory.buffer);

            const before = BigInt(Date.now()) * 1000000n;
            const result = getClockTimeGet(imports)(0, 0n, 128);
            const after = BigInt(Date.now()) * 1000000n;

            expect(result).toBe(0);

            const timestamp = mem.getBigUint64(128, true);
            expect(timestamp).toBeGreaterThanOrEqual(before);
            expect(timestamp).toBeLessThanOrEqual(after);
        });
    });

    describe("proc_exit", () => {
        it("does not throw", () => {
            const imports = shim.imports;
            expect(() => getProcExit(imports)(0)).not.toThrow();
        });
    });

    describe("imports getter", () => {
        it("returns an object with all required WASI functions", () => {
            const imports = shim.imports;
            const expectedFunctions = [
                "fd_read", "fd_write", "fd_close", "fd_seek",
                "fd_fdstat_get", "environ_get", "environ_sizes_get",
                "clock_time_get", "proc_exit"
            ];
            for (const fn of expectedFunctions) {
                expect(typeof imports[fn]).toBe("function");
            }
        });
    });

    describe("error: memory not set", () => {
        it("fd_read throws if memory not set", () => {
            const s = new WasiShim();
            const imports = s.imports;
            expect(() => getFdRead(imports)(0, 0, 1, 0)).toThrow("memory");
        });

        it("fd_write throws if memory not set", () => {
            const s = new WasiShim();
            const imports = s.imports;
            expect(() => getFdWrite(imports)(1, 0, 1, 0)).toThrow("memory");
        });
    });

    describe("end-to-end: stdin → stdout round-trip", () => {
        it("simulates a JSON-in/JSON-out WASM interaction", () => {
            const inputJson = JSON.stringify({ question: "What is 2+2?" });
            shim.setStdin(inputJson);

            const imports = shim.imports;
            const mem = new DataView(memory.buffer);
            const buf = new Uint8Array(memory.buffer);

            // Simulate WASM reading stdin
            mem.setUint32(0, 1024, true);
            mem.setUint32(4, 4096, true);
            getFdRead(imports)(0, 0, 1, 64);
            const nread = mem.getUint32(64, true);

            // Parse what was read
            const readData = new TextDecoder().decode(new Uint8Array(memory.buffer, 1024, nread));
            const parsed = JSON.parse(readData);
            expect(parsed.question).toBe("What is 2+2?");

            // Simulate WASM writing response to stdout
            const response = JSON.stringify({ answer: "4" });
            const responseBytes = new TextEncoder().encode(response);
            buf.set(responseBytes, 2048);
            mem.setUint32(0, 2048, true);
            mem.setUint32(4, responseBytes.length, true);
            getFdWrite(imports)(1, 0, 1, 64);

            // Read stdout
            const output = shim.getStdout();
            const outputParsed = JSON.parse(output);
            expect(outputParsed.answer).toBe("4");
        });
    });
});
