import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import express, { type Express, type Request, type Response } from "express";

import { errorHandler } from "./core/middleware/error-handler.js";
import { notFoundHandler } from "./core/middleware/not-found.js";
import { requestLogger } from "./core/middleware/request-logger.js";
import { aboutRouter } from "./features/about/about.routes.js";
import { adminRouter } from "./features/admin/admin.routes.js";
import { authRouter } from "./features/auth/auth.routes.js";
import { facilitiesRouter } from "./features/facilities/facilities.routes.js";
import { governingBodyRouter } from "./features/governing-body/governing-body.routes.js";
import { meRouter } from "./features/me/me.routes.js";
import { membersRouter } from "./features/members/member.routes.js";

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public");

/** Assemble the Express application: middleware + feature routers + admin panel. */
export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "15mb" })); // headroom for base64 photo uploads
  app.use(requestLogger);

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Public + member feature routers.
  app.use("/api/auth", authRouter);
  app.use("/api/members", membersRouter);
  app.use("/api/governing-body", governingBodyRouter);
  app.use("/api/about", aboutRouter);
  app.use("/api/facilities", facilitiesRouter);
  app.use("/api/me", meRouter);

  // Admin API.
  app.use("/api/admin", adminRouter);

  // Static admin panel — open http://<host>:<port>/admin in a browser.
  app.get("/admin", (_req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, "admin", "index.html"));
  });
  app.use(express.static(publicDir));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
