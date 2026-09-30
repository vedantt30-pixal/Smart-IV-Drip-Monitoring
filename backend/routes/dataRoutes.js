import express from 'express';
import {
    receiveData,
    getLatest,
    getAlerts,
    getHistory
} from '../controllers/dataController.js';

const router = express.Router();

router.post("/data", receiveData);
router.get("/data", getLatest);
router.get("/alerts", getAlerts);
router.get("/history", getHistory);

export default router;
