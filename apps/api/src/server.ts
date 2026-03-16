// Load .env from monorepo root (skip if env already set, e.g. in Docker)
if (!process.env.DATABASE_URL) {
  const { config } = require("dotenv");
  const { resolve } = require("path");
  config({ path: resolve(__dirname, "../../../.env") });
}

import { buildApp } from "./app";
import { startWorkers, stopWorkers } from "./workers";
import { closeRedisConnection } from "./lib/redis";
import { closeAllQueues } from "./lib/queue";

async function start() {
  const app = await buildApp();
  const port = parseInt(process.env.PORT || "3001");

  try {
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`API server running on http://localhost:${port}`);
    startWorkers();
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  const shutdown = async () => {
    console.log("Shutting down...");
    await stopWorkers();
    await closeAllQueues();
    await closeRedisConnection();
    await app.close();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start();
