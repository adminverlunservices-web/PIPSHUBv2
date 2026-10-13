export const DERIV_APP_ID = '33Qn9yJLubVP6VQ8F5MoG';
const DERIV_REDIRECT_URI = 'https://midnight-pips.site/api/deriv-callback.php';

export function getDerivRedirectUrl() {
  if (window.location.protocol === 'file:') {
    throw new Error('Open PIPSHUB through XAMPP or its hosted URL; OAuth cannot run from a file:// page.');
  }

  const configuredUrl = new URL(DERIV_REDIRECT_URI);
  if (configuredUrl.origin === window.location.origin) {
    return configuredUrl.href;
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const appPath = window.location.pathname
      .replace(/\/index\.html$/i, '')
      .replace(/\/+$/, '');
    return new URL(`${appPath}/api/deriv-callback.php`, window.location.origin).href;
  }

  throw new Error(`The configured Deriv callback must be on this app's origin (${window.location.origin}).`);
}
