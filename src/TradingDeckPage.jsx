import { useEffect, useState } from 'react';
import { apiUrl } from './config';
import './trading-deck.css';

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.5 15.5L20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7H19M8 12H16M11 17H13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 16.5H17L15.5 15V11.2C15.5 9.5 14.2 8 12.5 8H11.5C9.8 8 8.5 9.5 8.5 11.2V15L7 16.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10.2 18.2C10.7 19 11.3 19.3 12 19.3C12.7 19.3 13.3 19 13.8 18.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.5C4 7.6 5.6 6 7.5 6H16.5C18.4 6 20 7.6 20 9.5V16.5C20 18.4 18.4 20 16.5 20H7.5C5.6 20 4 18.4 4 16.5V9.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M15 12H20V16H15C13.9 16 13 15.1 13 14C13 12.9 13.9 12 15 12Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M4 10H20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function TradingDeckPage() {
  const [balance, setBalance] = useState('--');
  const [currency, setCurrency] = useState('USD');
  const [tradeType, setTradeType] = useState('Higher / Lower');
  const [volatility, setVolatility] = useState('Volatility 100 (1s)');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let active = true;

    fetch(apiUrl('api/deriv-session.js'), { credentials: 'include' })
      .then(async (response) => {
        const text = await response.text();
        let payload = {};

        try {
          payload = text ? JSON.parse(text) : {};
        } catch {
          if (active) {
            setBalance('--');
            setCurrency('USD');
          }
          return;
        }

        if (!active) return;

        if (payload && typeof payload.balance === 'number') {
          setBalance(`${payload.balance.toFixed(2)}`);
          setCurrency(payload.currency || 'USD');
        } else {
          setBalance('--');
          setCurrency('USD');
        }
      })
      .catch(() => {
        if (active) {
          setBalance('--');
          setCurrency('USD');
        }
      });

    return () => {
      active = false;
    };
  }, []);

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

        <label className="trading-deck-search" aria-label="Search markets">
          <span className="search-icon"><SearchIcon /></span>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search markets"
            aria-label="Search markets"
          />
          <span className="search-shortcut">⌘ K</span>
        </label>

        <div className="trading-deck-tools">
          <button type="button" className="tool-pill tool-pill-ghost" aria-label="Filter">
            <FilterIcon />
          </button>
          <button type="button" className="tool-pill tool-pill-ghost" aria-label="Notifications">
            <BellIcon />
          </button>
          <button type="button" className="tool-pill tool-pill-notify" aria-label="Alerts">
            <span className="notify-dot"></span>
            <BellIcon />
          </button>
        </div>

        <div className="trading-deck-balance-block">
          <div className="balance-copy">
            <span className="balance-label">DEMO BALANCE</span>
            <strong>{balance === '--' ? '--' : `$${Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`}</strong>
          </div>
          <button type="button" className="deposit-button">
            <WalletIcon />
            <span>Deposit</span>
          </button>
          <div className="debit-badge">JD</div>
        </div>
      </header>

      <div className="trading-deck-controls">
        <label className="selector-card">
          <span className="selector-label">Trade type</span>
          <select value={tradeType} onChange={(event) => setTradeType(event.target.value)} className="selector-native">
            <option>Higher / Lower</option>
            <option>Rise / Fall</option>
            <option>Touch / No Touch</option>
            <option>Even / Odd</option>
          </select>
          <span className="selector-caret">⌄</span>
        </label>

        <label className="selector-card active">
          <span className="selector-label">Volatility</span>
          <select value={volatility} onChange={(event) => setVolatility(event.target.value)} className="selector-native">
            <option>Volatility 100 (1s)</option>
            <option>Volatility 75 (1s)</option>
            <option>Volatility 50 (1s)</option>
            <option>Volatility 10 (1s)</option>
          </select>
          <span className="selector-caret">⌄</span>
        </label>
      </div>
    </div>
  );
}

export default TradingDeckPage;
