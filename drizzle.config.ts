import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// drizzle-kit CLI runs outside Next.js, so we load .env manually
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: false });

export default defineConfig({
  schema:      "./lib/db/schema.ts",
  out:         "./lib/db/migrations",
  dialect:     "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict:  true,
});
