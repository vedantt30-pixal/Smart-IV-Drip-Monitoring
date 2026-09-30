import express from "express";
import cors from "cors";
import connectDB from "./backend/config/db.js";
import { PORT } from "./backend/config/env.js";
import dataRoutes from "./backend/routes/dataRoutes.js";

const app = express();   // 👈 THIS was missing

// middleware
app.use(cors());
app.use(express.json());

// connect DB
connectDB();

// Health check for frontend + basic route
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), server: `http://localhost:${PORT || 3000}` });
});
app.get("/data", (req, res) => {
  res.send("Server is running - use POST /data for ESP32, GET /data for latest");
});
app.use("/api", dataRoutes);


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});