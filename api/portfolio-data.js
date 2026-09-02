import { getPortfolioFromDb, savePortfolioToDb } from './lib/mongodb.js';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET: Read portfolio data directly from MongoDB Atlas
  if (req.method === 'GET') {
    try {
      const data = await getPortfolioFromDb();
      if (data && data.profile) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=30');
        return res.status(200).json(data);
      }
      return res.status(404).json({ error: 'Portfolio data not found in MongoDB or fallback files' });
    } catch (err) {
      console.error('Error fetching portfolio data from MongoDB:', err);
      return res.status(500).json({
        error: 'Failed to retrieve portfolio data from MongoDB',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // POST or PUT: Save portfolio data directly to MongoDB Atlas
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!payload || !payload.profile) {
        return res.status(400).json({ error: 'Invalid payload: missing profile object' });
      }

      const result = await savePortfolioToDb(payload);

      return res.status(200).json({
        success: true,
        message: 'Portfolio data saved directly to MongoDB Atlas successfully!',
        result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error saving portfolio data to MongoDB:', err);
      return res.status(500).json({
        error: 'Failed to save portfolio data to MongoDB',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
