<?php
require __DIR__ . '/layout.php';
ob_start();
?>
<section class="hero-row compact"><div><p class="kicker">Account control</p><h2>Account setup.</h2><p class="lede">Choose which Deriv account powers your balance and trading session.</p></div></section>
<section class="panel table-panel" data-account-setup>
    <div class="panel-heading"><div><p class="kicker">Available accounts</p><h3>Select an account</h3></div><span class="badge" data-account-setup-status>Loading</span></div>
    <div class="account-list" data-account-list><p class="empty-state">Loading Deriv accounts...</p></div>
    <p data-account-setup-message aria-live="polite"></p>
</section>
<?php pipshub_page('Account Setup', 'account', ob_get_clean());
