import type { Request, Response } from "express";

import { createApp } from "../src/app.js";
import { connect } from "../src/infrastructure/database/mongo.js";

// The Express app is created once per lambda instance; the Mongo client is
// connected lazily on the first request and reused across warm invocations.
const app = createApp();

export default async function handler(req: Request, res: Response): Promise<void> {
  // CORS preflight and the health check must not depend on the database —
  // Express's cors() middleware answers OPTIONS requests without touching it.
  if (req.method === "OPTIONS" || req.url === "/api/health") {
    app(req, res);
    return;
  }

  try {
    await connect();
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    // Respond through plain JSON (with CORS) so browser clients see a real
    // error instead of a failed fetch from Vercel's crash page.
    res.statusCode = 503;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Database unavailable. Check MongoDB Atlas network access (allow 0.0.0.0/0 for Vercel).",
      }),
    );
    return;
  }

  app(req, res);
}
