import express from "express";
import connectDB from "./backend/config/db.js";
import { PORT } from "./backend/config/env.js";
import dataRoutes from "./backend/routes/dataRoutes.js";

const app = express();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());


// =====================================================
// CORS
// =====================================================

app.use((req, res, next) => {

  res.header(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );

  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});


// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/health", (req, res) => {

  res.json({
    success: true,
    server: "MedFlow IV Monitoring Backend",
    status: "ONLINE",
    timestamp: new Date()
  });

});


// =====================================================
// API ROUTES
// =====================================================

app.use("/api", dataRoutes);


// =====================================================
// ROOT
// =====================================================

app.get("/", (req, res) => {

  res.json({
    message: "MedFlow IV Monitoring Backend",
    status: "ONLINE",

    endpoints: {
      health: "GET /health",
      latestData: "GET /api/data",
      alerts: "GET /api/alerts",
      history: "GET /api/history",
      esp32: "POST /api/data",
      simulator: "POST /api/test-data"
    }
  });

});


// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {

  console.error(err);

  res.status(500).json({
    error: "Internal server error"
  });

});


// =====================================================
// START SERVER
// =====================================================

const startServer = async () => {

  try {

    await connectDB();

    app.listen(PORT, () => {

      console.log("");
      console.log("====================================");
      console.log(" MedFlow IV Monitoring Backend");
      console.log("====================================");
      console.log(` Server: http://localhost:${PORT}`);
      console.log(` Health: http://localhost:${PORT}/health`);
      console.log(` Data:   http://localhost:${PORT}/api/data`);
      console.log(` Alerts: http://localhost:${PORT}/api/alerts`);
      console.log("====================================");
      console.log("");

    });

  } catch (err) {

    console.error(
      "Failed to start server:",
      err.message
    );

    process.exit(1);
  }
};

startServer();