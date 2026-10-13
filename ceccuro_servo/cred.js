export const DERIV_APP_ID = '33Qn9yJLubVP6VQ8F5MoG';

export function getDerivRedirectUrl() {
  if (window.location.protocol === 'file:') {
    throw new Error('Open PIPSHUB through a web server; OAuth cannot run from a file:// page.');
  }

  const appPath = window.location.pathname.replace(/index\.html$/i, '');
  const basePath = appPath.endsWith('/') ? appPath : `${appPath}/`;
  return new URL(basePath, window.location.origin).href;
}
