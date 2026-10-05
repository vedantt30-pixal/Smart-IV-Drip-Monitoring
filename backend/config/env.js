import { config } from "dotenv";

config();

export const PORT = process.env.PORT || 3000;

export const NODE_ENV =
  process.env.NODE_ENV || "development";

export const DB_URI =
  process.env.DB_URI;

console.log(
  "DB_URI:",
  DB_URI ? "Loaded" : "Missing"
);