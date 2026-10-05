import { IVData } from "../models/ivdata.js";
import analyzeData from "../services/alertService.js";

// =====================================================
// RECEIVE DATA FROM ESP32
// POST /api/data
// =====================================================
export const receiveData = async (req, res) => {
  try {
    const { fluid, drip, bubble } = req.body;

    if (
      fluid === undefined ||
      drip === undefined ||
      bubble === undefined
    ) {
      return res.status(400).json({
        error: "Invalid data. fluid, drip and bubble are required."
      });
    }

    const result = analyzeData(
      Number(fluid),
      Number(drip),
      Number(bubble)
    );

    const newData = new IVData({
      fluid: Number(fluid),
      drip: Number(drip),
      bubble: Number(bubble),
      status: result.status
    });

    await newData.save();

    console.log(
      `ESP32 DATA → Fluid: ${fluid}% | Drip: ${drip} | Bubble: ${bubble} | Status: ${result.status}`
    );

    // ESP32 receives this response
    res.json({
      success: true,
      command: result.clamp ? "CLAMP" : "OPEN",
      status: result.status
    });

  } catch (err) {
    console.error("receiveData error:", err);

    res.status(500).json({
      error: err.message
    });
  }
};


// =====================================================
// GET LATEST DATA
// GET /api/data
// =====================================================
export const getLatest = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");

    const latest = await IVData
      .findOne()
      .sort({ timestamp: -1 })
      .lean();

    if (!latest) {
      return res.json({
        fluid: 0,
        drip: 0,
        bubble: 0,
        status: "OFFLINE",
        timestamp: null
      });
    }

    res.json(latest);

  } catch (err) {
    console.error("getLatest error:", err);

    res.status(500).json({
      error: err.message
    });
  }
};


// =====================================================
// GET ALERTS
// GET /api/alerts
// =====================================================
export const getAlerts = async (req, res) => {
  try {

    const alerts = await IVData
      .find({
        status: {
          $in: ["CRITICAL", "WARNING"]
        }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    res.json(alerts);

  } catch (err) {
    console.error("getAlerts error:", err);

    res.status(500).json({
      error: err.message
    });
  }
};


// =====================================================
// GET HISTORY
// GET /api/history
// =====================================================
export const getHistory = async (req, res) => {
  try {

    const history = await IVData
      .find()
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    res.json(history);

  } catch (err) {
    console.error("getHistory error:", err);

    res.status(500).json({
      error: err.message
    });
  }
};


// =====================================================
// SOFTWARE TEST / SIMULATOR
// POST /api/test-data
// =====================================================
// This lets us test the entire dashboard WITHOUT ESP32.
// =====================================================
export const testData = async (req, res) => {
  try {

    const {
      fluid = 75,
      drip = 20,
      bubble = 0
    } = req.body;

    const result = analyzeData(
      Number(fluid),
      Number(drip),
      Number(bubble)
    );

    const testReading = new IVData({
      fluid: Number(fluid),
      drip: Number(drip),
      bubble: Number(bubble),
      status: result.status
    });

    await testReading.save();

    console.log(
      `TEST DATA → Fluid: ${fluid}% | Drip: ${drip} | Bubble: ${bubble} | Status: ${result.status}`
    );

    res.json({
      success: true,
      data: testReading,
      command: result.clamp ? "CLAMP" : "OPEN"
    });

  } catch (err) {

    console.error("testData error:", err);

    res.status(500).json({
      error: err.message
    });
  }
};