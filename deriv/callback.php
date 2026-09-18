<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once __DIR__ . '/config.php';
pipshub_start_session();

$error = trim((string) ($_GET['error_description'] ?? $_GET['error'] ?? ''));
$code = trim((string) ($_GET['code'] ?? ''));
$state = trim((string) ($_GET['state'] ?? ''));
$expectedState = (string) ($_SESSION['state'] ?? '');
if ($error !== '' || $code === '' || empty($_SESSION['code_verifier']) || $state === '' || $expectedState === '' || !hash_equals($expectedState, $state)) {
    http_response_code(400);
    $message = $error !== '' ? $error : 'No authorization code was returned by Deriv.';
    ?><!doctype html><html lang="en"><head><meta charset="utf-8"><title>Login failed | PIPSHUB</title><link rel="stylesheet" href="../assets/pipshub.css"></head><body><main class="shell"><section class="panel" style="margin:10vh auto;max-width:520px"><p class="kicker">Authentication</p><h1>Login could not be completed.</h1><p><?= pipshub_escape($message) ?></p><a class="primary-button" href="../index.php">Return to PIPSHUB</a></section></main></body></html><?php
    exit;
}








$tokenRequest = http_build_query([
    'grant_type' => 'authorization_code',
    'client_id' => CLIENT_ID,
    'redirect_uri' => REDIRECT_URI,
    'code' => $code,
    'code_verifier' => $_SESSION['code_verifier'],
]);
$curl = curl_init(TOKEN_URL);
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $tokenRequest,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
    CURLOPT_TIMEOUT => 15,
]);
$response = curl_exec($curl);
$status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$curlError = curl_error($curl);
curl_close($curl);

$tokens = is_string($response) ? json_decode($response, true) : null;
$accessToken = is_array($tokens) ? trim((string) ($tokens['access_token'] ?? $tokens['token'] ?? '')) : '';
$accessToken = preg_replace('/^Bearer\s+/i', '', $accessToken) ?? '';
if ($curlError !== '' || $status < 200 || $status >= 300 || $accessToken === '') {
    http_response_code(502);
    exit('Deriv authentication failed.');
}

$_SESSION['deriv_access_token'] = $accessToken;
$_SESSION['deriv_connected_at'] = time();
unset($_SESSION['deriv_authorization_code'], $_SESSION['code_verifier'], $_SESSION['state']);
session_regenerate_id(true);
session_write_close();
header('Location: ../manual-trading.php', true, 302);
exit;
