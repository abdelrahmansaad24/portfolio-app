import { generateBoxAccessToken } from './box-token.js';
import fs from 'fs';
import path from 'path';

const BOX_USER_ID = process.env.BOX_USER_ID || '52559371009';
const BOX_FILE_ID = process.env.VITE_BOX_FILE_ID || '2440626249336';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET: Fetch live portfolio data directly from Box file
  if (req.method === 'GET') {
    try {
      const tokenData = await generateBoxAccessToken();
      const token = tokenData?.access_token;
      if (token) {
        const boxRes = await fetch(`https://api.box.com/2.0/files/${BOX_FILE_ID}/content`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'As-User': BOX_USER_ID,
          },
        });

        if (boxRes.ok) {
          const liveData = await boxRes.json();
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=30');
          return res.status(200).json(liveData);
        }
      }
    } catch (err) {
      console.warn('Could not load portfolio data from Box API directly:', err);
    }

    // Fallback to local portfolioData.json
    try {
      const localPath = path.join(process.cwd(), 'public', 'data', 'portfolioData.json');
      if (fs.existsSync(localPath)) {
        const content = fs.readFileSync(localPath, 'utf8');
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(content);
      }
    } catch (err) {
      console.warn('Fallback local read error:', err);
    }

    return res.status(500).json({ error: 'Could not retrieve portfolio data' });
  }

  // POST: Update portfolio data directly on Box file
  if (req.method === 'POST') {
    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!payload || !payload.profile) {
        return res.status(400).json({ error: 'Invalid payload: missing profile' });
      }

      const tokenData = await generateBoxAccessToken();
      const token = tokenData?.access_token;
      if (!token) {
        return res.status(500).json({ error: 'Could not generate Box JWT token' });
      }

      const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const formData = new FormData();
      formData.append('file', jsonBlob, 'portfolioData.json');

      const updateRes = await fetch(`https://upload.box.com/api/2.0/files/${BOX_FILE_ID}/content`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'As-User': BOX_USER_ID,
        },
        body: formData,
      });

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        return res.status(updateRes.status).json({
          error: 'Box API update failed',
          details: errText,
        });
      }

      // Also persist to local file if possible
      try {
        const localPath = path.join(process.cwd(), 'public', 'data', 'portfolioData.json');
        fs.writeFileSync(localPath, JSON.stringify(payload, null, 2), 'utf8');
      } catch {
        // ignore in readonly environments
      }

      const result = await updateRes.json();
      return res.status(200).json({
        success: true,
        message: 'Portfolio data updated in Box cloud storage successfully!',
        result,
      });
    } catch (err) {
      console.error('Error saving portfolio data to Box:', err);
      return res.status(500).json({
        error: 'Failed to save portfolio data',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
