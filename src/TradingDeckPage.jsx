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

function LiveFeedChart({ market = 'R_100', onMarketChange }) {
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
          draw();
          socket.send(JSON.stringify({ ticks: market, subscribe: 1 }));
        }

        if (message.tick) {
          prices.push(Number(message.tick.quote));
          times.push(Number(message.tick.epoch || Date.now() / 1000) * 1000);
          if (prices.length > 80) {
            prices.shift();
            times.shift();
          }
          draw();
          setTick(`${Number(message.tick.quote).toFixed(2)} · live`);
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
  return (
    <div className="trading-card-page">
      <div className="trading-card-shell">
        <div className="trading-card-header">
          <h1>Open a trade</h1>
          <button type="button" className="demo-account-button">Demo account</button>
        </div>

        <div className="trading-card-chart-wrap">
          <LiveFeedChart market="R_100" />
        </div>

        <div className="market-title">Volatility 100 Index</div>

        <div className="trade-section">
          <div className="label-line">Contract type</div>
          <div className="contract-toggle">
            <button type="button" className="contract-option selected">
              <span className="contract-arrow up">↗</span>
              Rise
            </button>
            <button type="button" className="contract-option">
              <span className="contract-arrow down">↘</span>
              Fall
            </button>
          </div>
        </div>

        <div className="field-block">
          <div className="label-line">Duration</div>
          <div className="select-box">
            <span>1 minute</span>
            <span className="select-caret">⌄</span>
          </div>
        </div>

        <div className="stake-header">
          <span className="label-line">Stake</span>
          <span className="balance-text">Balance: $10,000.00</span>
        </div>

        <div className="stake-box">
          <button type="button" className="step-button" aria-label="Decrease stake">−</button>
          <div className="stake-value">$ 10.00</div>
          <button type="button" className="step-button" aria-label="Increase stake">+</button>
        </div>

        <div className="quick-stakes">
          <button type="button">$10</button>
          <button type="button">$50</button>
          <button type="button">$100</button>
        </div>

        <div className="summary-panel">
          <div className="summary-row">
            <span>Potential payout</span>
            <strong>$ 19.20</strong>
          </div>
          <div className="summary-row summary-row-profit">
            <span>Profit</span>
            <strong>$ 9.20 (92.0%)</strong>
          </div>
        </div>

        <button type="button" className="trade-button">
          <span className="trade-button-icon">◔</span>
          Trade Rise
        </button>

        <div className="legal-note">
          By placing this trade, you agree to the terms and acknowledge the risks involved.
        </div>
      </div>
    </div>
  );
}

export default TradingDeckPage;
