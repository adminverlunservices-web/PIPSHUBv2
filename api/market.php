<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$market = preg_replace('/[^A-Za-z0-9_]/', '', (string) ($_GET['market'] ?? 'R_100'));
$allowed = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100', '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'];
if (!in_array($market, $allowed, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Unsupported market.']);
    exit;
}
echo json_encode([
    'ok' => true,
    'market' => $market,
    'transport' => PIPSHUB_DERIV_WS,
    'message' => 'Use the browser WebSocket for live ticks; this endpoint validates the market selection.',
]);
