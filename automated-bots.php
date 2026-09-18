<?php
require __DIR__ . '/layout.php';
ob_start();
?>
<section class="hero-row compact"><div><p class="kicker">Automation library</p><h2>Automated bots.</h2><p class="lede">Manage reusable strategies and keep their running state visible.</p></div><a class="primary-button" href="bot-builder.php">New strategy <span>+</span></a></section>
<section class="panel table-panel"><div class="panel-heading"><div><p class="kicker">Your library</p><h3>Saved strategies</h3></div><span class="badge">0 active</span></div><div class="empty-state"><span>◎</span><h3>No saved bots yet</h3><p>Build a strategy in the visual lab and it will appear here.</p><a class="text-link" href="bot-builder.php">Open Bot Builder →</a></div></section>
<?php pipshub_page('Automated Bots', 'automated', ob_get_clean());
