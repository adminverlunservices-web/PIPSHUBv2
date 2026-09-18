<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/deriv/config.php';
require_once dirname(__DIR__) . '/ceccuro_servo/servo.php';
pipshub_start_session();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$token = trim((string) ($_SESSION['deriv_access_token'] ?? ''));
if ($token === '') {
    http_response_code(401);
    echo json_encode(['error' => 'Connect your Deriv account first.']);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    servo_require_csrf();
}

function deriv_accounts_request(string $token): array
{
    $curl = curl_init('https://api.derivws.com/trading/v1/options/accounts');
    curl_setopt_array($curl, [
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
    if ($error !== '' || $status < 200 || $status >= 300 || !is_array($data)) {
        throw new RuntimeException('Unable to load Deriv accounts.');
    }
    return is_array($data['data'] ?? null) ? $data['data'] : [];
}

try {
    $accounts = deriv_accounts_request($token);
    $requestedId = trim((string) ($_POST['account_id'] ?? ''));
    if ($requestedId !== '') {
        $valid = array_filter($accounts, static fn ($account): bool => is_array($account) && (string) ($account['account_id'] ?? '') === $requestedId);
        if ($valid === []) {
            http_response_code(400);
            echo json_encode(['error' => 'That Deriv account is not available.']);
            exit;
        }
        $_SESSION['deriv_account_id'] = $requestedId;
    }

    $selectedId = (string) ($_SESSION['deriv_account_id'] ?? '');
    if ($selectedId === '' || !array_filter($accounts, static fn ($account): bool => is_array($account) && (string) ($account['account_id'] ?? '') === $selectedId)) {
        $selected = array_values(array_filter($accounts, static fn ($account): bool => is_array($account) && strtolower((string) ($account['status'] ?? '')) === 'active'))[0] ?? ($accounts[0] ?? null);
        $selectedId = is_array($selected) ? (string) ($selected['account_id'] ?? '') : '';
        if ($selectedId !== '') {
            $_SESSION['deriv_account_id'] = $selectedId;
        }
    }

    echo json_encode(['accounts' => $accounts, 'selected_account_id' => $selectedId]);
} catch (Throwable $error) {
    http_response_code(502);
    echo json_encode(['error' => $error->getMessage()]);
}
