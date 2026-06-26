import mongoose from 'mongoose';
import fs from 'fs';
import { isMongoConnected, DB_FILE_PATH } from '../config/db.js';

// 1. Mongoose Schema Definition
const FindingSchema = new mongoose.Schema({
  file: String,
  lineStart: Number,
  lineEnd: Number,
  category: String,
  severity: String,
  title: String,
  description: String,
  currentCode: String,
  suggestedCode: String,
});

const ReviewSchema = new mongoose.Schema({
  repoName: { type: String, required: true },
  mrId: { type: String, required: true },
  title: { type: String, required: true },
  sourceBranch: String,
  targetBranch: String,
  author: String,
  platform: { type: String, required: true }, // 'github' or 'gitlab'
  score: { type: Number, required: true },
  summary: String,
  pros: [String],
  cons: [String],
  findings: [FindingSchema],
  mrUrl: String,
  createdAt: { type: Date, default: Date.now },
});

const MongooseReview = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

// Helper for JSON File DB operations
const readJsonDb = () => {
  try {
    const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeJsonDb = (data) => {
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

// 2. Unified Review Service API
export const Review = {
  create: async (data) => {
    if (isMongoConnected) {
      return await MongooseReview.create(data);
    } else {
      const records = readJsonDb();
      const newRecord = {
        _id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        ...data,
        createdAt: new Date().toISOString(),
      };
      records.push(newRecord);
      writeJsonDb(records);
      return newRecord;
    }
  },

  find: async (query = {}) => {
    if (isMongoConnected) {
      return await MongooseReview.find(query).sort({ createdAt: -1 });
    } else {
      let records = readJsonDb();
      if (Object.keys(query).length > 0) {
        records = records.filter(record => {
          return Object.entries(query).every(([key, value]) => record[key] === value);
        });
      }
      return records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  findById: async (id) => {
    if (isMongoConnected) {
      return await MongooseReview.findById(id);
    } else {
      const records = readJsonDb();
      const record = records.find(r => r._id === id);
      return record || null;
    }
  },

  findOne: async (query) => {
    if (isMongoConnected) {
      return await MongooseReview.findOne(query);
    } else {
      const records = readJsonDb();
      const record = records.find(r => {
        return Object.entries(query).every(([key, value]) => r[key] === value);
      });
      return record || null;
    }
  }
};
