const configuredApiUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL = (configuredApiUrl || 'https://verlun.site/PIPSHUB').replace(/\/$/, '');

export function apiUrl(path) {
  return `${API_BASE_URL}/${path.replace(/^\//, '')}`;
}