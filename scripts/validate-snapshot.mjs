import { readFile } from "node:fs/promises";
import { validateSnapshot } from "../UI/src/snapshot.mjs";
// try {
if (process.argv.length !== 3) throw new Error("USAGE");
const data = JSON.parse(
  (await readFile(process.argv[2], "utf8")).replace(/^\uFEFF/, ""),
);
const result = validateSnapshot(data);
console.log(
  JSON.stringify({
    status: "VALID",
    accounts: result.accountsById.size,
    entries: result.entries.length,
  }),
);
// } catch (error) {
//   console.error(
//     JSON.stringify({
//       status: "ERROR",
//       code:
//         error.code === "UNSUPPORTED_VERSION" ? error.code : "INVALID_SNAPSHOT",
//       field: error.field || "input",
//       value: error.value,
//     }),
//   );
//   process.exitCode = 1;
// }
