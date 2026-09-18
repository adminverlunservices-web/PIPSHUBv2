import { cors, derivRequest, json, readSession, writeSession } from './_lib/session.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const session = readSession(req);
  if (!session.accessToken) return json(res, 401, { error: 'Connect your Deriv account first.' });
  try {
    const response = await derivRequest('accounts', session.accessToken);
    const accounts = Array.isArray(response.data) ? response.data : [];
    const body = typeof req.body === 'string' ? Object.fromEntries(new URLSearchParams(req.body)) : (req.body || {});
    const requestedId = req.method === 'POST' ? String(body.account_id || '') : '';
    if (requestedId && !accounts.some((account) => account.account_id === requestedId)) return json(res, 400, { error: 'That Deriv account is not available.' });
    const selectedId = requestedId || (accounts.some((account) => account.account_id === session.accountId) ? session.accountId : accounts.find((account) => account.status === 'active')?.account_id || accounts[0]?.account_id || '');
    session.accountId = selectedId;
    writeSession(res, session);
    return json(res, 200, { accounts, selected_account_id: selectedId });
  } catch (error) { return json(res, 502, { error: error.message }); }
}
