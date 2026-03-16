import { config } from "dotenv";
import { resolve } from "path";

// Load .env from monorepo root for tests
config({ path: resolve(__dirname, "../../../../.env") });
