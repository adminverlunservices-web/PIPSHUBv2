<?php
require 'config.php';
require 'functions.php';
require dirname(__DIR__) . '/config.php';
pipshub_start_session();

$verifier = generateCodeVerifier();
$challenge = generateCodeChallenge($verifier);

$_SESSION['code_verifier'] = $verifier;

$state = bin2hex(random_bytes(16));
$_SESSION['state'] = $state;

$url = AUTH_URL .
"?response_type=code" .
"&client_id=" . CLIENT_ID .
"&redirect_uri=" . urlencode(REDIRECT_URI) .
"&scope=trade account_manage" .
"&state=" . $state .
"&code_challenge=" . $challenge .
"&code_challenge_method=S256";

header("Location: $url");
exit;