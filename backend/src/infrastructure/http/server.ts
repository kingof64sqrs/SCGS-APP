import type { Express } from "express";
import type { Server } from "node:http";

import { env } from "../../config/env.js";
import { close } from "../database/mongo.js";

/** Start the HTTP server and wire up graceful shutdown. */
export function startServer(app: Express): Server {
  // Explicitly bind to 0.0.0.0 so the service is reachable from other hosts
  const server = app.listen(env.port, "0.0.0.0", () => {
    console.log(`SCGS backend listening on http://0.0.0.0:${env.port}`);
  });

  registerGracefulShutdown(server);
  return server;
}

function registerGracefulShutdown(server: Server): void {
  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\nReceived ${signal}, shutting down gracefully...`);

    server.close(async () => {
      try {
        await close();
        console.log("Database connection closed. Bye.");
        process.exit(0);
      } catch (err) {
        console.error("Error during shutdown:", err);
        process.exit(1);
      }
    });

    // Force-exit if shutdown hangs.
    setTimeout(() => {
      console.error("Forced shutdown after timeout.");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
