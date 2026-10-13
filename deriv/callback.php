<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
pipshub_start_session();

function pipshub_callback_error(string $message, int $status): never
{
    http_response_code($status);
    header('Content-Type: text/plain; charset=utf-8');
    echo $message;
    exit;
}

$providerError = $_GET['error_description'] ?? $_GET['error'] ?? '';
if (is_string($providerError) && $providerError !== '') {
    pipshub_callback_error($providerError, 400);
}

$code = $_GET['code'] ?? '';
$state = $_GET['state'] ?? '';
$expectedState = $_SESSION['state'] ?? '';
$verifier = $_SESSION['code_verifier'] ?? '';

if (
    !is_string($code) || $code === ''
    || !is_string($state) || $state === ''
    || !is_string($expectedState) || $expectedState === ''
    || !hash_equals($expectedState, $state)
    || !is_string($verifier) || $verifier === ''
) {
    pipshub_callback_error('The authorization response is missing or invalid. Please try connecting again.', 400);
}

if (!function_exists('curl_init')) {
    pipshub_callback_error('The PHP cURL extension is required to complete Deriv authorization.', 500);
}

$curl = curl_init(TOKEN_URL);
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query([
        'grant_type' => 'authorization_code',
        'client_id' => CLIENT_ID,
        'redirect_uri' => REDIRECT_URI,
        'code' => $code,
        'code_verifier' => $verifier,
    ]),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 20,
]);

$response = curl_exec($curl);
$curlError = curl_error($curl);
$status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
curl_close($curl);

if (!is_string($response)) {
    error_log('Deriv OAuth token request failed: ' . $curlError);
    pipshub_callback_error('Could not complete the Deriv authorization request.', 502);
}

$tokens = json_decode($response, true);
$accessToken = is_array($tokens) ? (string) ($tokens['access_token'] ?? $tokens['token'] ?? '') : '';
if ($status < 200 || $status >= 300 || $accessToken === '') {
    error_log('Deriv OAuth token endpoint rejected the authorization response.');
    pipshub_callback_error('Deriv did not accept the authorization response. Please try connecting again.', 502);
}

$_SESSION['access_token'] = preg_replace('/^Bearer\s+/i', '', $accessToken);
$_SESSION['connected_at'] = time();
unset($_SESSION['state'], $_SESSION['code_verifier']);

$appPath = rtrim(str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/deriv/callback.php'))), '/');
header('Location: ' . pipshub_base_url() . $appPath . '/#/', true, 303);
exit;
