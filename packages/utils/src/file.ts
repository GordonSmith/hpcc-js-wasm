import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export interface Module {
    FS_createPath(patent: string, path: string, canRead?: boolean, canWrite?: boolean): string;
    // FS_createPath: any;
    FS_createDataFile(parent: string, name: string, fileData: Uint8Array, canRead?: boolean, canWrite?: boolean, canOwn?: boolean): void;
    FS_createPreloadedFile(parent: string, name: string, url: string, canRead?: boolean, canWrite?: boolean, onload?: () => void, onerror?: () => void, dontCreateFile?: boolean, canOwn?: boolean, preFinish?: () => void): void;
    FS_unlink(path: string): any;
}

export function hostExists(path: string) {
    return existsSync(path);
}

export async function hostToWasm(srcPath: string, destPath: string, module: Module): Promise<string> {
    const absPath = path.posix.resolve(srcPath);
    const destDir = path.dirname(absPath);
    path.normalize(destDir);
    module.FS_createPath("/", destDir, true, true);
    let content = await readFile(srcPath);
    module.FS_createDataFile(destDir, path.basename(destPath), new Uint8Array(content), true, true, true);
    return absPath;
}
