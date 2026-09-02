import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://Abdelrahman:24102000@cluster0.gemj4ss.mongodb.net/?appName=Cluster0';
const MONGODB_DB = process.env.MONGODB_DB || 'portfolio';
const COLLECTION_NAME = 'portfolio_data';
const DOC_ID = 'portfolio_data';

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  await client.connect();
  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getPortfolioFromDb() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const doc = await collection.findOne({ _id: DOC_ID });

    if (doc && doc.profile) {
      const { _id, ...cleanData } = doc;
      return cleanData;
    }
  } catch (err) {
    console.warn('Failed to fetch from MongoDB directly:', err);
  }

  // Fallback to local portfolioData.json
  try {
    const localPath = path.join(process.cwd(), 'public', 'data', 'portfolioData.json');
    if (fs.existsSync(localPath)) {
      const content = JSON.parse(fs.readFileSync(localPath, 'utf8'));
      return content;
    }
  } catch (err) {
    console.warn('Fallback local file read error:', err);
  }

  return null;
}

export async function savePortfolioToDb(payload) {
  if (!payload || !payload.profile) {
    throw new Error('Invalid portfolio payload');
  }

  const cleanPayload = { ...payload };
  delete cleanPayload._id;

  const { db } = await connectToDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection.updateOne(
    { _id: DOC_ID },
    {
      $set: {
        ...cleanPayload,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );

  // Also persist to local file in dev / filesystem if possible
  try {
    const localPath = path.join(process.cwd(), 'public', 'data', 'portfolioData.json');
    fs.writeFileSync(localPath, JSON.stringify(cleanPayload, null, 2), 'utf8');
  } catch {
    // Read-only filesystem in serverless environments
  }

  return result;
}
