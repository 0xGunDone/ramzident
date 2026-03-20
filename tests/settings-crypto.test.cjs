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
  encryptSettingValue,
  decryptSettingValue,
} = require("../src/lib/settings-crypto.ts");

test("sensitive setting is encrypted and decrypted back", () => {
  const previous = process.env.SETTINGS_ENCRYPTION_KEY;
  process.env.SETTINGS_ENCRYPTION_KEY = "test-secret-key-1234567890";

  try {
    const source = "sk-or-v1-very-secret-key";
    const encrypted = encryptSettingValue(source);
    const decrypted = decryptSettingValue(encrypted);

    assert.notEqual(encrypted, source);
    assert.ok(encrypted.startsWith("enc:v1:"));
    assert.equal(decrypted, source);
  } finally {
    if (previous === undefined) {
      delete process.env.SETTINGS_ENCRYPTION_KEY;
    } else {
      process.env.SETTINGS_ENCRYPTION_KEY = previous;
    }
  }
});

test("plain text value is returned as-is by decrypt", () => {
  assert.equal(decryptSettingValue("plain-value"), "plain-value");
  assert.equal(decryptSettingValue(""), "");
});
