import type { OperationName, Operations, Outcome } from "./driver.ts";

export function execute<K extends OperationName>(Graphviz: unknown, op: K, args: Operations[K]["args"]): Promise<Outcome<Operations[K]["result"]>>;
