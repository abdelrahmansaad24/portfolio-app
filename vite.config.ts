import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { MongoClient, type Db } from 'mongodb';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://Abdelrahman:24102000@cluster0.gemj4ss.mongodb.net/?appName=Cluster0';
const MONGODB_DB = process.env.MONGODB_DB || 'portfolio';
const COLLECTION_NAME = 'portfolio_data';
const DOC_ID = 'portfolio_data';

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

async function getMongoDb(): Promise<Db> {
  if (mongoClient && mongoDb) {
    return mongoDb;
  }
  mongoClient = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });
  await mongoClient.connect();
  mongoDb = mongoClient.db(MONGODB_DB);
  return mongoDb;
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

const BOX_USER_ID = '52559371009';
const BOX_CV_FILE_ID = '2440627671737';

function getBoxConfig() {
  const rootDir = process.cwd();
  const configFiles = ['1536515809__config.json', 'box_config.json', 'config.json'];
  for (const filename of configFiles) {
    const fullPath = path.join(rootDir, filename);
    if (fs.existsSync(fullPath)) {
      try {
        return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      } catch {
        // continue
      }
    }
  }
  return null;
}

async function generateBoxToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && tokenExpiresAt > now + 120) {
    return {
      access_token: cachedToken,
      expires_in: tokenExpiresAt - now,
      token_type: 'bearer',
    };
  }

  const config = getBoxConfig();
  if (!config || !config.boxAppSettings || !config.boxAppSettings.appAuth) {
    throw new Error('Box JWT configuration not found (1536515809__config.json).');
  }

  const appSettings = config.boxAppSettings;
  const appAuth = appSettings.appAuth;

  const privateKey = crypto.createPrivateKey({
    key: appAuth.privateKey,
    passphrase: appAuth.passphrase,
    format: 'pem',
  });

  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: appAuth.publicKeyID,
  };

  const payload = {
    iss: appSettings.clientID,
    sub: config.enterpriseID,
    box_sub_type: 'enterprise',
    aud: 'https://api.box.com/oauth2/token',
    jti: crypto.randomBytes(32).toString('hex'),
    exp: now + 45,
  };

  const base64UrlEncode = (obj: unknown) => {
    const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return Buffer.from(str).toString('base64url');
  };

  const message = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(message);
  const signature = signer.sign(privateKey, 'base64url');
  const assertion = `${message}.${signature}`;

  const params = new URLSearchParams();
  params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
  params.append('client_id', appSettings.clientID);
  params.append('client_secret', appSettings.clientSecret);
  params.append('assertion', assertion);

  const res = await fetch('https://api.box.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Box OAuth token error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number; token_type: string };
  if (data.access_token) {
    cachedToken = data.access_token;
    tokenExpiresAt = now + (data.expires_in || 3600);
  }
  return data;
}

function backendApiPlugin(): Plugin {
  return {
    name: 'vite-plugin-backend-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // 1. MongoDB Status Health Check Endpoint
        if (req.url === '/api/mongo-status') {
          const start = Date.now();
          try {
            const db = await getMongoDb();
            await db.command({ ping: 1 });
            const latency = Date.now() - start;
            const collections = await db.listCollections().toArray();
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                status: 'connected',
                database: db.databaseName,
                latencyMs: latency,
                collections: collections.map((c) => c.name),
                message: `Successfully connected to MongoDB Atlas database "${db.databaseName}" (${latency}ms)!`,
              })
            );
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: false,
                status: 'error',
                message: error instanceof Error ? error.message : String(error),
              })
            );
          }
          return;
        }

        // 2. Box Token Endpoint
        if (req.url === '/api/box-token' || req.url === '/box-token') {
          try {
            const tokenData = await generateBoxToken();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(tokenData));
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
          }
          return;
        }

        // 3. Portfolio Data Endpoint (GET / POST / PUT) - Direct MongoDB Atlas
        const urlWithoutQuery = req.url ? req.url.split('?')[0] : '';
        if (urlWithoutQuery === '/api/portfolio-data') {
          if (req.method === 'GET') {
            try {
              const db = await getMongoDb();
              const collection = db.collection(COLLECTION_NAME);
              const doc = await collection.findOne({ _id: DOC_ID } as any);
              if (doc && (doc as any).profile) {
                const { _id, ...cleanData } = doc as any;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(cleanData));
                return;
              }
            } catch (mongoErr) {
              console.warn('Vite dev MongoDB fetch warning:', mongoErr);
            }

            // Fallback to local file if MongoDB document is not yet found or offline
            const localFile = path.join(process.cwd(), 'public', 'data', 'portfolioData.json');
            if (fs.existsSync(localFile)) {
              res.setHeader('Content-Type', 'application/json');
              res.end(fs.readFileSync(localFile, 'utf8'));
              return;
            }
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Could not fetch portfolio data' }));
            return;
          }

          if (req.method === 'POST' || req.method === 'PUT') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body);
                if (!parsed || !parsed.profile) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Invalid payload: missing profile' }));
                  return;
                }

                const clean = { ...parsed };
                delete clean._id;

                // 1. Direct MongoDB update
                const db = await getMongoDb();
                const collection = db.collection(COLLECTION_NAME);
                const result = await collection.updateOne(
                  { _id: DOC_ID } as any,
                  {
                    $set: {
                      ...clean,
                      updatedAt: new Date().toISOString(),
                    },
                  },
                  { upsert: true }
                );

                // 2. Also save to local file
                try {
                  const localFile = path.join(process.cwd(), 'public', 'data', 'portfolioData.json');
                  fs.writeFileSync(localFile, JSON.stringify(clean, null, 2), 'utf8');
                } catch {
                  // ignore
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    success: true,
                    message: 'Portfolio data saved directly to MongoDB Atlas!',
                    result,
                    timestamp: new Date().toISOString(),
                  })
                );
              } catch (e) {
                console.error('Vite dev MongoDB save error:', e);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
              }
            });
            return;
          }
        }

        // 4. CV / Resume Endpoint
        if (req.url === '/api/cv' || req.url === '/api/resume') {
          try {
            const tokenData = await generateBoxToken();
            const boxRes = await fetch(`https://api.box.com/2.0/files/${BOX_CV_FILE_ID}/content`, {
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                'As-User': BOX_USER_ID,
              },
            });
            if (boxRes.ok) {
              const buffer = Buffer.from(await boxRes.arrayBuffer());
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', 'inline; filename="Abdelrahman_Saad_Resume.pdf"');
              res.end(buffer);
              return;
            }
          } catch (err) {
            console.warn('Vite dev Box CV warning:', err);
          }

          const localCandidates = [
            path.join(process.cwd(), 'public', 'cv', 'Resume.pdf'),
            path.join(process.cwd(), 'public', 'cv', 'CV.pdf'),
          ];
          for (const cand of localCandidates) {
            if (fs.existsSync(cand)) {
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', 'inline; filename="Abdelrahman_Saad_Resume.pdf"');
              res.end(fs.readFileSync(cand));
              return;
            }
          }
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'CV not found' }));
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), backendApiPlugin()],
  css: {
    postcss: {},
  },
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/box-api': {
        target: 'https://api.box.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/box-api/, ''),
        secure: false,
        headers: {
          'As-User': BOX_USER_ID,
        },
      },
      '/box-upload': {
        target: 'https://upload.box.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/box-upload/, ''),
        secure: false,
        headers: {
          'As-User': BOX_USER_ID,
        },
      },
    },
  },
});
