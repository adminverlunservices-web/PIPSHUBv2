<?php
declare(strict_types=1);

const PIPSHUB_APP_ID = '34cfy36mQHkAXSzQRebTv';
const PIPSHUB_DERIV_APP_ID = '1089';
const PIPSHUB_SITE = 'https://verlun.site';
const PIPSHUB_DERIV_AUTH = 'https://auth.deriv.com/oauth2/authorize';
const PIPSHUB_DERIV_WS = 'wss://ws.derivws.com/websockets/v3';

function pipshub_start_session(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_name('PIPSHUBSESSID');
        session_set_cookie_params([
            'path' => '/',
            'httponly' => true,
            'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

function pipshub_base_url(): string
{
    $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $host = $_SERVER['HTTP_HOST'] ?? parse_url(PIPSHUB_SITE, PHP_URL_HOST);
    return ($https ? 'https' : 'http') . '://' . $host;
}

function pipshub_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}
