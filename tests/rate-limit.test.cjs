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

const { InMemoryRateLimiter } = require("../src/lib/rate-limit.ts");

test("rate limiter blocks after max requests inside the window", () => {
  const limiter = new InMemoryRateLimiter({
    windowMs: 1_000,
    max: 2,
  });

  const first = limiter.consume("admin:1", 1_000);
  const second = limiter.consume("admin:1", 1_001);
  const third = limiter.consume("admin:1", 1_002);

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);
  assert.equal(third.limit, 2);
  assert.ok(third.retryAfterSeconds >= 1);
});

test("rate limiter resets after window expires", () => {
  const limiter = new InMemoryRateLimiter({
    windowMs: 500,
    max: 1,
  });

  const first = limiter.consume("admin:2", 10_000);
  const blocked = limiter.consume("admin:2", 10_001);
  const reset = limiter.consume("admin:2", 10_600);

  assert.equal(first.allowed, true);
  assert.equal(blocked.allowed, false);
  assert.equal(reset.allowed, true);
  assert.equal(reset.remaining, 0);
});
