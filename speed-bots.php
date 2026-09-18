<?php
require __DIR__ . '/layout.php';
ob_start();
?>
<section class="hero-row compact"><div><p class="kicker">Rapid automation</p><h2>Speed bots.</h2><p class="lede">Launch lightweight strategies for short contract cycles with clear limits.</p></div><button class="primary-button" data-run-bot>Run selected <span>▶</span></button></section>
<section class="bot-grid"><article class="bot-card selected"><div class="bot-top"><span class="bot-icon">⚡</span><span class="badge">Ready</span></div><h3>Pulse Five</h3><p>Five-tick digit momentum scanner for synthetic indices.</p><div class="bot-meta"><span>R_100</span><span>5 ticks</span><b>0 runs</b></div></article><article class="bot-card"><div class="bot-top"><span class="bot-icon">◈</span><span class="badge">Ready</span></div><h3>Range Scout</h3><p>Waits for a clean range edge before creating a signal.</p><div class="bot-meta"><span>R_75</span><span>1 min</span><b>0 runs</b></div></article><article class="bot-card"><div class="bot-top"><span class="bot-icon">↗</span><span class="badge">Ready</span></div><h3>Digit Drift</h3><p>Tracks last-digit movement and filters noisy sequences.</p><div class="bot-meta"><span>1HZ10V</span><span>3 ticks</span><b>0 runs</b></div></article></section>
<?php pipshub_page('Speed Bots', 'speed', ob_get_clean());
