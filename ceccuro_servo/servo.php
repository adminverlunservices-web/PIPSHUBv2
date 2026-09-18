<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config.php';
pipshub_start_session();

function servo_security_headers(): void
{
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: same-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    header('Cache-Control: no-store');
}

function servo_csrf_token(): string
{
    if (empty($_SESSION['servo_csrf_token'])) {
        $_SESSION['servo_csrf_token'] = bin2hex(random_bytes(32));
    }
    return (string) $_SESSION['servo_csrf_token'];
}

function servo_require_authentication(): void
{
    if (empty($_SESSION['deriv_access_token'])) {
        http_response_code(401);
        servo_json(['error' => 'Authentication required.']);
    }
}

function servo_require_csrf(): void
{
    $provided = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf_token'] ?? '');
    $expected = (string) ($_SESSION['servo_csrf_token'] ?? '');
    if ($expected === '' || $provided === '' || !hash_equals($expected, $provided)) {
        http_response_code(403);
        servo_json(['error' => 'Invalid security token.']);
    }
}

function servo_json(array $payload): never
{
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

servo_security_headers();
if (basename((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === 'servo.php') {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        header('Allow: GET');
        servo_json(['error' => 'Method not allowed.']);
    }
    servo_json([
        'ok' => true,
        'authenticated' => !empty($_SESSION['deriv_access_token']),
        'csrf_token' => servo_csrf_token(),
    ]);
}
