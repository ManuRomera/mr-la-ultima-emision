import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "module.json", "README.md", "RIGHTS.md", "scripts/main.js", "scripts/constants.js", "scripts/compat.js",
  "scripts/state.js", "scripts/station-app.js", "scripts/listener-app.js", "scripts/overlay.js", "scripts/window-state.js",
  "scripts/ui.js", "scripts/macros.js", "scripts/chat.js", "scripts/diagnostics.js", "styles/mr-la-ultima-emision.css",
  "templates/station.hbs", "templates/listener.hbs", "lang/es.json", "lang/en.json", "assets/cover.svg"
];
const errors = [];
for (const file of required) if (!fs.existsSync(path.join(root, file))) errors.push(`Missing ${file}`);
for (const file of ["module.json", "package.json", "lang/es.json", "lang/en.json"]) {
  try { JSON.parse(fs.readFileSync(path.join(root, file), "utf8")); } catch (error) { errors.push(`${file}: invalid JSON (${error.message})`); }
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, "module.json"), "utf8"));
if (manifest.id !== "mr-la-ultima-emision") errors.push("module id must be mr-la-ultima-emision");
if (manifest.title !== "MR-La Última Emisión") errors.push("Foundry display title is incorrect");
if (manifest.compatibility?.minimum !== 13 || manifest.compatibility?.verified !== 14) errors.push("Foundry compatibility must be 13/14");
if (manifest.relationships?.systems || manifest.system || manifest.documentTypes) errors.push("module must stay system agnostic");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
for (const file of walk(path.join(root, "scripts")).filter((file) => file.endsWith(".js"))) {
  try { execFileSync(process.execPath, ["--check", file], { stdio: "pipe" }); }
  catch (error) { errors.push(`${path.relative(root, file)}: syntax error\n${error.stderr?.toString() ?? error.message}`); }
}
const templates = ["templates/station.hbs", "templates/listener.hbs"].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
if (/<textarea[^>]+rows=/i.test(templates)) errors.push("fixed textarea rows detected");
const css = fs.readFileSync(path.join(root, "styles/mr-la-ultima-emision.css"), "utf8");
if (/font-size\s*:\s*[89]px/.test(css)) errors.push("8/9px microtext detected");
if (!css.includes("@container")) errors.push("container queries missing");
if (!fs.readFileSync(path.join(root, "scripts/compat.js"), "utf8").includes("safeRender")) errors.push("safeRender missing");

if (errors.length) { console.error(errors.join("\n\n")); process.exit(1); }
console.log(`OK · ${required.length} required files · system agnostic · syntax valid · MR branding valid`);
