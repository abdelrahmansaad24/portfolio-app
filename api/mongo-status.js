import { connectToDatabase } from './lib/mongodb.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const start = Date.now();
  try {
    const { db } = await connectToDatabase();
    await db.command({ ping: 1 });
    const latency = Date.now() - start;
    const collections = await db.listCollections().toArray();

    return res.status(200).json({
      success: true,
      status: 'connected',
      database: db.databaseName,
      latencyMs: latency,
      collections: collections.map((c) => c.name),
      message: `Successfully connected to MongoDB Atlas database "${db.databaseName}" (${latency}ms)!`,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      status: 'error',
      message: `MongoDB connection error: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
