import express from "express";

import {
  receiveData,
  getLatest,
  getAlerts,
  getHistory,
  testData
} from "../controllers/dataController.js";

const router = express.Router();


// =====================================================
// ESP32 → BACKEND
// =====================================================
router.post("/data", receiveData);


// =====================================================
// DASHBOARD → BACKEND
// =====================================================
router.get("/data", getLatest);
router.get("/alerts", getAlerts);
router.get("/history", getHistory);


// =====================================================
// SOFTWARE SIMULATOR
// =====================================================
router.post("/test-data", testData);


export default router;