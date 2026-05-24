import { NotFoundError } from "../../core/errors/http-error.js";
import { findAbout } from "./about.model.js";
import type { AboutContent } from "./about.schema.js";

export async function getAbout(): Promise<AboutContent> {
  const about = await findAbout();
  if (!about) {
    throw new NotFoundError("About content not found");
  }
  return about;
}
