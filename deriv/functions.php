<?php

function base64url_encode($data)
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function generateCodeVerifier($length = 64)
{
    return base64url_encode(random_bytes($length));
}

function generateCodeChallenge($verifier)
{
    return base64url_encode(hash('sha256', $verifier, true));
}