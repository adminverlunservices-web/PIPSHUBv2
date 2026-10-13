const configuredApiUrl = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = (configuredApiUrl || '').replace(/\/$/, '');

export function apiUrl(path) {
  const baseUrl = API_BASE_URL || import.meta.env.BASE_URL;
  return `${baseUrl.replace(/\/?$/, '/')}${path.replace(/^\//, '')}`;
}