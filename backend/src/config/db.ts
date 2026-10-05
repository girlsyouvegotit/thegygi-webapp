import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Connect to MongoDB database
 */
export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.mongoUrl);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Set up connection event handlers
    mongoose.connection.on("error", (error) => {
      console.error(`MongoDB connection error: ${error.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });
  } catch (error) {
    console.error(`MongoDB connection failed: ${(error as Error).message}`);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  } catch (error) {
    console.error(`MongoDB disconnect error: ${(error as Error).message}`);
  }
};

export default mongoose;