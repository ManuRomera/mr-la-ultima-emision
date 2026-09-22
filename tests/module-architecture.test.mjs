import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync(new URL("../module.json", import.meta.url), "utf8"));
const station = fs.readFileSync(new URL("../templates/station.hbs", import.meta.url), "utf8");
const listener = fs.readFileSync(new URL("../templates/listener.hbs", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/mr-la-ultima-emision.css", import.meta.url), "utf8");

test("module is system agnostic and branded MR", () => {
  assert.equal(manifest.id, "mr-la-ultima-emision");
  assert.equal(manifest.title, "MR-La Última Emisión");
  assert.equal(manifest.compatibility.minimum, 13);
  assert.equal(manifest.compatibility.verified, 14);
  assert.equal("system" in manifest, false);
  assert.equal("relationships" in manifest, false);
  assert.equal("documentTypes" in manifest, false);
});

test("UI avoids fixed textarea rows and uses local scroll/container layout", () => {
  assert.equal(/<textarea[^>]+rows=/i.test(station + listener), false);
  assert.match(css, /container-type\s*:\s*inline-size/);
  assert.match(css, /overflow\s*:\s*auto/);
  assert.match(css, /@container/);
  assert.equal(/font-size\s*:\s*[89]px/.test(css), false);
});
