import './trading-deck.css';

function TradingDeckPage() {
  return (
    <div className="trading-deck-page">
      <header className="trading-deck-topbar">
        <div className="trading-deck-brand-wrap">
          <button className="trading-deck-menu" type="button" aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className="trading-deck-brand-mark" aria-label="Deriv logo">
            <span className="brand-dot">d</span>
          </div>

          <span className="trading-deck-brand-name">deriv.</span>
          <span className="trading-deck-trade-label">Trade</span>
        </div>

        <div className="trading-deck-search">
          <span className="search-icon">⌕</span>
          <span className="search-text">Search markets</span>
        </div>

        <div className="trading-deck-tools">
          <button type="button" className="tool-pill tool-pill-ghost">⌘</button>
          <button type="button" className="tool-pill tool-pill-ghost">◌</button>
          <button type="button" className="tool-pill tool-pill-notify">
            <span className="notify-dot"></span>
            ◔
          </button>
        </div>

        <div className="trading-deck-balance-block">
          <div className="balance-copy">
            <span className="balance-label">DEMO BALANCE</span>
            <strong>$10,000.00 USD</strong>
          </div>
          <button type="button" className="deposit-button">Deposit</button>
          <div className="debit-badge">JD</div>
        </div>
      </header>

      <div className="trading-deck-controls">
        <div className="selector-card">
          <span className="selector-label">Trade type</span>
          <span className="selector-value">Higher / Lower</span>
          <span className="selector-caret">⌄</span>
        </div>

        <div className="selector-card active">
          <span className="selector-label">Volatility</span>
          <span className="selector-value">Volatility 100 (1s)</span>
          <span className="selector-caret">⌄</span>
        </div>
      </div>
    </div>
  );
}

export default TradingDeckPage;
