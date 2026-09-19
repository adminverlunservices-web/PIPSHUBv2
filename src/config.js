const configuredApiUrl = import.meta.env.VITE_API_BASE_URL;
const configuredRiseFallUrl = import.meta.env.VITE_RISE_FALL_URL;
const configuredBotUrl = import.meta.env.VITE_BOT_URL;
const configuredDigitsUrl = import.meta.env.VITE_DIGITS_URL;
const configuredAccumulatorsUrl = import.meta.env.VITE_ACCUMULATORS_URL;

export const API_BASE_URL = (configuredApiUrl || '').replace(/\/$/, '');
export const RISE_FALL_APP_URL = (configuredRiseFallUrl || (import.meta.env.DEV ? 'http://localhost:3000' : '')).replace(/\/$/, '');
export const BOT_URL = (configuredBotUrl || (import.meta.env.DEV ? 'http://localhost:4003' : '/bot')).replace(/\/$/, '');
export const DIGITS_URL = (configuredDigitsUrl || '/digits').replace(/\/$/, '');
export const ACCUMULATORS_APP_URL = (configuredAccumulatorsUrl || (import.meta.env.DEV ? 'http://localhost:3001' : '')).replace(/\/$/, '');

export function apiUrl(path) {
  return `${API_BASE_URL}/${path.replace(/^\//, '')}`;
}