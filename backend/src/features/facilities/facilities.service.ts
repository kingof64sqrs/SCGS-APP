import { findAllFacilities } from "./facilities.model.js";
import type { Facility } from "./facilities.schema.js";

export function listFacilities(): Promise<Facility[]> {
  return findAllFacilities();
}
