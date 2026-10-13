export default function handler(req, res) {
  const market = String(req.query.market || 'R_100').replace(/[^A-Za-z0-9_]/g, '');
  const allowed = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100', '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'];
  const status = allowed.includes(market) ? 200 : 400;
  const payload = status === 200
    ? { ok: true, market, transport: 'wss://ws.derivws.com/websockets/v3' }
    : { error: 'Unsupported market.' };
  return res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').setHeader('Cache-Control', 'no-store').json(payload);
}
