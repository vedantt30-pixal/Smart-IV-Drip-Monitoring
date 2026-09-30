import mongoose from "mongoose";

const ivSchema = new mongoose.Schema({
    fluid: Number,
    drip: Number,
    bubble: Number,
    status: String,
    timestamp: { type: Date, default: Date.now }
});
export const IVData = mongoose.model("IVData", ivSchema);