import dotenv from "dotenv";

dotenv.config();

export interface Env {
  mongoUri: string;
  dbName: string;
  port: number;
  nodeEnv: string;
  adminKey: string;
  tokenSecret: string;
}

export const env: Env = {
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017",
  dbName: process.env.DB_NAME ?? "scgs",
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  // Admin panel access key (sent as the `x-admin-key` header).
  adminKey: process.env.ADMIN_KEY ?? "scgs-admin",
  // Secret used to sign member session tokens.
  tokenSecret: process.env.TOKEN_SECRET ?? "scgs-dev-secret-change-me",
};
