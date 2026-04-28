import mongoose from 'mongoose';
import { ENV } from './env.js';

/**
 * Connects to the MongoDB database using the URI provided in environment variables.
 * Handles success and failure with appropriate logs.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI);
    console.log(`MongoDB Connected yeaa`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
