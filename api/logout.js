import { clearSession, cors } from './_lib/session.js';

export default function handler(req, res) {
  cors(res);
  clearSession(res);
  res.redirect(303, '/#/');
}
