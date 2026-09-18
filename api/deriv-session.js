import { cors, derivRequest, json, readSession, writeSession } from './_lib/session.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const session = readSession(req);
  if (!session.accessToken) return json(res, 401, { connected: false, error: 'Connect your Deriv account first.' });
  try {
    const response = await derivRequest('accounts', session.accessToken);
    const accounts = Array.isArray(response.data) ? response.data : [];
    const selected = accounts.find((account) => account.account_id === session.accountId && account.status === 'active') || accounts.find((account) => account.status === 'active') || accounts[0];
    if (!selected?.account_id) throw new Error('No active Deriv trading account was found.');
    session.accountId = selected.account_id;
    let wsUrl = '';
    let wsError = '';
    try { const otp = await derivRequest(`accounts/${encodeURIComponent(selected.account_id)}/otp`, session.accessToken, { method: 'POST' }); wsUrl = otp.data?.url || ''; if (!wsUrl) wsError = 'Deriv did not return a trading WebSocket URL.'; } catch (error) { wsError = error.message; }
    writeSession(res, session);
    return json(res, 200, { connected: true, account_id: selected.account_id, account_type: selected.account_type || '', balance: Number(selected.balance || 0), currency: selected.currency || '', ws_url: wsUrl, ws_error: wsError });
  } catch (error) { return json(res, 502, { connected: false, error: error.message }); }
}
