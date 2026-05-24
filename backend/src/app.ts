import cors from "cors";
import express, { type Express, type Request, type Response } from "express";

import { errorHandler } from "./core/middleware/error-handler.js";
import { notFoundHandler } from "./core/middleware/not-found.js";
import { requestLogger } from "./core/middleware/request-logger.js";
import { aboutRouter } from "./features/about/about.routes.js";
import { authRouter } from "./features/auth/auth.routes.js";
import { facilitiesRouter } from "./features/facilities/facilities.routes.js";
import { governingBodyRouter } from "./features/governing-body/governing-body.routes.js";
import { membersRouter } from "./features/members/member.routes.js";

/** Assemble the Express application: global middleware + feature routers. */
export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Feature routers.
  app.use("/api/auth", authRouter);
  app.use("/api/members", membersRouter);
  app.use("/api/governing-body", governingBodyRouter);
  app.use("/api/about", aboutRouter);
  app.use("/api/facilities", facilitiesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
