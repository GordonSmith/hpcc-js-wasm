#!/usr/bin/env node
// Spec ↔ acceptance-test traceability check. See specs/README.md.
//
//  * every `accepted` / `implemented` spec has at least one test case
//  * every test case refers to a spec that exists
//  * `retired` specs have no test cases
//  * spec IDs are unique and have a valid status
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SPECS_DIR = join(ROOT, "specs");
const TESTS_DIR = join(ROOT, "tests", "acceptance");

const ID = "[A-Z][A-Z0-9]*-[A-Z][A-Z0-9]*-\\d{3}";
const SPEC_HEADING = new RegExp(`^###\\s+(${ID})\\b`);
const STATUS_LINE = /^Status:\s*(\S+)/;
const SCENARIO_REF = new RegExp(`\\bscenario\\(\\s*["'\`](${ID})["'\`]`, "g");
const STATUSES = new Set(["draft", "accepted", "implemented", "retired"]);
const REQUIRES_TEST = new Set(["accepted", "implemented"]);

function walk(dir, accept) {
    const out = [];
    for (const name of readdirSync(dir)) {
        if (name === "node_modules" || name.startsWith(".")) continue;
        const path = join(dir, name);
        if (statSync(path).isDirectory()) out.push(...walk(path, accept));
        else if (accept(name)) out.push(path);
    }
    return out;
}

const errors = [];
const specs = new Map();

for (const file of walk(SPECS_DIR, n => n.endsWith(".md") && n !== "README.md")) {
    const lines = readFileSync(file, "utf8").split("\n");
    let current;
    lines.forEach((line, i) => {
        const heading = SPEC_HEADING.exec(line);
        if (heading) {
            const id = heading[1];
            const where = `${relative(ROOT, file)}:${i + 1}`;
            if (specs.has(id)) errors.push(`${where}: duplicate spec id ${id} (first defined at ${specs.get(id).where})`);
            current = { id, where, status: undefined };
            specs.set(id, current);
            return;
        }
        const status = STATUS_LINE.exec(line);
        if (status && current && current.status === undefined) {
            current.status = status[1].toLowerCase();
        }
    });
}

for (const spec of specs.values()) {
    if (!spec.status) errors.push(`${spec.where}: ${spec.id} has no "Status:" line`);
    else if (!STATUSES.has(spec.status)) errors.push(`${spec.where}: ${spec.id} has unknown status "${spec.status}"`);
}

const references = new Map();
for (const file of walk(TESTS_DIR, n => /\.spec\.(ts|js|mjs)$/.test(n))) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(SCENARIO_REF)) {
        const line = text.slice(0, match.index).split("\n").length;
        const where = `${relative(ROOT, file)}:${line}`;
        if (!references.has(match[1])) references.set(match[1], []);
        references.get(match[1]).push(where);
    }
}

for (const [id, wheres] of references) {
    const spec = specs.get(id);
    if (!spec) errors.push(`${wheres[0]}: test case refers to unknown spec ${id}`);
    else if (spec.status === "retired") errors.push(`${wheres[0]}: test case refers to retired spec ${id}`);
}
for (const spec of specs.values()) {
    if (REQUIRES_TEST.has(spec.status) && !references.has(spec.id)) {
        errors.push(`${spec.where}: ${spec.status} spec ${spec.id} has no acceptance test case`);
    }
}

const counts = {};
for (const spec of specs.values()) counts[spec.status] = (counts[spec.status] ?? 0) + 1;
const summary = Object.entries(counts).map(([s, n]) => `${n} ${s}`).join(", ");

if (errors.length) {
    console.error(`Spec coverage check failed (${specs.size} specs: ${summary}):`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
}
console.log(`Spec coverage OK: ${specs.size} specs (${summary}), ${references.size} referenced by acceptance tests.`);
