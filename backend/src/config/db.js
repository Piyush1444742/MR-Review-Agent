import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

let isMongoConnected = false;
const DB_FILE_PATH = path.resolve('data/db.json');

// Ensure data folder exists
const dataDir = path.dirname(DB_FILE_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(DB_FILE_PATH)) {
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify([], null, 2));
}

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mr-review-agent';
  console.log(`Attempting to connect to MongoDB...`);
  try {
    // Set a short timeout for local connection so it doesn't hang server startup
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.warn('\n⚠️  MongoDB connection failed! Falling back to local file-based database (JSON storage).');
    console.warn(`Local file database path: ${DB_FILE_PATH}\n`);
    isMongoConnected = false;
  }
};

export const getDbStatus = () => ({
  connected: isMongoConnected,
  type: isMongoConnected ? 'MongoDB' : 'JSON File',
  path: isMongoConnected ? 'MongoDB Server' : DB_FILE_PATH,
});

export { isMongoConnected, DB_FILE_PATH };
