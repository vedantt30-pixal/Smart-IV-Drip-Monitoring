import { config } from "dotenv";

config();

export const {
  PORT,
  NODE_ENV,
  DB_URI,
} = process.env;

console.log("DB_URI:", DB_URI ? "Loaded" : "Missing");