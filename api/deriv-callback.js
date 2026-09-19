import { cors, json, readSession, writeSession } from './_lib/session.js';

export default async function handler(req, res) {
  cors(res);
  const session = readSession(req);
  const { code = '', state = '', error = '', error_description: description = '' } = req.query;
  if (error || !code || !state || !session.state || state !== session.state || !session.verifier) return json(res, 400, { error: description || error || 'No valid authorization response was returned by Deriv.' });
  const redirectUri = process.env.DERIV_REDIRECT_URI || `${process.env.APP_URL || `https://${req.headers.host}`}/api/deriv-callback.js`;
  try {
    const response = await fetch('https://auth.deriv.com/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', client_id: process.env.DERIV_CLIENT_ID || '33Qn9yJLubVP6VQ8F5MoG', redirect_uri: redirectUri, code, code_verifier: session.verifier }) });
    const tokens = await response.json().catch(() => ({}));
    const accessToken = String(tokens.access_token || tokens.token || '').replace(/^Bearer\s+/i, '');
    if (!response.ok || !accessToken) throw new Error('Deriv authentication failed.');
    writeSession(res, { accessToken, connectedAt: Date.now() });
    return res.redirect(302, '/#/manual');
  } catch (error) { return json(res, 502, { error: error.message }); }
}
