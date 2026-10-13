<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
pipshub_start_session();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

echo json_encode([
    'connected' => !empty($_SESSION['access_token']),
], JSON_THROW_ON_ERROR);
