import {IVData} from '../models/ivdata.js';
import analyzeData from '../services/alertService.js';

let latestData = {};
let latestCommand = "OPEN";

export const receiveData = async (req, res) => {
    try {
        const { fluid, drip, bubble } = req.body;
        if (fluid == null || drip == null || bubble == null) {
            return res.status(400).json({ error: "Invalid data" });
        }
        const result = analyzeData(fluid, drip, bubble);

        const newData = new IVData({
            fluid, drip, bubble, status: result.status
        });

        await newData.save();
        latestData = newData;
        latestCommand = result.clamp ? "CLAMP" : "OPEN";
        res.json({ command: latestCommand });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
export const getLatest = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const latest = await IVData.findOne().sort({ timestamp: -1 });
    res.json(latest || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getAlerts = async (req, res) => {
  try {
    const alerts = await IVData.find({
      status: { $in: ["CRITICAL", "WARNING"] }
    })
      .sort({ timestamp: -1 })
      .limit(10);

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getHistory = async (req, res) => {
  try {
    const history = await IVData.find()
      .sort({ timestamp: -1 })
      .limit(50);

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};