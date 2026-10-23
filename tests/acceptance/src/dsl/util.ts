import { expect } from "vitest";
import type { ExportReport, FilesystemReport, HeapReport, Outcome, StringReport, UtilDriver } from "../drivers/util/driver.ts";

function expectOk<T>(outcome: Outcome<T>, operation: string): T {
    if (!outcome.ok) {
        expect.fail(`${operation} failed: ${outcome.error}`);
    }
    return outcome.value;
}

export class UtilDsl {
    constructor(private readonly driver: UtilDriver) { }

    async heapBehavior(): Promise<this> {
        const report: HeapReport = expectOk(await this.driver.execute("heap", {}), "Heap helpers");
        expect(report.mallocSize).toBe(10);
        expect(report.mallocPointerPositive).toBe(true);
        expect(report.mallocFreed).toBe(true);
        expect(report.disposeFreed).toBe(true);
        expect(report.heapByteAfterMutation).toBe(9);
        expect(report.copiedBytesAfterMutation).toEqual([1, 2, 3, 4]);
        expect(report.emptyAllocationSize).toBe(0);
        expect(report.emptyViewLength).toBe(0);
        return this;
    }

    async stringBehavior(value: string, byteLength: number): Promise<this> {
        const report: StringReport = expectOk(await this.driver.execute("string", { value }), "String helpers");
        expect(report.byteLength).toBe(byteLength);
        expect(report.allocationSize).toBe(byteLength + 1);
        expect(report.trailingNull).toBe(0);
        expect(report.roundTrip).toBe(value);
        expect(report.freed).toBe(true);
        return this;
    }

    async filesystemBehavior(): Promise<this> {
        const report: FilesystemReport = expectOk(await this.driver.execute("filesystem", {}), "Filesystem helpers");
        expect(report.absentDetected).toBe(false);
        expect(report.incompleteDetected).toBe(false);
        expect(report.completeDetected).toBe(true);
        expect(report.createPathArgs).toEqual(["/", "assets", true, true]);
        expect(report.createDataFileArgs).toEqual(["/", "assets/file.bin", [8, 9], true, true, true]);
        expect(report.preloadFileArgs).toEqual(["/", "assets/preload.bin", [8, 9], true, true, false, true, false]);
        expect(report.unlinkPath).toBe("assets/file.bin");
        return this;
    }

    async publicExportsLoadWithoutOptionalGlobals(): Promise<this> {
        const report: ExportReport = expectOk(await this.driver.execute("exports", {}), "Public module import");
        expect(report.globalsAbsent).toBe(true);
        expect(report.mainModuleExType).toBe("function");
        return this;
    }
}
