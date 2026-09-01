import { generateBoxAccessToken } from './box-token.js';
import fs from 'fs';
import path from 'path';

const BOX_USER_ID = process.env.BOX_USER_ID || '52559371009';
const BOX_CV_FILE_ID = process.env.VITE_BOX_CV_FILE_ID || '2440627671737';

export default async function handler(req, res) {
  // CORS
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

  // GET: Stream / serve Resume.pdf directly from Box
  if (req.method === 'GET') {
    try {
      const tokenData = await generateBoxAccessToken();
      const token = tokenData?.access_token;
      if (token) {
        const boxRes = await fetch(`https://api.box.com/2.0/files/${BOX_CV_FILE_ID}/content`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'As-User': BOX_USER_ID,
          },
        });

        if (boxRes.ok) {
          const buffer = Buffer.from(await boxRes.arrayBuffer());
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline; filename="Abdelrahman_Saad_Resume.pdf"');
          res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
          return res.status(200).send(buffer);
        }
      }
    } catch (err) {
      console.warn('Could not fetch CV from Box API:', err);
    }

    // Fallback to local CV file
    const localCandidates = [
      path.join(process.cwd(), 'public', 'cv', 'Resume.pdf'),
      path.join(process.cwd(), 'public', 'cv', 'CV.pdf'),
    ];

    for (const localPath of localCandidates) {
      if (fs.existsSync(localPath)) {
        const buffer = fs.readFileSync(localPath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="Abdelrahman_Saad_Resume.pdf"');
        return res.status(200).send(buffer);
      }
    }

    return res.status(404).json({ error: 'CV document not found' });
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
