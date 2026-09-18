import { cors, json } from './_lib/session.js';

export default function handler(req, res) {
  cors(res);
  const market = String(req.query.market || 'R_100').replace(/[^A-Za-z0-9_]/g, '');
  const allowed = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100', '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'];
  if (!allowed.includes(market)) return json(res, 400, { error: 'Unsupported market.' });
  return json(res, 200, { ok: true, market, transport: 'wss://ws.derivws.com/websockets/v3' });
}
