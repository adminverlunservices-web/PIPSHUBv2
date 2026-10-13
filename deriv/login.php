<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';
pipshub_start_session();

$verifier = generateCodeVerifier();
$challenge = generateCodeChallenge($verifier);
$state = bin2hex(random_bytes(16));

$_SESSION['code_verifier'] = $verifier;
$_SESSION['state'] = $state;

$query = http_build_query([
    'response_type' => 'code',
    'client_id' => CLIENT_ID,
    'redirect_uri' => REDIRECT_URI,
    'scope' => 'trade account_manage',
    'state' => $state,
    'code_challenge' => $challenge,
    'code_challenge_method' => 'S256',
]);

header('Location: ' . AUTH_URL . '?' . $query, true, 302);
exit;
