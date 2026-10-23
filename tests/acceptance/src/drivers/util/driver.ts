export type DriverName = "node-inprocess" | "node-no-globals" | "browser";

export type Capability =
    | "heap"
    | "strings"
    | "filesystem"
    | "noOptionalGlobals";

export const LIBRARY_CAPABILITIES: readonly Capability[] = [
    "heap",
    "strings",
    "filesystem"
];

export interface HeapReport {
    mallocSize: number;
    mallocPointerPositive: boolean;
    mallocFreed: boolean;
    disposeFreed: boolean;
    heapByteAfterMutation: number;
    copiedBytesAfterMutation: number[];
    emptyAllocationSize: number;
    emptyViewLength: number;
}

export interface StringReport {
    byteLength: number;
    allocationSize: number;
    trailingNull: number;
    roundTrip: string;
    freed: boolean;
}

export interface FilesystemReport {
    absentDetected: boolean;
    incompleteDetected: boolean;
    completeDetected: boolean;
    createPathArgs: [string, string, boolean, boolean];
    createDataFileArgs: [string, string, number[], boolean, boolean, boolean];
    preloadFileArgs: [string, string, number[], boolean, boolean, boolean, boolean, boolean];
    unlinkPath: string;
}

export interface ExportReport {
    globalsAbsent: boolean;
    mainModuleExType: string;
}

export interface Operations {
    heap: { args: Record<string, never>; result: HeapReport };
    string: { args: { value: string }; result: StringReport };
    filesystem: { args: Record<string, never>; result: FilesystemReport };
    exports: { args: Record<string, never>; result: ExportReport };
}

export type OperationName = keyof Operations;

export type Outcome<T> =
    | { ok: true; value: T }
    | { ok: false; error: string };

export interface UtilDriver {
    readonly name: DriverName;
    readonly capabilities: ReadonlySet<Capability>;
    execute<K extends OperationName>(op: K, args: Operations[K]["args"]): Promise<Outcome<Operations[K]["result"]>>;
    dispose(): Promise<void>;
}

export interface DriverDescriptor {
    readonly name: DriverName;
    readonly environment: "node" | "browser";
    readonly capabilities: readonly Capability[];
    create(): Promise<UtilDriver>;
}
