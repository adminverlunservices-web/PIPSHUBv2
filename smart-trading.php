<?php
require __DIR__ . '/layout.php';
ob_start();
?>
<section class="hero-row compact"><div><p class="kicker">Signal assisted</p><h2>Smart trading, less noise.</h2><p class="lede">Combine momentum, digit patterns, and a measured stake plan before you act.</p></div><span class="switch is-on" data-toggle><i></i> Signal engine on</span></section>
<section class="smart-grid"><article class="panel"><div class="panel-heading"><div><p class="kicker">Signal engine</p><h3>Market watchlist</h3></div><span class="live-tag">SCANNING</span></div><div class="watch-row"><b>Volatility 100</b><span>Digit pattern</span><strong class="positive">84%</strong></div><div class="watch-row"><b>Volatility 75</b><span>Momentum</span><strong class="positive">71%</strong></div><div class="watch-row"><b>1HZ10V</b><span>Range break</span><strong class="muted">48%</strong></div></article><article class="panel plan"><p class="kicker">Stake plan</p><h3>Conservative ladder</h3><div class="ladder"><span>1</span><span>1</span><span>2</span><span>3</span><span>5</span></div><label>Maximum attempts<input type="range" min="1" max="10" value="5"></label><button class="primary-button full" data-start-scan>Start scan <span>→</span></button></article></section>
<?php pipshub_page('Smart Trading', 'smart', ob_get_clean());
