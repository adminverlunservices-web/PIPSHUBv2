<?php
session_start();

require 'config.php';

if (!isset($_GET['code'])) {
    die("Authorization code missing.");
}

$code = $_GET['code'];

$post = [
    'grant_type'    => 'authorization_code',
    'client_id'     => CLIENT_ID,
    'redirect_uri'  => REDIRECT_URI,
    'code'          => $code,
    'code_verifier' => $_SESSION['code_verifier']
];

$ch = curl_init(TOKEN_URL);

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query($post),
    CURLOPT_RETURNTRANSFER => true
]);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    die(curl_error($ch));
}

curl_close($ch);


echo $response;
exit;


header ("Location: ../users/bot/");