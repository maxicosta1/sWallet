import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jsDir = join(root, "js");
const htmlPath = join(root, "index.html");
const jsFiles = ["app.js", ...readdirSync(jsDir).filter((file) => file.endsWith(".js")).map((file) => join("js", file))];

const results = [];

function pass(message) {
  results.push({ ok: true, message });
}

function fail(message) {
  results.push({ ok: false, message });
}

function runNodeCheck(file) {
  try {
    execFileSync("node", ["--check", join(root, file)], { stdio: "pipe" });
    pass(`Syntax OK: ${file}`);
  } catch (error) {
    fail(`Syntax error: ${file}\n${String(error.stderr || error.message)}`);
  }
}

function getMatches(source, pattern) {
  return [...source.matchAll(pattern)].map((match) => match[1]);
}

function checkDuplicateIds(html) {
  const ids = getMatches(html, /id="([^"]+)"/g);
  const counts = new Map();
  ids.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
  const duplicates = [...counts.entries()].filter(([, count]) => count > 1);
  if (duplicates.length) {
    fail(`Duplicate ids:\n${duplicates.map(([id, count]) => `- ${id} (${count})`).join("\n")}`);
    return;
  }
  pass("No duplicate ids");
}

function checkDomReferences(html) {
  const ids = new Set(getMatches(html, /id="([^"]+)"/g));
  const refs = new Set();
  jsFiles.forEach((file) => {
    const source = readFileSync(join(root, file), "utf8");
    getMatches(source, /dom\.([A-Za-z_$][\w$]*)/g).forEach((ref) => refs.add(ref));
  });
  const missing = [...refs].filter((ref) => !ids.has(ref)).sort();
  if (missing.length) {
    fail(`Missing DOM ids:\n${missing.map((id) => `- ${id}`).join("\n")}`);
    return;
  }
  pass("No missing DOM ids");
}

function checkStaticEntrypoint(html) {
  if (!html.includes('type="module" src="app.js"')) {
    fail('index.html must load app.js as <script type="module" src="app.js"></script>');
    return;
  }
  pass("Live Server entrypoint OK");
}

if (!existsSync(htmlPath)) fail("Missing index.html");
if (!existsSync(jsDir)) fail("Missing js/ directory");

if (existsSync(htmlPath) && existsSync(jsDir)) {
  const html = readFileSync(htmlPath, "utf8");
  jsFiles.forEach(runNodeCheck);
  checkDuplicateIds(html);
  checkDomReferences(html);
  checkStaticEntrypoint(html);
}

const failed = results.filter((result) => !result.ok);
results.forEach((result) => {
  console.log(`${result.ok ? "[OK]" : "[FAIL]"} ${result.message}`);
});

if (failed.length) {
  process.exitCode = 1;
}
