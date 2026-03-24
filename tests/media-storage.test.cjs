/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: "commonjs",
  moduleResolution: "node",
  baseUrl: ".",
  paths: {
    "@/*": ["src/*"],
  },
});

require("ts-node/register/transpile-only");
require("tsconfig-paths/register");

const { isManagedUploadPublicPath } = require("../src/lib/media-storage.ts");

test("managed upload public path detects runtime uploads only", () => {
  assert.equal(isManagedUploadPublicPath("/uploads/doctor.webp"), true);
  assert.equal(isManagedUploadPublicPath("/media/doctors/nemeh-ramzi.webp"), false);
  assert.equal(isManagedUploadPublicPath("/documents/file.pdf"), false);
  assert.equal(isManagedUploadPublicPath(null), false);
});
