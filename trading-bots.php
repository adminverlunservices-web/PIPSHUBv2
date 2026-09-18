<?php
require __DIR__ . '/layout.php';
ob_start();
?>
<section class="hero-row compact"><div><p class="kicker">Strategy catalog</p><h2>Trading bots.</h2><p class="lede">Browse purpose-built templates and send any one of them into the builder.</p></div><a class="primary-button" href="bot-builder.php">Build custom <span>+</span></a></section>
<section class="bot-grid"><article class="bot-card"><div class="bot-top"><span class="bot-icon">▣</span><span class="badge">Template</span></div><h3>Digit Compass</h3><p>Directional digit contracts with a simple confirmation filter.</p><div class="bot-meta"><span>Digits</span><span>Medium</span><b>Use →</b></div></article><article class="bot-card"><div class="bot-top"><span class="bot-icon">⌁</span><span class="badge">Template</span></div><h3>Tick Current</h3><p>Short-cycle rise and fall entries shaped around tick momentum.</p><div class="bot-meta"><span>R_75</span><span>Fast</span><b>Use →</b></div></article><article class="bot-card"><div class="bot-top"><span class="bot-icon">◒</span><span class="badge">Template</span></div><h3>Quiet Range</h3><p>Waits for lower volatility before considering a measured entry.</p><div class="bot-meta"><span>R_50</span><span>Patient</span><b>Use →</b></div></article></section>
<?php pipshub_page('Trading Bots', 'bots', ob_get_clean());
