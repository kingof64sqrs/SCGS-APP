import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connect } from "./infrastructure/database/mongo.js";
import { startServer } from "./infrastructure/http/server.js";

/** Application entrypoint: connect the database, then start the HTTP server. */
async function bootstrap(): Promise<void> {
  await connect();
  console.log(`Connected to MongoDB (${env.dbName})`);

  const app = createApp();
  startServer(app);
}

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
