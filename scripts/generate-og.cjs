/* eslint-disable @typescript-eslint/no-require-imports */
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: "commonjs",
  moduleResolution: "node",
});

require("ts-node/register/transpile-only");
require("dotenv/config");

const { prisma } = require("../src/lib/prisma");
const { generateAllStaticOgImages } = require("../src/lib/og-static");

(async () => {
  try {
    await generateAllStaticOgImages();
    await prisma.$disconnect();
  } catch (error) {
    console.error("[OG] Static generation failed:", error);
    await prisma.$disconnect().catch(() => {});
    process.exitCode = 1;
  }
})();
