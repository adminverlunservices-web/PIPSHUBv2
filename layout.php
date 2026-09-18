<?php
require_once __DIR__ . '/config.php';
pipshub_start_session();

function pipshub_page(string $title, string $active, string $content): void
{
    $nav = [
        'dashboard' => ['Dashboard', 'index.php'],
        'account' => ['Account Setup', 'account-setup.php'],
        'contracts' => ['Contracts', 'contracts.php'],
        'builder' => ['Bot Builder', 'bot-builder.php'],
        'manual' => ['Manual Trading', 'manual-trading.php'],
        'smart' => ['Smart Trading', 'smart-trading.php'],
        'speed' => ['Speed Bots', 'speed-bots.php'],
        'bots' => ['Trading Bots', 'trading-bots.php'],
        'automated' => ['Automated Bots', 'automated-bots.php'],
        'markets' => ['Market Analysis', 'analysis-tools.php'],
    ];
    ?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= pipshub_escape($title) ?> | PIPSHUB</title>
    <meta name="theme-color" content="#101820">
    <link rel="icon" href="../favicon.png">
    <link rel="stylesheet" href="assets/pipshub.css">
</head>
<body>
    <aside class="sidebar" data-sidebar>
        <a class="brand" href="index.php"><span>VERLUN</span><b>|</b><small>PIPSHUB</small></a>
        <p class="eyebrow">Trading workspace</p>
        <nav>
            <?php foreach ($nav as $key => [$label, $href]): ?>
                <a class="nav-link <?= $active === $key ? 'is-active' : '' ?>" href="<?= $href ?>"><span class="nav-dot"></span><?= $label ?></a>
            <?php endforeach; ?>
        </nav>
        <div class="sidebar-foot">
            <span class="status-dot"></span><span>Deriv link ready</span>
            <a href="https://t.me/derivdominator" target="_blank" rel="noopener">Community ↗</a>
        </div>
    </aside>
    <main class="shell">
        <header class="topbar">
            <button class="icon-button menu-button" data-menu aria-label="Open menu">☰</button>
            <div><p class="eyebrow">VERLUN / PIPSHUB</p><h1><?= pipshub_escape($title) ?></h1></div>
            <div class="top-actions"><span class="connection"><i></i> Live gateway</span><?php if (!empty($_SESSION['deriv_access_token'])): ?><span class="login-button">Connected</span><a class="login-button" href="logout.php">Logout</a><?php else: ?><a class="login-button" href="deriv/login.php">Connect Deriv</a><?php endif; ?></div>
        </header>
        <?= $content ?>
    </main>
    <script src="ceccuro_servo/servo.js?v=20260826-1"></script>
    <script src="ceccuro_servo/privatos.php?v=20260826-1"></script>
    <script src="assets/pipshub.js?v=20260826-5"></script>
</body>
</html>
<?php }
