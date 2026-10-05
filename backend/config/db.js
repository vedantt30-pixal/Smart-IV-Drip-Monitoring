import mongoose from "mongoose";
import { DB_URI } from "./env.js";

const connectDB = async () => {

  try {

    if (!DB_URI) {
      throw new Error("DB_URI is missing from .env");
    }

    await mongoose.connect(DB_URI);

    console.log("MongoDB Connected");

  } catch (err) {

    console.error("MongoDB connection failed:");
    console.error(err.message);

    process.exit(1);
  }
};

export default connectDB;