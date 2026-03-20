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

const {
  isPrismaErrorCode,
  isPrismaMissingTableError,
} = require("../src/lib/prisma-errors.ts");

test("detects prisma error code from known request errors", () => {
  const error = { code: "P2021", clientVersion: "6.19.2" };

  assert.equal(isPrismaErrorCode(error, "P2021"), true);
  assert.equal(isPrismaMissingTableError(error), true);
});

test("ignores non-prisma errors", () => {
  assert.equal(isPrismaErrorCode(new Error("boom"), "P2021"), false);
  assert.equal(isPrismaMissingTableError(null), false);
});
