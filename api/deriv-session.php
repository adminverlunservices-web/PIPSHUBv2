<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/deriv/config.php';
pipshub_start_session();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$token = (string) ($_SESSION['deriv_access_token'] ?? '');
$token = trim($token);
if ($token === '') {
    http_response_code(401);
    echo json_encode(['connected' => false, 'error' => 'Connect your Deriv account first.']);
    exit;
}

function deriv_api_request(string $url, string $token, string $method = 'GET'): array
{
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'Deriv-App-ID: ' . CLIENT_ID,
            'Accept: application/json',
        ],
        CURLOPT_TIMEOUT => 15,
    ]);
    $body = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    curl_close($curl);
    $data = is_string($body) ? json_decode($body, true) : null;
    if ($error !== '') {
        throw new RuntimeException('Deriv account service unavailable.');
    }
    if ($status < 200 || $status >= 300) {
        throw new RuntimeException('Deriv account service rejected the session (' . $status . ').');
    }
    if (!is_array($data)) {
        throw new RuntimeException('Deriv returned an invalid account response.');
    }
    return $data;
}

try {
    $accountsResponse = deriv_api_request('https://api.derivws.com/trading/v1/options/accounts', $token);
    $accounts = is_array($accountsResponse['data'] ?? null) ? $accountsResponse['data'] : [];
    $selectedId = (string) ($_SESSION['deriv_account_id'] ?? '');
    $selectedAccounts = array_values(array_filter($accounts, static fn ($account): bool => is_array($account) && (string) ($account['account_id'] ?? '') === $selectedId));
    $activeAccounts = array_values(array_filter($accounts, static fn ($account): bool => is_array($account) && strtolower((string) ($account['status'] ?? '')) === 'active'));
    $account = $selectedAccounts[0] ?? ($activeAccounts[0] ?? ($accounts[0] ?? null));
    if (!is_array($account) || empty($account['account_id'])) {
        throw new RuntimeException('No active Deriv trading account was found.');
    }

    $accountId = (string) $account['account_id'];
    $_SESSION['deriv_account_id'] = $accountId;
    $wsUrl = '';
    $wsError = '';
    try {
        $otpResponse = deriv_api_request('https://api.derivws.com/trading/v1/options/accounts/' . rawurlencode($accountId) . '/otp', $token, 'POST');
        $wsUrl = (string) ($otpResponse['data']['url'] ?? '');
        if ($wsUrl === '') {
            $wsError = 'Deriv did not return a trading WebSocket URL.';
        }
    } catch (Throwable $error) {
        $wsError = $error->getMessage();
    }

    echo json_encode([
        'connected' => true,
        'account_id' => $accountId,
        'account_type' => (string) ($account['account_type'] ?? ''),
        'balance' => (float) ($account['balance'] ?? 0),
        'currency' => (string) ($account['currency'] ?? ''),
        'ws_url' => $wsUrl,
        'ws_error' => $wsError,
    ]);
} catch (Throwable $error) {
    http_response_code(502);
    echo json_encode(['connected' => false, 'error' => $error->getMessage()]);
}
