import crypto from 'node:crypto';

const cookieName = 'pipshub_session';
const sessionSecret = process.env.SESSION_SECRET || 'replace-this-session-secret';

function key() {
  return crypto.createHash('sha256').update(sessionSecret).digest();
}

export function readSession(req) {
  const header = req.headers.cookie || '';
  const value = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  if (!value) return {};
  try {
    const [ivText, tagText, dataText] = value.split('.');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivText, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(dataText, 'base64url')), decipher.final()]).toString('utf8'));
  } catch {
    return {};
  }
}

export function writeSession(res, session) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(session), 'utf8'), cipher.final()]);
  const value = [iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
  res.setHeader('Set-Cookie', `${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`);
}

export function clearSession(res) {
  res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

export function json(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').setHeader('Cache-Control', 'no-store').json(payload);
}

export function cors(res) {
  const origin = process.env.FRONTEND_ORIGIN;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
    res.setHeader('Vary', 'Origin');
  }
}

export async function derivRequest(path, token, options = {}) {
  const response = await fetch(`https://api.derivws.com/trading/v1/options/${path}`, {
    ...options,
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, 'Deriv-App-ID': process.env.DERIV_CLIENT_ID, ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(`Deriv account service rejected the request (${response.status}).`);
  return data;
}
