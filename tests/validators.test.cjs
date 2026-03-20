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

const { ApiError } = require("../src/lib/errors.ts");
const {
  doctorAiFillInputSchema,
  parsePayload,
  serviceCreateSchema,
  settingsUpdateSchema,
} = require("../src/lib/validators.ts");

test("service create schema accepts valid payload", () => {
  const payload = parsePayload(serviceCreateSchema, {
    title: "Терапия",
    slug: "terapiya",
    enabled: true,
    description: "Описание услуги",
  });

  assert.equal(payload.title, "Терапия");
  assert.equal(payload.slug, "terapiya");
  assert.equal(payload.enabled, true);
});

test("service create schema rejects empty title", () => {
  assert.throws(
    () =>
      parsePayload(serviceCreateSchema, {
        title: "   ",
      }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 400);
      assert.equal(error.code, "VALIDATION_ERROR");
      return true;
    }
  );
});

test("settings schema allows clearOpenRouterApiKey toggle", () => {
  const payload = parsePayload(settingsUpdateSchema, {
    openRouterApiKey: "",
    clearOpenRouterApiKey: true,
  });

  assert.equal(payload.clearOpenRouterApiKey, true);
  assert.equal(payload.openRouterApiKey, "");
});

test("doctor ai fill schema accepts valid payload", () => {
  const payload = parsePayload(doctorAiFillInputSchema, {
    name: "Немех Рамзи",
    speciality: "Стоматолог общей практики, ортодонт",
    experience: "33 года",
    bio: "",
    education: "Многолетний клинический опыт в лечении взрослых и детей.",
    schedule: "",
  });

  assert.equal(payload.name, "Немех Рамзи");
  assert.equal(payload.speciality, "Стоматолог общей практики, ортодонт");
  assert.equal(payload.education, "Многолетний клинический опыт в лечении взрослых и детей.");
});

test("doctor ai fill schema rejects missing speciality", () => {
  assert.throws(
    () =>
      parsePayload(doctorAiFillInputSchema, {
        name: "Немех Рамзи",
        speciality: "   ",
      }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 400);
      assert.equal(error.code, "VALIDATION_ERROR");
      return true;
    }
  );
});
