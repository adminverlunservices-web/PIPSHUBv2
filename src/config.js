const configuredApiUrl = import.meta.env.VITE_API_BASE_URL;
const configuredTradesUrl = import.meta.env.VITE_TRADES_URL;
export const API_BASE_URL = (configuredApiUrl || '').replace(/\/$/, '');
export const TRADES_URL = (configuredTradesUrl || (import.meta.env.DEV ? 'http://localhost:3002' : '/trades')).replace(/\/$/, '');

export function apiUrl(path) {
  return `${API_BASE_URL}/${path.replace(/^\//, '')}`;
}