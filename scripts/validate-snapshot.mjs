import { readFile } from "node:fs/promises";
import { parseArgs, inspect } from "node:util";
import { validateSnapshot } from "../UI/src/snapshot.mjs";

let debug = false;
try {
  const { values, positionals } = parseArgs({
    options: { debug: { type: "boolean", default: false } },
    allowPositionals: true,
  });
  debug = values.debug;
  if (debug) Error.stackTraceLimit = Infinity;
  if (positionals.length !== 1)
    throw new Error("Usage: node scripts/validate-snapshot.mjs [--debug] <file>");
  const data = JSON.parse(
    (await readFile(positionals[0], "utf8")).replace(/^\uFEFF/, ""),
  );
  const result = validateSnapshot(data);
  console.log(JSON.stringify({
    status: "VALID",
    accounts: result.accountsById.size,
    entries: result.entries.length,
  }));
} catch (error) {
  console.error(JSON.stringify({
    status: "ERROR",
    code: error.code === "UNSUPPORTED_VERSION" ? error.code : "INVALID_SNAPSHOT",
    field: error.field || "input",
  }));
  if (debug) {
    console.error("Validation entity:");
    console.error(Object.hasOwn(error, "entity")
      ? inspect(error.entity, { depth: null, maxArrayLength: null, maxStringLength: null, colors: false })
      : "Unavailable: input could not be read or parsed, or validation did not start.");
    console.error(error.stack || String(error));
  }
  process.exitCode = 1;
}
