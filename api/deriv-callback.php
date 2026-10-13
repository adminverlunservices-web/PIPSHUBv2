<?php
declare(strict_types=1);

require_once __DIR__ . '/../ceccuro_servo/cred.php';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

if (!isset($appID, $redirectURI) || trim($appID) === '' || filter_var($redirectURI, FILTER_VALIDATE_URL) === false) {
    http_response_code(500);
    exit('Deriv OAuth configuration is missing or invalid.');
}

$requestHost = $_SERVER['HTTP_HOST'] ?? '';
$callbackPath = $_SERVER['SCRIPT_NAME'] ?? '';
if (!preg_match('/\A[a-zA-Z0-9.-]+(?::[0-9]{1,5})?\z/', $requestHost) || $callbackPath === '') {
    http_response_code(400);
    exit('Invalid callback request.');
}

$hostName = strtolower(preg_replace('/:[0-9]+$/', '', $requestHost));
$configuredHost = strtolower((string) parse_url($redirectURI, PHP_URL_HOST));
$configuredPath = parse_url($redirectURI, PHP_URL_PATH);
$isLocalhost = $hostName === 'localhost' || $hostName === '127.0.0.1';
if ($isLocalhost) {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $effectiveRedirectUri = $scheme . '://' . $requestHost . $callbackPath;
} elseif ($hostName === $configuredHost && $callbackPath === $configuredPath) {
    $effectiveRedirectUri = trim($redirectURI);
} else {
    http_response_code(400);
    exit('This callback host or path does not match the configured Deriv redirect URI.');
}

$appPath = dirname(dirname($callbackPath));
if ($appPath === DIRECTORY_SEPARATOR || $appPath === '.') {
    $appPath = '';
}
$redirectScheme = (string) parse_url($effectiveRedirectUri, PHP_URL_SCHEME);
$returnUrl = $redirectScheme . '://' . $requestHost . rtrim(str_replace(DIRECTORY_SEPARATOR, '/', $appPath), '/') . '/';

$config = json_encode(
    [
        'appId' => trim($appID),
        'redirectUri' => $effectiveRedirectUri,
        'returnUrl' => $returnUrl,
    ],
    JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
);
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="referrer" content="no-referrer">
    <title>Deriv login | PIPSHUB</title>
    <style>
      body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f6f3;color:#101820;font:16px system-ui,sans-serif}
      main{width:min(440px,calc(100% - 40px));padding:32px;background:#fff;border:1px solid #dfe5e0}
      h1{font-size:22px;margin:0 0 12px}
      p{color:#59665f;line-height:1.5}
      [role=status]{color:#168a69}
      [role=alert]{color:#b33b36}
    </style>
  </head>
  <body>
    <main>
      <h1>Deriv login</h1>
      <p id="status" role="status">Checking the authorization response…</p>
    </main>
    <script>
      const config = <?= $config ?>;
      const statusElement = document.getElementById('status');
      const fail = (message) => {
        statusElement.setAttribute('role', 'alert');
        statusElement.textContent = message;
      };

      async function completeLogin() {
        const params = new URLSearchParams(window.location.search);
        const oauthError = params.get('error');
        if (oauthError) {
          fail(params.get('error_description') || `Deriv authorization failed: ${oauthError}`);
          return;
        }

        const code = params.get('code');
        const returnedState = params.get('state');
        try {
          const expectedState = sessionStorage.getItem('deriv.oauth.state');
          const verifier = sessionStorage.getItem('deriv.oauth.verifier');
          if (!code || !returnedState || !expectedState || returnedState !== expectedState || !verifier) {
            sessionStorage.removeItem('deriv.oauth.state');
            sessionStorage.removeItem('deriv.oauth.verifier');
            fail('The login response could not be verified. Return to PIPSHUB and try again.');
            return;
          }

          const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: config.appId,
            redirect_uri: config.redirectUri,
            code_verifier: verifier,
          });
          const response = await fetch('https://auth.deriv.com/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
            cache: 'no-store',
          });
          const tokenData = await response.json();
          if (!response.ok || !tokenData.access_token) {
            throw new Error(tokenData.error_description || tokenData.error || 'Token exchange failed.');
          }

          sessionStorage.setItem('deriv.oauth.tokens', JSON.stringify(tokenData));
          sessionStorage.removeItem('deriv.oauth.state');
          sessionStorage.removeItem('deriv.oauth.verifier');
          statusElement.textContent = 'Login successful. Returning to PIPSHUB…';
          window.location.replace(config.returnUrl);
        } catch (error) {
          sessionStorage.removeItem('deriv.oauth.state');
          sessionStorage.removeItem('deriv.oauth.verifier');
          fail(error instanceof Error ? error.message : 'Unable to complete Deriv login.');
        }
      }

      completeLogin();
    </script>
  </body>
</html>
