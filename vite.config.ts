import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

const BOX_USER_ID = '52559371009';
const BOX_FILE_ID = '2440626249336';
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

function boxApiPlugin(): Plugin {
  return {
    name: 'vite-plugin-box-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // 1. Box Token Endpoint
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

        // 2. Portfolio Data Endpoint (GET / POST)
        if (req.url === '/api/portfolio-data') {
          if (req.method === 'GET') {
            try {
              const tokenData = await generateBoxToken();
              const boxRes = await fetch(`https://api.box.com/2.0/files/${BOX_FILE_ID}/content`, {
                headers: {
                  Authorization: `Bearer ${tokenData.access_token}`,
                  'As-User': BOX_USER_ID,
                },
              });
              if (boxRes.ok) {
                const data = await boxRes.json();
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
                return;
              }
            } catch (err) {
              console.warn('Vite dev Box fetch warning:', err);
            }

            // Fallback to local file
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

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body);
                const tokenData = await generateBoxToken();
                const jsonBlob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
                const formData = new FormData();
                formData.append('file', jsonBlob, 'portfolioData.json');

                const updateRes = await fetch(`https://upload.box.com/api/2.0/files/${BOX_FILE_ID}/content`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    'As-User': BOX_USER_ID,
                  },
                  body: formData,
                });

                // Also update local file
                try {
                  const localFile = path.join(process.cwd(), 'public', 'data', 'portfolioData.json');
                  fs.writeFileSync(localFile, JSON.stringify(parsed, null, 2), 'utf8');
                } catch {
                  // ignore
                }

                if (updateRes.ok) {
                  const result = await updateRes.json();
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, message: 'Updated on Box Storage!', result }));
                } else {
                  const errTxt = await updateRes.text();
                  res.statusCode = updateRes.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Box update failed', details: errTxt }));
                }
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
              }
            });
            return;
          }
        }

        // 3. CV / Resume Endpoint
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
  plugins: [react(), boxApiPlugin()],
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
