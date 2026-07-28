import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";

import { asyncHandler } from "../../core/middleware/async-handler.js";
import { NotFoundError } from "../../core/errors/http-error.js";
import { existsSync } from "node:fs";

export const contentRouter = Router();

const assetsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../assets");
const RULEBOOK_PATH = path.join(assetsDir, "rulebook.pdf");
const RULEBOOK_FILENAME = "SCGS-Rule-Book.pdf";

/**
 * GET /api/rulebook          -> view the rule book PDF inline
 * GET /api/rulebook?download -> force a download (attachment)
 */
contentRouter.get(
  "/rulebook",
  asyncHandler(async (req, res) => {
    if (!existsSync(RULEBOOK_PATH)) {
      throw new NotFoundError("Rule book not available");
    }
    const download = req.query.download !== undefined;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${download ? "attachment" : "inline"}; filename="${RULEBOOK_FILENAME}"`,
    );
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(RULEBOOK_PATH);
  }),
);
