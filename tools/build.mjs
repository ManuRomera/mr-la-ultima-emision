import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });
await fs.copyFile(path.join(root, "module.json"), path.join(dist, "module.json"));
const out = path.join(dist, "mr-la-ultima-emision.zip");
const excludes = ["dist/*", ".git/*", "node_modules/*", "tests/*", "tools/*", ".github/*", "package.json", ".gitignore"];
const args = ["-qr", out, ".", ...excludes.flatMap((entry) => ["-x", entry])];
await exec("zip", args, { cwd: root });
console.log(out);
