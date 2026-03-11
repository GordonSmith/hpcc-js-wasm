/**
 * Minimal WASI Preview 1 shim for running Javy-compiled WASM modules.
 *
 * Provides the `wasi_snapshot_preview1` imports required by Javy output,
 * supporting stdin/stdout communication via JSON. Works in both browser
 * and Node.js environments with no external dependencies.
 *
 * @example
 * ```ts
 * const shim = new WasiShim();
 * shim.setStdin(JSON.stringify({ prompt: "hello" }));
 *
 * const { instance } = await WebAssembly.instantiate(wasmBytes, {
 *     wasi_snapshot_preview1: shim.imports
 * });
 * shim.setMemory(instance.exports.memory as WebAssembly.Memory);
 *
 * (instance.exports._start as Function)();
 * const result = shim.getStdout();
 * ```
 */
export class WasiShim {

    private _memory: WebAssembly.Memory | undefined;
    private _stdinData: Uint8Array = new Uint8Array(0);
    private _stdinOffset: number = 0;
    private _stdoutChunks: Uint8Array[] = [];

    /** Set the WASM memory reference. Must be called before execution. */
    setMemory(memory: WebAssembly.Memory): void {
        this._memory = memory;
    }

    /** Set stdin data for the next WASM execution. */
    setStdin(data: string): void {
        this._stdinData = new TextEncoder().encode(data);
        this._stdinOffset = 0;
    }

    /**
     * Read accumulated stdout output after WASM execution.
     *
     * @returns The UTF-8 decoded stdout content.
     */
    getStdout(): string {
        const totalLen = this._stdoutChunks.reduce((sum, c) => sum + c.length, 0);
        const result = new Uint8Array(totalLen);
        let offset = 0;
        for (const chunk of this._stdoutChunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        return new TextDecoder().decode(result);
    }

    /** Reset I/O state for the next invocation. */
    reset(): void {
        this._stdinData = new Uint8Array(0);
        this._stdinOffset = 0;
        this._stdoutChunks = [];
    }

    /**
     * Returns the memory reference, throwing if not yet set.
     *
     * @throws Error if {@link setMemory} has not been called.
     */
    private memoryView(): DataView {
        if (!this._memory) {
            throw new Error("WASI shim: memory not set — call setMemory() before execution");
        }
        return new DataView(this._memory.buffer);
    }

    /**
     * Get the WASI import object for `WebAssembly.instantiate`.
     *
     * The returned object should be passed as the `wasi_snapshot_preview1`
     * namespace in the import object.
     */
    get imports(): WebAssembly.ModuleImports {
        return {
            /**
             * Read from a file descriptor (only fd 0 / stdin is supported).
             * Scatters data into the provided iovec array.
             */
            fd_read: (fd: number, iovsPtr: number, iovsLen: number, nreadPtr: number): number => {
                if (fd !== 0) return 8; // EBADF
                const mem = this.memoryView();
                let totalRead = 0;
                for (let i = 0; i < iovsLen; i++) {
                    const ptr = mem.getUint32(iovsPtr + i * 8, true);
                    const len = mem.getUint32(iovsPtr + i * 8 + 4, true);
                    const remaining = this._stdinData.length - this._stdinOffset;
                    const toRead = Math.min(len, remaining);
                    const dest = new Uint8Array(this._memory!.buffer, ptr, toRead);
                    dest.set(this._stdinData.subarray(this._stdinOffset, this._stdinOffset + toRead));
                    this._stdinOffset += toRead;
                    totalRead += toRead;
                    if (toRead < len) break;
                }
                mem.setUint32(nreadPtr, totalRead, true);
                return 0;
            },

            /**
             * Write to a file descriptor (fd 1 = stdout, fd 2 = stderr).
             * Gathers data from the provided iovec array.
             */
            fd_write: (fd: number, iovsPtr: number, iovsLen: number, nwrittenPtr: number): number => {
                if (fd !== 1 && fd !== 2) return 8; // EBADF
                const mem = this.memoryView();
                let totalWritten = 0;
                for (let i = 0; i < iovsLen; i++) {
                    const ptr = mem.getUint32(iovsPtr + i * 8, true);
                    const len = mem.getUint32(iovsPtr + i * 8 + 4, true);
                    const data = new Uint8Array(this._memory!.buffer, ptr, len);
                    if (fd === 1) {
                        this._stdoutChunks.push(new Uint8Array(data));
                    }
                    totalWritten += len;
                }
                mem.setUint32(nwrittenPtr, totalWritten, true);
                return 0;
            },

            /** Close a file descriptor (no-op). */
            fd_close: (): number => {
                return 0;
            },

            /** Seek in a file descriptor (no-op). */
            fd_seek: (): number => {
                return 0;
            },

            /**
             * Get file descriptor status flags.
             * Reports filetype 0 (unknown) for stdin, 1 for others.
             */
            fd_fdstat_get: (fd: number, statPtr: number): number => {
                const mem = this.memoryView();
                mem.setUint8(statPtr, fd === 0 ? 0 : 1);
                mem.setUint16(statPtr + 2, 0, true);
                mem.setBigUint64(statPtr + 8, 0n, true);
                mem.setBigUint64(statPtr + 16, 0n, true);
                return 0;
            },

            /** Get environment variables (returns empty). */
            environ_get: (): number => {
                return 0;
            },

            /** Get environment variable sizes (count=0, size=0). */
            environ_sizes_get: (countPtr: number, sizePtr: number): number => {
                const mem = this.memoryView();
                mem.setUint32(countPtr, 0, true);
                mem.setUint32(sizePtr, 0, true);
                return 0;
            },

            /**
             * Get current time as nanoseconds since epoch.
             * Uses `Date.now()` converted to nanoseconds.
             */
            clock_time_get: (_clockId: number, _precision: bigint, timePtr: number): number => {
                const mem = this.memoryView();
                mem.setBigUint64(timePtr, BigInt(Date.now()) * 1000000n, true);
                return 0;
            },

            /** Exit the process (no-op in WASM context). */
            proc_exit: (): void => {
                /* noop */
            },
        };
    }
}
