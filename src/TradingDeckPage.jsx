import { useEffect, useRef, useState } from 'react';
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

function LiveFeedChart({ market = 'R_100', onMarketChange, onQuoteChange }) {
  const canvasRef = useRef(null);
  const [tick, setTick] = useState('Waiting for tick');
  const [viewType, setViewType] = useState('line');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d');
    const prices = [];
    const times = [];
    let socket;
    let closed = false;

    const draw = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.fillStyle = '#0d1b29';
      context.fillRect(0, 0, width, height);
      context.strokeStyle = 'rgba(255,255,255,0.06)';
      context.lineWidth = 1;

      const plotBottom = height - 26;
      for (let y = 18; y < plotBottom; y += 42) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      for (let x = 0; x < width; x += Math.max(52, width / 5)) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, plotBottom);
        context.stroke();
      }

      if (prices.length < 2) return;

      const low = Math.min(...prices);
      const high = Math.max(...prices);
      const spread = high - low || 1;
      const plotHeight = plotBottom - 18;
      const points = prices.map((price, index) => ({
        x: index * width / (prices.length - 1),
        y: 18 + (high - price) / spread * plotHeight,
      }));

      const drawLine = () => {
        context.beginPath();
        points.forEach(({ x, y }, index) => {
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.strokeStyle = '#dfeaf8';
        context.lineWidth = 1.5;
        context.stroke();
      };

      if (viewType === 'area') {
        context.beginPath();
        points.forEach(({ x, y }, index) => {
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.lineTo(points[points.length - 1].x, plotBottom);
        context.lineTo(points[0].x, plotBottom);
        context.closePath();
        context.fillStyle = 'rgba(103, 133, 168, 0.22)';
        context.fill();
        drawLine();
      } else if (viewType === 'bar') {
        const barWidth = Math.max(3, width / prices.length * 0.65);
        prices.forEach((price, index) => {
          const x = points[index].x;
          const valueY = points[index].y;
          context.fillStyle = index && price >= prices[index - 1] ? '#63d1a1' : '#e76d6d';
          context.fillRect(x - barWidth / 2, valueY, barWidth, plotBottom - valueY);
        });
      } else if (viewType === 'candles') {
        const candleWidth = Math.max(3, width / prices.length * 0.6);
        prices.forEach((price, index) => {
          const x = points[index].x;
          const prev = prices[index - 1] ?? price;
          const openY = 18 + (high - prev) / spread * plotHeight;
          const closeY = points[index].y;
          const highY = 18 + (high - Math.max(prev, price) - spread * 0.03) / spread * plotHeight;
          const lowY = 18 + (high - Math.min(prev, price) + spread * 0.03) / spread * plotHeight;
          const top = Math.min(openY, closeY);
          const bottom = Math.max(openY, closeY);
          const color = price >= prev ? '#63d1a1' : '#e76d6d';
          context.strokeStyle = color;
          context.fillStyle = color;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(x, highY);
          context.lineTo(x, lowY);
          context.stroke();
          context.fillRect(x - candleWidth / 2, top, candleWidth, Math.max(2, bottom - top));
        });
      } else {
        drawLine();
      }

      const latest = points[points.length - 1];
      context.beginPath();
      context.arc(latest.x, latest.y, 4.5, 0, Math.PI * 2);
      context.fillStyle = '#f3f8ff';
      context.fill();
      context.strokeStyle = '#7b8fa7';
      context.stroke();

      const label = Number(prices[prices.length - 1]).toFixed(2);
      const labelWidth = 62;
      const labelHeight = 24;
      const x = width - labelWidth - 8;
      const y = Math.max(8, Math.min(height - labelHeight - 8, latest.y - labelHeight / 2));
      context.fillStyle = '#f3f8ff';
      context.beginPath();
      context.roundRect(x, y, labelWidth, labelHeight, 4);
      context.fill();
      context.fillStyle = '#0d1b29';
      context.font = "600 11px 'Segoe UI', sans-serif";
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(label, x + labelWidth / 2, y + labelHeight / 2 + 1);

      context.fillStyle = 'rgba(220, 228, 240, 0.7)';
      context.font = "10px 'Segoe UI', sans-serif";
      context.textAlign = 'right';
      [high, low + spread / 2, low].forEach((value, index) => {
        context.fillText(value.toFixed(2), width - 8, 18 + index * plotHeight / 2);
      });

      const firstTime = times[0] || Date.now();
      const lastTime = times[times.length - 1] || firstTime;
      const timeRange = Math.max(lastTime - firstTime, 1);
      context.textAlign = 'center';
      context.textBaseline = 'top';
      [0, 0.33, 0.66, 1].forEach((position) => {
        const timestamp = firstTime + timeRange * position;
        context.fillText(new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), width * position, plotBottom + 8);
      });
    };

    try {
      socket = new WebSocket('wss://api.derivws.com/trading/v1/options/ws/public');
      socket.addEventListener('open', () => {
        socket.send(JSON.stringify({ ticks_history: market, end: 'latest', count: 80, style: 'ticks' }));
      });
      socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        if (message.error) setTick(message.error.message || 'Market data unavailable');

        if (message.history?.prices) {
          const historyPrices = message.history.prices.slice(-80);
          historyPrices.forEach((price) => prices.push(Number(price)));
          if (message.history.times) {
            const timesArray = message.history.times.slice(-historyPrices.length);
            times.push(...timesArray.map((value) => Number(value) * 1000));
          } else {
            const now = Date.now();
            historyPrices.forEach((_, index) => times.push(now - (historyPrices.length - index) * 1000));
          }
          const latestHistoryPrice = Number(historyPrices[historyPrices.length - 1]);
          if (Number.isFinite(latestHistoryPrice)) {
            onQuoteChange?.(latestHistoryPrice);
          }
          draw();
          socket.send(JSON.stringify({ ticks: market, subscribe: 1 }));
        }

        if (message.tick) {
          const latestQuote = Number(message.tick.quote);
          prices.push(latestQuote);
          times.push(Number(message.tick.epoch || Date.now() / 1000) * 1000);
          if (prices.length > 80) {
            prices.shift();
            times.shift();
          }
          draw();
          setTick(`${latestQuote.toFixed(2)} · live`);
          if (Number.isFinite(latestQuote)) {
            onQuoteChange?.(latestQuote);
          }
        }
      });
      socket.addEventListener('error', () => setTick('Unable to connect to market data'));
      socket.addEventListener('close', () => {
        if (!closed) setTick('Market data disconnected');
      });
    } catch {
      setTick('Unable to connect to market data');
    }

    draw();
    window.addEventListener('resize', draw);
    return () => {
      closed = true;
      socket?.close();
      window.removeEventListener('resize', draw);
    };
  }, [market, viewType]);

  return (
    <div className="trading-deck-chart">
      <div className="trading-deck-chart-header">
        <div>
          <span className="chart-kicker">Live feed</span>
          <strong>{market}</strong>
        </div>
        <div className="chart-views">
          {['line', 'bar', 'area', 'candles'].map((type) => (
            <button key={type} type="button" className={viewType === type ? 'is-active' : ''} onClick={() => setViewType(type)}>
              {type === 'line' ? 'Line' : type === 'bar' ? 'Bar' : type === 'area' ? 'Area' : 'Candles'}
            </button>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} />
      <div className="trading-deck-chart-footer">
        <span>Deriv live ticks</span>
        <strong>{tick}</strong>
      </div>
    </div>
  );
}

function TradingDeckPage() {
  const [balance, setBalance] = useState('--');
  const [currency, setCurrency] = useState('USD');
  const [tradeType, setTradeType] = useState('Higher / Lower');
  const [market, setMarket] = useState('R_100');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [tradeDirection, setTradeDirection] = useState('rise');
  const [duration, setDuration] = useState('1');
  const [stake, setStake] = useState(10);
  const [digit, setDigit] = useState('5');
  const [multiplier, setMultiplier] = useState('1');
  const [liveQuote, setLiveQuote] = useState(null);
  const marketMeta = {
    R_10: { name: 'Volatility 10 Index', price: 18.42 },
    R_25: { name: 'Volatility 25 Index', price: 36.88 },
    R_50: { name: 'Volatility 50 Index', price: 64.11 },
    R_75: { name: 'Volatility 75 Index', price: 86.42 },
    R_100: { name: 'Volatility 100 Index', price: 119.74 },
    '1HZ10V': { name: 'Volatility 10 (1s) Index', price: 28.91 },
    '1HZ50V': { name: 'Volatility 50 (1s) Index', price: 63.14 },
    '1HZ75V': { name: 'Volatility 75 (1s) Index', price: 82.36 },
    '1HZ100V': { name: 'Volatility 100 (1s) Index', price: 117.82 },
  };
  const tradeTypeOptions = {
    'Higher / Lower': { primary: 'Rise', secondary: 'Fall', primaryValue: 'rise', secondaryValue: 'fall' },
    'Rise / Fall': { primary: 'Rise', secondary: 'Fall', primaryValue: 'rise', secondaryValue: 'fall' },
    'Touch / No Touch': { primary: 'Touch', secondary: 'No Touch', primaryValue: 'touch', secondaryValue: 'noTouch' },
    'Even / Odd': { primary: 'Even', secondary: 'Odd', primaryValue: 'even', secondaryValue: 'odd' },
    'Accumulators': { primary: 'Up', secondary: 'Down', primaryValue: 'up', secondaryValue: 'down' },
    Digits: { primary: 'Over', secondary: 'Under', primaryValue: 'over', secondaryValue: 'under' },
  };
  const activeTradeType = tradeTypeOptions[tradeType] || tradeTypeOptions['Higher / Lower'];
  const currentMarket = marketMeta[market] || marketMeta.R_100;
  const currentPrice = liveQuote ?? currentMarket.price;
  const directionLabel = tradeDirection === activeTradeType.secondaryValue ? activeTradeType.secondary : activeTradeType.primary;
  const isAccumulatorMode = tradeType === 'Accumulators';
  const isDigitsMode = tradeType === 'Digits';
  const navItems = [
    { label: 'Dashboard', href: '#/' },
    { label: 'Trading Deck', href: '#/trading-deck', active: true },
    { label: 'Account Setup', href: '#/account' },
    { label: 'Contracts', href: '#/contracts' },
    { label: 'Manual Trading', href: '#/manual' },
    { label: 'Bot Builder', href: '#/builder' },
  ];

  const payout = Number((stake * 1.92).toFixed(2));
  const profit = Number((payout - stake).toFixed(2));
  const profitPercent = Number(((profit / stake) * 100).toFixed(1));

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
          <button
            className={`trading-deck-menu ${menuOpen ? 'is-open' : ''}`}
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {menuOpen && (
            <nav className="trading-deck-nav-panel" aria-label="Main navigation">
              {navItems.map(({ label, href, active }) => (
                <a
                  key={label}
                  href={href}
                  className={`trading-deck-nav-link ${active ? 'is-active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
            </nav>
          )}

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
          <select
            value={tradeType}
            onChange={(event) => {
              const nextType = event.target.value;
              setTradeType(nextType);
              const nextTradeType = tradeTypeOptions[nextType] || tradeTypeOptions['Higher / Lower'];
              setTradeDirection(nextTradeType.primaryValue);
            }}
            className="selector-native"
          >
            <option>Higher / Lower</option>
            <option>Rise / Fall</option>
            <option>Touch / No Touch</option>
            <option>Even / Odd</option>
            <option>Accumulators</option>
            <option>Digits</option>
          </select>
          <span className="selector-caret">⌄</span>
        </label>

        <label className="selector-card active">
          <span className="selector-label">Volatility</span>
          <select value={market} onChange={(event) => setMarket(event.target.value)} className="selector-native">
            <option value="R_10">Volatility 10 Index</option>
            <option value="R_25">Volatility 25 Index</option>
            <option value="R_50">Volatility 50 Index</option>
            <option value="R_75">Volatility 75 Index</option>
            <option value="R_100">Volatility 100 Index</option>
            <option value="1HZ10V">Volatility 10 (1s) Index</option>
            <option value="1HZ50V">Volatility 50 (1s) Index</option>
            <option value="1HZ75V">Volatility 75 (1s) Index</option>
            <option value="1HZ100V">Volatility 100 (1s) Index</option>
          </select>
          <span className="selector-caret">⌄</span>
        </label>
      </div>

      <div className="trading-deck-live-panel">
        <LiveFeedChart market={market} onMarketChange={setMarket} onQuoteChange={setLiveQuote} />

        <div className="trading-card-wrap">
          <div className="trading-card-shell">
            <div className="trading-card-header">
              <div>
                <span className="trading-card-kicker">Trade</span>
                <h2>{currentMarket.name}</h2>
              </div>
              <button type="button" className="demo-account-button">Demo account</button>
            </div>

            <div className="trading-card-market-row">
              <div className="price-stat">
                <span>Current price</span>
                <strong>{currentPrice.toFixed(2)}</strong>
              </div>
              <span className={`market-trend ${tradeDirection === activeTradeType.secondaryValue ? 'negative' : 'positive'}`}>
                {tradeDirection === activeTradeType.secondaryValue ? '-2.45%' : '+2.45%'}
              </span>
            </div>

            {!isAccumulatorMode && !isDigitsMode ? (
              <div className="trade-chooser">
                <button
                  type="button"
                  className={`trade-option ${tradeDirection === activeTradeType.primaryValue ? 'selected' : ''}`}
                  data-direction={activeTradeType.primaryValue}
                  onClick={() => setTradeDirection(activeTradeType.primaryValue)}
                >
                  <span className="option-arrow up">↗</span>
                  {activeTradeType.primary}
                </button>
                <button
                  type="button"
                  className={`trade-option ${tradeDirection === activeTradeType.secondaryValue ? 'selected' : ''}`}
                  data-direction={activeTradeType.secondaryValue}
                  onClick={() => setTradeDirection(activeTradeType.secondaryValue)}
                >
                  <span className="option-arrow down">↘</span>
                  {activeTradeType.secondary}
                </button>
              </div>
            ) : (
              <div className="trade-chooser">
                <button
                  type="button"
                  className={`trade-option ${tradeDirection === activeTradeType.primaryValue ? 'selected' : ''}`}
                  data-direction={activeTradeType.primaryValue}
                  onClick={() => setTradeDirection(activeTradeType.primaryValue)}
                >
                  <span className="option-arrow up">{isDigitsMode ? '◉' : '↗'}</span>
                  {activeTradeType.primary}
                </button>
                <button
                  type="button"
                  className={`trade-option ${tradeDirection === activeTradeType.secondaryValue ? 'selected' : ''}`}
                  data-direction={activeTradeType.secondaryValue}
                  onClick={() => setTradeDirection(activeTradeType.secondaryValue)}
                >
                  <span className="option-arrow down">{isDigitsMode ? '◌' : '↘'}</span>
                  {activeTradeType.secondary}
                </button>
              </div>
            )}

            <div className="trade-grid">
              {isDigitsMode ? (
                <>
                  <label className="field-box">
                    <span className="field-label">Digit</span>
                    <div className="field-value">
                      <select value={digit} onChange={(event) => setDigit(event.target.value)} className="field-select">
                        {Array.from({ length: 10 }, (_, index) => (
                          <option key={index} value={String(index)}>{index}</option>
                        ))}
                      </select>
                      <span className="field-caret">⌄</span>
                    </div>
                  </label>

                  <label className="field-box">
                    <span className="field-label">Stake</span>
                    <div className="field-value amount-value">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={stake}
                        onChange={(event) => setStake(Math.max(1, Number(event.target.value) || 1))}
                        className="stake-input"
                        aria-label="Stake amount"
                      />
                    </div>
                  </label>
                </>
              ) : isAccumulatorMode ? (
                <>
                  <label className="field-box">
                    <span className="field-label">Duration</span>
                    <div className="field-value">
                      <select value={duration} onChange={(event) => setDuration(event.target.value)} className="field-select">
                        <option value="5">5 minutes</option>
                        <option value="10">10 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                      </select>
                      <span className="field-caret">⌄</span>
                    </div>
                  </label>

                  <label className="field-box">
                    <span className="field-label">Multiplier</span>
                    <div className="field-value">
                      <select value={multiplier} onChange={(event) => setMultiplier(event.target.value)} className="field-select">
                        <option value="1">x1</option>
                        <option value="2">x2</option>
                        <option value="5">x5</option>
                        <option value="10">x10</option>
                      </select>
                      <span className="field-caret">⌄</span>
                    </div>
                  </label>
                </>
              ) : (
                <>
                  <label className="field-box">
                    <span className="field-label">Duration</span>
                    <div className="field-value">
                      <select value={duration} onChange={(event) => setDuration(event.target.value)} className="field-select">
                        <option value="1">1 minute</option>
                        <option value="2">2 minutes</option>
                        <option value="5">5 minutes</option>
                        <option value="10">10 minutes</option>
                      </select>
                      <span className="field-caret">⌄</span>
                    </div>
                  </label>

                  <label className="field-box">
                    <span className="field-label">Stake</span>
                    <div className="field-value amount-value">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={stake}
                        onChange={(event) => setStake(Math.max(1, Number(event.target.value) || 1))}
                        className="stake-input"
                        aria-label="Stake amount"
                      />
                    </div>
                  </label>
                </>
              )}
            </div>

            <div className="stake-controls">
              <button
                type="button"
                className="step-button"
                aria-label="Decrease stake"
                onClick={() => setStake((value) => Math.max(1, value - 1))}
              >
                −
              </button>
              <div className="stake-display">$ {stake.toFixed(2)}</div>
              <button
                type="button"
                className="step-button"
                aria-label="Increase stake"
                onClick={() => setStake((value) => value + 1)}
              >
                +
              </button>
            </div>

            <div className="quick-stakes">
              {[10, 50, 100].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className={stake === amount ? 'is-selected' : ''}
                  onClick={() => setStake(amount)}
                >
                  ${amount}
                </button>
              ))}
            </div>

            <div className="summary-panel">
              <div className="summary-row">
                <span>Potential payout</span>
                <strong>${payout.toFixed(2)}</strong>
              </div>
              <div className="summary-row payout-row">
                <span>Profit</span>
                <strong>${profit.toFixed(2)} ({profitPercent}%)</strong>
              </div>
            </div>

            <button
              type="button"
              className={`trade-submit-button ${tradeDirection === activeTradeType.secondaryValue ? 'is-fall' : 'is-rise'}`}
            >
              <span className="submit-bullet">◔</span>
              Trade {directionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TradingDeckPage;
