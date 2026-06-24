const { copyFileSync } = require("node:fs");
const { join } = require("node:path");

const ROOT = join(__dirname, "..");
const FILES = ["autos.json", "specs.json"];

for (const file of FILES) {
  const src = join(ROOT, "src", "data", "automatch", file);
  const dest = join(ROOT, "public", "data", "automatch", file);
  copyFileSync(src, dest);
  console.log(`Sincronizado: ${file}`);
}

console.log("CATALOGO_SYNC_OK");
