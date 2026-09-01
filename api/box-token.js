import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

let cachedToken = null;
let tokenExpiresAt = 0;

function getBoxConfig() {
  // 1. Check environment variables first
  if (process.env.BOX_JWT_CONFIG) {
    try {
      return JSON.parse(process.env.BOX_JWT_CONFIG);
    } catch {
      // ignore
    }
  }

  // 2. Check local config json file
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

export async function generateBoxAccessToken() {
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
    throw new Error('Box JWT configuration not found or invalid.');
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

  const base64UrlEncode = (obj) => {
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
    const errData = await res.text();
    throw new Error(`Box OAuth token error (${res.status}): ${errData}`);
  }

  const data = await res.json();
  if (data.access_token) {
    cachedToken = data.access_token;
    tokenExpiresAt = now + (data.expires_in || 3600);
  }

  return data;
}

export default async function handler(req, res) {
  // Enable CORS
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

  try {
    const tokenData = await generateBoxAccessToken();
    res.status(200).json(tokenData);
  } catch (error) {
    console.error('Box token generation error:', error);
    res.status(500).json({
      error: 'Failed to generate Box access token',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
