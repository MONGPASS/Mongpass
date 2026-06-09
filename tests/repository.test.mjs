import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("open-source project files exist", async () => {
  await Promise.all(
    [
      "README.md",
      "LICENSE",
      "CONTRIBUTING.md",
      "CODE_OF_CONDUCT.md",
      "SECURITY.md",
      "CHANGELOG.md",
      "docs/API.md",
      "docs/ARCHITECTURE.md",
      "docs/I18N.md",
      "docs/openapi.json",
    ].map((path) => access(new URL(path, root))),
  );
});

test("OpenAPI document is valid JSON with public paths", async () => {
  const document = JSON.parse(await read("docs/openapi.json"));
  assert.equal(document.openapi, "3.1.0");
  assert.ok(document.paths["/shops"].get);
  assert.ok(document.paths["/community/posts"].get);
});

test("README documents the project identity and setup", async () => {
  const readme = await read("README.md");
  assert.match(readme, /한국 거주 몽골인/);
  assert.match(readme, /npm ci/);
  assert.match(readme, /docs\/API\.md/);
  assert.match(readme, /CONTRIBUTING\.md/);
});

test("example environment file contains no committed secret", async () => {
  const example = await read(".dev.vars.example");
  assert.match(
    example,
    /^AUTH_SECRET=replace-with-a-random-base64url-secret$/m,
  );
});
