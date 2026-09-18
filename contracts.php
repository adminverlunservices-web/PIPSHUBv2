<?php
require __DIR__ . '/layout.php';
ob_start();
?>
<section class="hero-row compact"><div><p class="kicker">Position control</p><h2>Open contracts.</h2><p class="lede">Monitor active trades and close eligible contracts at the current market price.</p></div></section>
<section class="panel table-panel" data-contracts-page>
    <div class="panel-heading"><div><p class="kicker">Live portfolio</p><h3>Open trades</h3></div><span class="badge" data-contracts-status>Connecting</span></div>
    <div class="account-list" data-contract-list><p class="empty-state">Connecting to your Deriv portfolio...</p></div>
    <p data-contracts-message aria-live="polite"></p>
</section>
<?php pipshub_page('Contracts', 'contracts', ob_get_clean());
