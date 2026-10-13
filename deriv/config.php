<?php

require_once dirname(__DIR__) . '/config.php';

defined('CLIENT_ID') || define('CLIENT_ID', PIPSHUB_APP_ID);
defined('REDIRECT_URI') || define(
    'REDIRECT_URI',
    getenv('DERIV_REDIRECT_URI') ?: pipshub_base_url()
        . rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/deriv/login.php')), '/')
        . '/callback.php'
);
defined('AUTH_URL') || define('AUTH_URL', PIPSHUB_DERIV_AUTH);
defined('TOKEN_URL') || define('TOKEN_URL', 'https://auth.deriv.com/oauth2/token');