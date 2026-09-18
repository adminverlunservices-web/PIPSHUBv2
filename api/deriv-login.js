import crypto from 'node:crypto';
import { cors, readSession, writeSession } from './_lib/session.js';

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

export default function handler(req, res) {
  cors(res);
  const state = crypto.randomBytes(16).toString('hex');
  const verifier = base64url(crypto.randomBytes(48));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  const redirectUri = process.env.DERIV_REDIRECT_URI || `${process.env.APP_URL || `https://${req.headers.host}`}/api/deriv-callback.js`;
  const url = new URL('https://auth.deriv.com/oauth2/auth');
  url.search = new URLSearchParams({ response_type: 'code', client_id: process.env.DERIV_CLIENT_ID || '', redirect_uri: redirectUri, scope: 'trade account_manage', state, code_challenge: challenge, code_challenge_method: 'S256' });
  const session = readSession(req);
  writeSession(res, { ...session, state, verifier });
  res.redirect(302, url.toString());
}
