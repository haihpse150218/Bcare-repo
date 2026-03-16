// Load .env from monorepo root (skip if env already set, e.g. in Docker)
if (!process.env.DATABASE_URL) {
  const { config } = require("dotenv");
  const { resolve } = require("path");
  config({ path: resolve(__dirname, "../../../.env") });
}

import { buildApp } from "./app";

async function start() {
  const app = await buildApp();
  const port = parseInt(process.env.PORT || "3001");

  try {
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`API server running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
