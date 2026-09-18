const configuredApiUrl = import.meta.env.VITE_API_BASE_URL;
const configuredRiseFallUrl = import.meta.env.VITE_RISE_FALL_URL;
const configuredBotUrl = import.meta.env.VITE_BOT_URL;
const configuredDigitsUrl = import.meta.env.VITE_DIGITS_URL;

export const API_BASE_URL = (configuredApiUrl || '').replace(/\/$/, '');
export const RISE_FALL_URL = (configuredRiseFallUrl || '/rise-fall').replace(/\/$/, '');
export const BOT_URL = (configuredBotUrl || '/bot').replace(/\/$/, '');
export const DIGITS_URL = (configuredDigitsUrl || '/digits').replace(/\/$/, '');

export function apiUrl(path) {
  return `${API_BASE_URL}/${path.replace(/^\//, '')}`;
}