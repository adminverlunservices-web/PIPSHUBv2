<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
pipshub_start_session();

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires' => time() - 42000,
        'path' => $params['path'],
        'domain' => $params['domain'],
        'secure' => $params['secure'],
        'httponly' => $params['httponly'],
        'samesite' => 'Lax',
    ]);
}
session_destroy();

$appPath = rtrim(str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/deriv/logout.php'))), '/');
header('Location: ' . pipshub_base_url() . $appPath . '/#/', true, 303);
exit;
