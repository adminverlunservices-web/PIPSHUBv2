import { useEffect, useRef, useState } from 'react';
import { apiUrl } from './config';
import { sampleBots } from './sampleBots';
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

function LiveFeedChart({ market = 'R_100', onMarketChange, onQuoteChange, showAccumulatorGuides = false }) {
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
      const currentMarkerX = width * 0.7;
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
        x: index * currentMarkerX / (prices.length - 1),
        y: 18 + (high - price) / spread * plotHeight,
      }));
      const latestPrice = prices[prices.length - 1];
      const guideOffset = Math.max(spread * 0.2, spread * 0.08);
      const guideStart = currentMarkerX;
      const guideEnd = width - 8;
      const guideY = (value) => Math.max(20, Math.min(plotBottom - 2, 18 + (high - value) / spread * plotHeight));
      const drawGuide = (value, label) => {
        const y = guideY(value);

        context.save();
        context.strokeStyle = '#1599e8';
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(guideStart, y);
        context.lineTo(guideEnd, y);
        context.stroke();
        context.fillStyle = '#1599e8';
        context.font = "600 11px 'Segoe UI', sans-serif";
        context.textAlign = 'right';
        context.textBaseline = 'bottom';
        context.fillText(label, guideEnd, y - 5);
        context.restore();
      };

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

      if (showAccumulatorGuides) {
        const upperGuideY = guideY(latestPrice + guideOffset);
        const lowerGuideY = guideY(latestPrice - guideOffset);
        context.save();
        context.fillStyle = 'rgba(29, 129, 198, 0.14)';
        context.fillRect(guideStart, upperGuideY, guideEnd - guideStart, lowerGuideY - upperGuideY);
        context.restore();
        drawGuide(latestPrice + guideOffset, `+${guideOffset.toFixed(5)}`);
        drawGuide(latestPrice - guideOffset, `-${guideOffset.toFixed(5)}`);
      }

      const latest = points[points.length - 1];
      context.save();
      context.setLineDash([3, 5]);
      context.strokeStyle = 'rgba(243, 248, 255, 0.9)';
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(guideStart, latest.y);
      context.lineTo(guideEnd, latest.y);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = '#f3f8ff';
      context.font = "600 10px 'Segoe UI', sans-serif";
      context.textAlign = 'left';
      context.textBaseline = 'bottom';
      context.fillText(`Current ${latestPrice.toFixed(2)}`, 8, latest.y - 4);
      context.restore();

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
  }, [market, viewType, showAccumulatorGuides]);

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
  const [accountType, setAccountType] = useState('demo');
  const [accountSwitching, setAccountSwitching] = useState(false);
  const [localTime, setLocalTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [tradeType, setTradeType] = useState('Higher / Lower');
  const [market, setMarket] = useState('R_100');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [tradeDirection, setTradeDirection] = useState('rise');
  const [duration, setDuration] = useState('1');
  const [durationUnit, setDurationUnit] = useState('m');
  const [stake, setStake] = useState(10);
  const [allowEquals, setAllowEquals] = useState(false);
  const [martingaleEnabled, setMartingaleEnabled] = useState(false);
  const [dalembertEnabled, setDalembertEnabled] = useState(false);
  const [stakeMultiplier, setStakeMultiplier] = useState('2');
  const [maxStake, setMaxStake] = useState('');
  const [barrier, setBarrier] = useState('0');
  const [digit, setDigit] = useState('5');
  const [growthRate, setGrowthRate] = useState('2');
  const [takeProfit, setTakeProfit] = useState('20');
  const [stopProfit, setStopProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [liveQuote, setLiveQuote] = useState(null);
  const [tradeStatus, setTradeStatus] = useState('Ready');
  const [tradeSuccessMessage, setTradeSuccessMessage] = useState('');
  const [loadedBot, setLoadedBot] = useState(null);
  const [activeTradesMinimized, setActiveTradesMinimized] = useState(true);
  const [activeTrades, setActiveTrades] = useState([]);
  const [autoBotRunning, setAutoBotRunning] = useState(false);
  const [positionsOpen, setPositionsOpen] = useState(false);
  const [positionsTab, setPositionsTab] = useState('open');
  const [closedTrades, setClosedTrades] = useState([]);
  const [closedTradesLoading, setClosedTradesLoading] = useState(false);
  const [botsOpen, setBotsOpen] = useState(false);
  const [smartTradingOpen, setSmartTradingOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const socketRef = useRef(null);
  const takeProfitTriggeredRef = useRef(new Set());
  const stopTriggeredRef = useRef(new Set());
  const autoBotRepeatScheduledRef = useRef(new Set());
  const autoBotRunningRef = useRef(false);
  const marketMeta = {
    R_10: { name: 'Volatility 10 Index', price: 18.42 },
    R_25: { name: 'Volatility 25 Index', price: 36.88 },
    R_50: { name: 'Volatility 50 Index', price: 64.11 },
    R_75: { name: 'Volatility 75 Index', price: 86.42 },
    R_100: { name: 'Volatility 100 Index', price: 119.74 },
    '1HZ10V': { name: 'Volatility 10 (1s) Index', price: 28.91 },
    '1HZ25V': { name: 'Volatility 25 (1s) Index', price: 44.27 },
    '1HZ50V': { name: 'Volatility 50 (1s) Index', price: 63.14 },
    '1HZ75V': { name: 'Volatility 75 (1s) Index', price: 82.36 },
    '1HZ100V': { name: 'Volatility 100 (1s) Index', price: 117.82 },
    RDBEAR: { name: 'Range Break Bear Index', price: 96.24 },
    RDBULL: { name: 'Range Break Bull Index', price: 103.76 },
  };
  const tradeTypeOptions = {
    'Derived Markets': { primary: 'Higher', secondary: 'Lower', primaryValue: 'rise', secondaryValue: 'fall' },
    'Higher / Lower': { primary: 'Higher', secondary: 'Lower', primaryValue: 'rise', secondaryValue: 'fall' },
    'Rise / Fall': { primary: 'Rise', secondary: 'Fall', primaryValue: 'rise', secondaryValue: 'fall' },
    'Touch / No Touch': { primary: 'Touch', secondary: 'No Touch', primaryValue: 'touch', secondaryValue: 'noTouch' },
    'Even / Odd': { primary: 'Even', secondary: 'Odd', primaryValue: 'even', secondaryValue: 'odd' },
    'Accumulators': { primary: 'Up', secondary: 'Down', primaryValue: 'up', secondaryValue: 'down' },
    Digits: { primary: 'Over', secondary: 'Under', primaryValue: 'over', secondaryValue: 'under' },
    'Matches & Differs': { primary: 'Matches', secondary: 'Differs', primaryValue: 'matches', secondaryValue: 'differs' },
  };
  const syntheticMarkets = {
    'Derived Markets': ['R_10', 'R_25', 'R_50', 'R_75', 'R_100', '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V', 'RDBEAR', 'RDBULL'],
    'Higher / Lower': ['R_10', 'R_25', 'R_50', 'R_75', 'R_100', 'RDBEAR', 'RDBULL'],
    'Rise / Fall': ['R_10', 'R_25', 'R_50', 'R_75', 'R_100', '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V', 'RDBEAR', 'RDBULL'],
    'Touch / No Touch': ['R_10', 'R_25', 'R_50', 'R_75', 'R_100', 'RDBEAR', 'RDBULL'],
    'Even / Odd': ['1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'],
    Accumulators: ['R_10', 'R_25', 'R_50', 'R_75', 'R_100', 'RDBEAR', 'RDBULL'],
    Digits: ['1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'],
    'Matches & Differs': ['1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'],
  };
  const activeTradeType = tradeTypeOptions[tradeType] || tradeTypeOptions['Higher / Lower'];
  const availableMarkets = syntheticMarkets[tradeType] || syntheticMarkets['Higher / Lower'];
  const currentMarket = marketMeta[market] || marketMeta.R_100;
  const currentPrice = liveQuote ?? currentMarket.price;
  const directionLabel = tradeDirection === activeTradeType.secondaryValue ? activeTradeType.secondary : activeTradeType.primary;
  const isAccumulatorMode = tradeType === 'Accumulators';
  const isDigitsMode = tradeType === 'Digits' || tradeType === 'Matches & Differs';
  const tradeContractType = ['fall', 'down', 'odd', 'noTouch', 'under', 'differs'].includes(tradeDirection) ? 'PUT' : 'CALL';
  const navItems = [
    { label: 'Dashboard', href: '#/' },
    { label: 'Trading Deck', href: '#/trading-deck', active: true },
    { label: 'Account Setup', href: '#/account' },
    { label: 'Contracts', href: '#/contracts' },
    { label: 'Bot Builder', href: '#/builder' },
  ];

  const marketMovement = currentMarket.price > 0 ? currentPrice / currentMarket.price : 1;
  const payout = Number((Number(stake) * 1.92 * marketMovement).toFixed(2));
  const accumulatorPayout = Number((Number(stake) * (1 + Number(growthRate) / 100) * marketMovement).toFixed(2));
  const displayedPayout = isAccumulatorMode ? accumulatorPayout : payout;
  const profit = Number((displayedPayout - stake).toFixed(2));
  const profitPercent = Number(((profit / stake) * 100).toFixed(1));
  const loadedBotScript = loadedBot?.script
    || (Array.isArray(loadedBot?.scripts) ? loadedBot.scripts.join('\n') : '');
  const isAutoBot = Boolean(loadedBot && loadedBot.format !== 'xml');

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setLocalTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    try {
      const storedBot = localStorage.getItem('pipshub:selected-bot');
      if (storedBot) {
        const parsedBot = JSON.parse(storedBot);
        if (parsedBot && typeof parsedBot.name === 'string' && parsedBot.name.trim()) {
          setLoadedBot(parsedBot);
          if (typeof parsedBot.market === 'string' && marketMeta[parsedBot.market]) setMarket(parsedBot.market);
          if (typeof parsedBot.tradeType === 'string' && tradeTypeOptions[parsedBot.tradeType]) {
            setTradeType(parsedBot.tradeType);
            setTradeDirection(tradeTypeOptions[parsedBot.tradeType].primaryValue);
          }
        }
      }
    } catch {
      localStorage.removeItem('pipshub:selected-bot');
    }
  }, []);

  useEffect(() => {
    if (!tradeSuccessMessage) return undefined;

    const timeoutId = window.setTimeout(() => setTradeSuccessMessage(''), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [tradeSuccessMessage]);

  useEffect(() => {
    if (!positionsOpen || positionsTab !== 'closed') return undefined;

    let socket;
    let active = true;
    setClosedTradesLoading(true);

    fetch(apiUrl('api/deriv-session.js'), { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.ws_url) throw new Error(data.error || data.ws_error || 'Unable to load closed positions.');
        return data.ws_url;
      })
      .then((wsUrl) => {
        if (!active) return;
        socket = new WebSocket(wsUrl);
        socket.addEventListener('open', () => {
          socket.send(JSON.stringify({ profit_table: 1, description: 1, sort: 'DESC', limit: 50 }));
        });
        socket.addEventListener('message', (event) => {
          const message = JSON.parse(event.data);
          if (message.error) {
            if (active) setClosedTradesLoading(false);
            socket.close();
            return;
          }
          if (message.profit_table) {
            const transactions = Array.isArray(message.profit_table.transactions) ? message.profit_table.transactions : [];
            setClosedTrades(transactions.map((trade) => {
              const profit = Number(trade.sell_price || 0) - Number(trade.buy_price || 0);
              return {
                id: trade.contract_id,
                symbol: trade.underlying_symbol || 'Unknown market',
                direction: trade.contract_type || 'Contract',
                status: profit >= 0 ? 'Won' : 'Lost',
                stake: Number(trade.buy_price || 0),
                price: Number(trade.sell_price || 0),
                profit,
                closedAt: trade.sell_time ? new Date(Number(trade.sell_time) * 1000).toLocaleString() : 'Closed',
              };
            }));
            setClosedTradesLoading(false);
            socket.close();
          }
        });
        socket.addEventListener('error', () => {
          if (active) setClosedTradesLoading(false);
        });
      })
      .catch(() => {
        if (active) setClosedTradesLoading(false);
      });

    return () => {
      active = false;
      socket?.close();
    };
  }, [positionsOpen, positionsTab]);

  const stopTrade = (tradeId) => {
    setActiveTrades((current) => {
      const nextTrades = current.filter((trade) => trade.id !== tradeId);
      if (nextTrades.length === 0) setActiveTradesMinimized(true);
      return nextTrades;
    });
  };

  const switchAccount = () => {
    if (accountSwitching) return;

    setAccountSwitching(true);
    fetch(apiUrl('api/deriv-accounts.js'), { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load accounts.');
        const target = data.accounts?.find((account) => account.account_type !== accountType && account.status === 'active');
        if (!target) throw new Error(`No ${accountType === 'real' ? 'demo' : 'real'} account is available.`);

        const body = new URLSearchParams({ account_id: target.account_id });
        const switchResponse = await fetch(apiUrl('api/deriv-accounts.js'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });
        const switched = await switchResponse.json();
        if (!switchResponse.ok) throw new Error(switched.error || 'Unable to switch account.');
        return target;
      })
      .then((target) => {
        setAccountType(target.account_type === 'real' ? 'real' : 'demo');
        setBalance(Number(target.balance || 0).toFixed(2));
        setCurrency(target.currency || 'USD');
      })
      .catch((error) => setTradeStatus(error.message))
      .finally(() => setAccountSwitching(false));
  };

  const loadBot = (bot) => {
    setLoadedBot(bot);
    autoBotRunningRef.current = false;
    setAutoBotRunning(false);
    if (typeof bot.market === 'string' && marketMeta[bot.market]) setMarket(bot.market);
    if (typeof bot.tradeType === 'string' && tradeTypeOptions[bot.tradeType]) {
      setTradeType(bot.tradeType);
      setTradeDirection(tradeTypeOptions[bot.tradeType].primaryValue);
    }
    localStorage.setItem('pipshub:selected-bot', JSON.stringify(bot));
    setBotsOpen(false);
  };

  const startAutoBot = () => {
    if (!isAutoBot) return;
    const profitLimit = Number(stopProfit);
    const lossLimit = Number(stopLoss);
    if (!Number.isFinite(profitLimit) || profitLimit <= 0 || !Number.isFinite(lossLimit) || lossLimit <= 0) {
      setTradeStatus(`Set both a profit limit and a loss limit before starting ${loadedBot.name}.`);
      return;
    }
    autoBotRunningRef.current = true;
    setAutoBotRunning(true);
    openTrade();
  };

  const stopAutoBot = () => {
    autoBotRunningRef.current = false;
    setAutoBotRunning(false);
    setTradeStatus(`${loadedBot?.name || 'Bot'} stopped. The current contract will finish normally.`);
  };

  const openTrade = ({ smart = false } = {}) => {
    if (isAutoBot && !autoBotRunningRef.current) return;

    const selectedStake = Number(stake);
    const selectedDuration = Number(duration);
    const selectedDurationUnit = durationUnit;
    const selectedProfitStop = stopProfit;
    const selectedLossStop = stopLoss;
    const selectedMaxStake = Number(maxStake);
    const amount = selectedStake;
    const contractDuration = selectedDuration;

    if (!Number.isFinite(amount) || amount < 0.35 || (smart && Number.isFinite(selectedMaxStake) && selectedMaxStake > 0 && amount > selectedMaxStake)) {
      if (smart && Number.isFinite(selectedMaxStake) && selectedMaxStake > 0 && amount > selectedMaxStake) {
        setTradeStatus('Initial stake cannot exceed the Smart Trading max. stake.');
        return;
      }
      setTradeStatus('Enter a valid stake of at least $0.35.');
      return;
    }
    if (!Number.isFinite(contractDuration) || contractDuration < 1) {
      setTradeStatus('Enter a valid duration of at least 1.');
      return;
    }

    setTradeStatus('Requesting a live contract...');

    fetch(apiUrl('api/deriv-session.js'), { credentials: 'include' })
      .then(async (response) => {
        const text = await response.text();
        let data = {};

        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          throw new Error('Live trading is unavailable on this deployment.');
        }

        if (!response.ok || !data.ws_url) {
          throw new Error(data.error || data.ws_error || 'Live trading is unavailable on this deployment.');
        }

        if (isAutoBot && !autoBotRunningRef.current) return;

        const socket = new WebSocket(data.ws_url);
        socketRef.current = socket;

        socket.addEventListener('message', (event) => {
          const message = JSON.parse(event.data);

          if (message.error) {
            setTradeStatus(message.error.message || 'Unable to create the contract.');
            socket.close();
            return;
          }

          if (message.proposal_open_contract) {
            const contract = message.proposal_open_contract;
            const contractId = Number(contract.contract_id);
            const profit = Number(contract.profit || 0);
            const target = Number(takeProfit);
            const profitStop = Number(selectedProfitStop);
            const lossStop = Number(selectedLossStop);
            const reachedProfitStop = Number.isFinite(profitStop) && profitStop > 0 && profit >= profitStop;
            const reachedLossStop = Number.isFinite(lossStop) && lossStop > 0 && profit <= -lossStop;

            if (isAccumulatorMode && Number.isFinite(contractId) && profit >= target && !takeProfitTriggeredRef.current.has(contractId) && !stopTriggeredRef.current.has(contractId)) {
              takeProfitTriggeredRef.current.add(contractId);
              setTradeStatus(`Take profit reached. Closing contract ${contractId}...`);
              socket.send(JSON.stringify({
                sell: contractId,
                price: Number(contract.bid_price || 0),
              }));
            }

            if (Number.isFinite(contractId) && (reachedProfitStop || reachedLossStop) && !stopTriggeredRef.current.has(contractId) && !takeProfitTriggeredRef.current.has(contractId)) {
              stopTriggeredRef.current.add(contractId);
              setTradeStatus(`${reachedProfitStop ? 'Profit' : 'Loss'} stop reached. Closing contract ${contractId}...`);
              socket.send(JSON.stringify({
                sell: contractId,
                price: Number(contract.bid_price || 0),
              }));
            }

            if (Number(contract.is_sold) === 1 || Number(contract.is_expired) === 1 || contract.status !== 'open') {
              setActiveTrades((current) => {
                const nextTrades = current.filter((trade) => trade.id !== contractId);
                if (nextTrades.length === 0) setActiveTradesMinimized(true);
                return nextTrades;
              });
              socket.close();
              if (autoBotRunningRef.current && !autoBotRepeatScheduledRef.current.has(contractId)) {
                autoBotRepeatScheduledRef.current.add(contractId);
                window.setTimeout(() => {
                  if (autoBotRunningRef.current) openTrade();
                }, 250);
              }
            }
          }

          if (message.proposal) {
            if (isAutoBot && !autoBotRunningRef.current) {
              socket.close();
              return;
            }
            socket.send(JSON.stringify({
              buy: message.proposal.id,
              price: message.proposal.ask_price,
            }));
          }

          if (message.buy) {
            const contractId = Number(message.buy.contract_id);
            setTradeStatus(`Contract opened. ID: ${contractId}`);
            setTradeSuccessMessage(`Trade placed successfully · Contract ${contractId}`);
            if (smart) setSmartTradingOpen(false);
            setActiveTradesMinimized(false);
            setActiveTrades((current) => [
              {
                id: contractId,
                symbol: market,
                direction: directionLabel,
                status: tradeDirection === activeTradeType.secondaryValue ? 'Losing' : 'Winning',
                stake: amount,
                price: Number(currentPrice || liveQuote || currentMarket.price),
                takeProfit: isAccumulatorMode ? Number(takeProfit) : null,
              },
              ...current,
            ]);
            socket.send(JSON.stringify({ proposal_open_contract: 1, contract_id: contractId, subscribe: 1 }));
          }
        });

        socket.addEventListener('open', () => {
          socket.send(JSON.stringify({
            proposal: 1,
            amount,
            basis: 'stake',
            contract_type: tradeContractType,
            currency: 'USD',
            duration: contractDuration,
            duration_unit: selectedDurationUnit,
            underlying_symbol: market,
            ...(smart && allowEquals ? { allow_equals: 1 } : {}),
          }));
        });

        socket.addEventListener('close', () => {
          socketRef.current = null;
        });
      })
      .catch((error) => {
        setTradeStatus(error.message || 'Unable to create the contract.');
      });
  };

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
          setAccountType(payload.account_type === 'real' ? 'real' : 'demo');
        } else {
          setBalance('--');
          setCurrency('USD');
        }
      })
      .catch(() => {
        if (active) {
          setBalance('--');
          setCurrency('USD');
          setAccountType('demo');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="trading-deck-page">
      <aside className="trading-deck-side-rail" aria-label="Trading deck panel rail">
        <div className="trading-deck-rail-brand-wrap" aria-label="VERLUN| PipsHub logo">
          <div className="trading-deck-rail-brand">P</div>
          <span className="trading-deck-rail-brand-name">VERLUN| PipsHub</span>
        </div>
        <a href="#/" className="trading-deck-rail-button">Dashboard</a>
        <a href="#/trading-deck" className="trading-deck-rail-button is-active">Trade</a>
        <a
          href="#/smart"
          className="trading-deck-rail-button"
          onClick={(event) => { event.preventDefault(); setSmartTradingOpen(true); }}
        >Smart Trading</a>
        <button type="button" className="trading-deck-rail-button" onClick={() => setPositionsOpen((open) => !open)}>Positions</button>
        <button type="button" className="trading-deck-rail-button" onClick={() => setBotsOpen((open) => !open)} aria-expanded={botsOpen}>Bots</button>
      </aside>

      <div className="trading-deck-content">
        {tradeSuccessMessage && (
          <div className="trade-success-popup" role="status" aria-live="polite">
            <span className="trade-success-icon" aria-hidden="true">✓</span>
            <span>{tradeSuccessMessage}</span>
          </div>
        )}
        {positionsOpen && (
          <div className="positions-popup" role="dialog" aria-modal="false" aria-label="Positions panel">
            <div className="positions-popup-header">
              <strong>Positions</strong>
              <button type="button" className="positions-close-button" onClick={() => setPositionsOpen(false)} aria-label="Close positions panel">
                ×
              </button>
            </div>

            <div className="positions-tabs" role="tablist" aria-label="Positions tabs">
              <button
                type="button"
                className={positionsTab === 'open' ? 'is-active' : ''}
                onClick={() => setPositionsTab('open')}
                role="tab"
                aria-selected={positionsTab === 'open'}
              >
                Open
              </button>
              <button
                type="button"
                className={positionsTab === 'closed' ? 'is-active' : ''}
                onClick={() => setPositionsTab('closed')}
                role="tab"
                aria-selected={positionsTab === 'closed'}
              >
                Closed
              </button>
            </div>

            <div className="positions-list">
              {positionsTab === 'open' ? (
                activeTrades.length > 0 ? (
                  activeTrades.map((trade) => (
                    <div key={trade.id} className="positions-item">
                      <div className="positions-item-main">
                        <span className="positions-symbol">{trade.symbol}</span>
                        <span className={`positions-direction ${trade.direction.toLowerCase() === 'fall' || trade.direction.toLowerCase() === 'down' || trade.direction.toLowerCase() === 'odd' || trade.direction.toLowerCase() === 'under' ? 'is-fall' : 'is-rise'}`}>
                          {trade.direction}
                        </span>
                      </div>
                      <div className="positions-meta">
                        <span>Stake</span>
                        <strong>${Number(trade.stake).toFixed(2)}</strong>
                      </div>
                      <div className="positions-meta">
                        <span>Price</span>
                        <strong>{Number(trade.price).toFixed(2)}</strong>
                      </div>
                      <span className={`positions-badge ${trade.status === 'Losing' ? 'is-losing' : 'is-winning'}`}>
                        {trade.status || 'Winning'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="positions-empty">No open trades</div>
                )
              ) : (
                closedTradesLoading ? (
                  <div className="positions-empty">Loading closed trades...</div>
                ) : closedTrades.length > 0 ? (
                  closedTrades.map((trade) => (
                    <div key={trade.id} className="positions-item">
                      <div className="positions-item-main">
                        <span className="positions-symbol">{trade.symbol}</span>
                        <span className={`positions-direction ${trade.direction.toLowerCase() === 'fall' ? 'is-fall' : 'is-rise'}`}>
                          {trade.direction}
                        </span>
                      </div>
                      <div className="positions-meta">
                        <span>Stake</span>
                        <strong>${Number(trade.stake).toFixed(2)}</strong>
                      </div>
                      <div className="positions-meta">
                        <span>Profit</span>
                        <strong className={trade.status === 'Lost' ? 'is-loss-value' : 'is-profit-value'}>
                          {trade.profit >= 0 ? '+' : '-'}${Math.abs(Number(trade.profit)).toFixed(2)}
                        </strong>
                      </div>
                      <span className={`positions-badge ${trade.status === 'Lost' ? 'is-losing' : 'is-winning'}`}>
                        {trade.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="positions-empty">No closed trades</div>
                )
              )}

            </div>
          </div>
        )}
        {botsOpen && (
          <div className="bots-popup" role="dialog" aria-label="Available trading bots">
            <div className="bots-popup-header">
              <div>
                <strong>Available bots</strong>
                <span>Choose a strategy to load</span>
              </div>
              <button type="button" className="bots-close-button" onClick={() => setBotsOpen(false)} aria-label="Close bots panel">×</button>
            </div>
            <div className="bots-list">
              {sampleBots.map((bot) => (
                <button type="button" key={bot.name} className="bot-picker-item" onClick={() => loadBot(bot)}>
                  <span className="bot-picker-icon">{bot.name.charAt(0)}</span>
                  <span className="bot-picker-copy">
                    <strong>{bot.name}</strong>
                    <span>{bot.description}</span>
                    <small>{bot.market} · {bot.tradeType} · {bot.contract}</small>
                  </span>
                  <span className="bot-picker-arrow" aria-hidden="true">→</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <header className="trading-deck-topbar">
          <div className="trading-deck-brand-wrap">
            <time className="trading-deck-time" dateTime={new Date().toISOString()}>{localTime}</time>
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

        <div className="trading-deck-balance-block">
          <div className="balance-copy">
            <span className="balance-label">DEMO BALANCE</span>
            <strong>{balance === '--' ? '--' : `$${Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`}</strong>
          </div>
          <button type="button" className="deposit-button" onClick={switchAccount} disabled={accountSwitching} aria-label={`Switch to ${accountType === 'real' ? 'Demo' : 'Real'} Account`}>
            <WalletIcon />
            <span>{accountSwitching ? 'Switching...' : `Switch to ${accountType === 'real' ? 'Demo' : 'Real'} Account`}</span>
          </button>
          <div className="balance-actions">
            <button type="button" className="tool-pill tool-pill-ghost" aria-label="Filter">
              <FilterIcon />
            </button>
            <div className="notification-control">
              <button type="button" className="tool-pill tool-pill-notify" onClick={() => setNotificationsOpen((open) => !open)} aria-label="Recent closed trade notifications" aria-expanded={notificationsOpen}>
                <span className="notify-dot"></span>
                <BellIcon />
              </button>
              {notificationsOpen && (
                <div className="trade-notifications-popup" role="dialog" aria-label="Recent closed trade notifications">
                  <div className="trade-notifications-header">
                    <strong>Recent closed trades</strong>
                    <button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications">×</button>
                  </div>
                  <div className="trade-notifications-list">
                    {closedTrades.slice(0, 3).map((trade) => (
                      <div key={trade.id} className="trade-notification-item">
                        <span className={`trade-notification-icon ${trade.status === 'Lost' ? 'is-lost' : 'is-won'}`} aria-hidden="true">
                          {trade.status === 'Lost' ? '!' : '✓'}
                        </span>
                        <div>
                          <strong>{trade.symbol} trade {trade.status.toLowerCase()}</strong>
                          <span>Stake ${Number(trade.stake).toFixed(2)} · Profit {trade.profit >= 0 ? '+' : '-'}${Math.abs(Number(trade.profit)).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </header>

        <div className="trading-deck-layout">
        <div className="trading-deck-main-column">
          <div className="trading-deck-controls">
            <label className="selector-card">
              <span className="selector-label">Markets</span>
              <select
                value={tradeType}
                onChange={(event) => {
                  const nextType = event.target.value;
                  setTradeType(nextType);
                  const nextTradeType = tradeTypeOptions[nextType] || tradeTypeOptions['Higher / Lower'];
                  setTradeDirection(nextTradeType.primaryValue);
                  setDurationUnit(nextType === 'Even / Odd' ? 't' : 'm');
                  const nextMarkets = syntheticMarkets[nextType] || syntheticMarkets['Higher / Lower'];
                  if (!nextMarkets.includes(market)) setMarket(nextMarkets[0]);
                }}
                className="selector-native"
              >
                <option>Derived Markets</option>
                <option>Higher / Lower</option>
                <option>Rise / Fall</option>
                <option>Touch / No Touch</option>
                <option>Even / Odd</option>
                <option>Accumulators</option>
                <option>Digits</option>
                <option>Matches & Differs</option>
              </select>
              <span className="selector-value">{tradeType}</span>
              <span className="selector-caret">⌄</span>
            </label>

            <label className="selector-card active">
              <span className="selector-label">Synthetics</span>
              <select value={market} onChange={(event) => setMarket(event.target.value)} className="selector-native">
                {availableMarkets.map((symbol) => <option key={symbol} value={symbol}>{marketMeta[symbol].name}</option>)}
              </select>
              <span className="selector-value">{currentMarket.name}</span>
              <span className="selector-caret">⌄</span>
            </label>
          </div>

          <div className="trading-deck-live-panel">
            <LiveFeedChart market={market} onMarketChange={setMarket} onQuoteChange={setLiveQuote} showAccumulatorGuides={isAccumulatorMode} />
          </div>
        </div>

        {smartTradingOpen && <button type="button" className="trading-panel-overlay" onClick={() => setSmartTradingOpen(false)} aria-label="Close trading panel" />}
        <div className={`trading-card-wrap ${smartTradingOpen ? 'is-popup' : ''}`}>
          <div className="trading-card-shell">
            <div className="trading-card-header">
              <div>
                <span className="trading-card-kicker">Trade</span>
                <h2>{currentMarket.name}</h2>
                {loadedBot && <span className="loaded-bot-label">Bot loaded: {loadedBot.name}</span>}
              </div>
              <div className="trading-card-actions">
                <button type="button" className="demo-account-button">Demo account</button>
                {smartTradingOpen && <button type="button" className="trading-panel-close" onClick={() => setSmartTradingOpen(false)} aria-label="Close trading panel">×</button>}
              </div>
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

            {smartTradingOpen && (
              <section className="smart-trading-parameters" aria-label="Smart trading parameters">
                <div className="smart-parameter-section">
                  <p className="smart-parameter-heading">Trade parameters</p>
                  <div className="smart-parameter-grid">
                    <label className="smart-parameter-field">
                      <span>Duration term</span>
                      <select value={durationUnit} onChange={(event) => setDurationUnit(event.target.value)}>
                        <option value="t">Ticks</option>
                        <option value="s">Seconds</option>
                        <option value="m">Minutes</option>
                      </select>
                    </label>
                    <label className="smart-parameter-field">
                      <span>Initial stake</span>
                      <input type="number" min="0.35" step="0.01" value={stake} onChange={(event) => setStake(Math.max(0.35, Number(event.target.value) || 0.35))} />
                    </label>
                    <label className="smart-parameter-toggle">
                      <span>Allow equals</span>
                      <select value={allowEquals ? 'yes' : 'no'} onChange={(event) => setAllowEquals(event.target.value === 'yes')}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="smart-parameter-section">
                  <p className="smart-parameter-heading">Strategy parameters</p>
                  <div className="smart-strategy-options">
                    <label className={`smart-strategy-option ${martingaleEnabled ? 'is-selected' : ''}`}>
                      <input type="checkbox" checked={martingaleEnabled} onChange={(event) => setMartingaleEnabled(event.target.checked)} />
                      <span>Martingale</span>
                    </label>
                    <label className={`smart-strategy-option ${dalembertEnabled ? 'is-selected' : ''}`}>
                      <input type="checkbox" checked={dalembertEnabled} onChange={(event) => setDalembertEnabled(event.target.checked)} />
                      <span>D'Alembert</span>
                    </label>
                  </div>
                </div>

                <div className="smart-parameter-section">
                  <p className="smart-parameter-heading">Strategy</p>
                  <div className="smart-parameter-grid">
                    <label className="smart-parameter-field">
                      <span>Stake multiplier</span>
                      <input type="number" min="1" step="0.1" value={stakeMultiplier} onChange={(event) => setStakeMultiplier(event.target.value)} />
                    </label>
                    <label className="smart-parameter-field">
                      <span>Max. stake</span>
                      <input type="number" min="0.35" step="0.01" value={maxStake} placeholder="-" onChange={(event) => setMaxStake(event.target.value)} />
                    </label>
                  </div>
                </div>

                <div className="smart-parameter-section">
                  <p className="smart-parameter-heading">Risk management</p>
                  <div className="smart-parameter-grid">
                    <label className="smart-parameter-field">
                      <span>Profit threshold</span>
                      <input type="number" min="0" step="0.01" value={stopProfit} placeholder="-" onChange={(event) => setStopProfit(event.target.value)} />
                    </label>
                    <label className="smart-parameter-field">
                      <span>Loss threshold</span>
                      <input type="number" min="0" step="0.01" value={stopLoss} placeholder="-" onChange={(event) => setStopLoss(event.target.value)} />
                    </label>
                  </div>
                </div>
              </section>
            )}

            {!isAccumulatorMode && (
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
                    <span className="field-label">Growth rate</span>
                    <div className="field-value amount-value">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={growthRate}
                        onChange={(event) => setGrowthRate(event.target.value)}
                        className="stake-input"
                        aria-label="Growth rate percentage"
                      />
                      <span className="field-suffix">%</span>
                    </div>
                  </label>

                  <label className="field-box">
                    <span className="field-label">Take profit</span>
                    <div className="field-value amount-value">
                      <input
                        type="number"
                        min="0.35"
                        step="0.01"
                        value={takeProfit}
                        onChange={(event) => setTakeProfit(event.target.value)}
                        className="stake-input"
                        aria-label="Take profit amount"
                      />
                      <span className="field-suffix">$</span>
                    </div>
                  </label>
                </>
              ) : (
                <>
                  <label className="field-box">
                    <span className="field-label">Duration</span>
                    <div className="field-value amount-value">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={duration}
                        onChange={(event) => setDuration(event.target.value)}
                        disabled={!smartTradingOpen}
                        className="stake-input"
                        aria-label="Duration"
                      />
                    </div>
                  </label>

                  {tradeType === 'Even / Odd' ? (
                    <label className="field-box">
                      <span className="field-label">Duration type</span>
                      <div className="field-value">
                        <select value={durationUnit} onChange={(event) => setDurationUnit(event.target.value)} className="field-select">
                          <option value="t">Ticks</option>
                          <option value="s">Seconds</option>
                          <option value="m">Minutes</option>
                        </select>
                        <span className="field-caret">⌄</span>
                      </div>
                    </label>
                  ) : (
                    <label className="field-box">
                      <span className="field-label">Barrier</span>
                      <div className="field-value amount-value">
                        <input
                          type="number"
                          step="0.01"
                          value={barrier}
                          onChange={(event) => setBarrier(event.target.value)}
                          disabled={tradeType === 'Rise / Fall'}
                          className="stake-input"
                          aria-label="Barrier value"
                        />
                      </div>
                    </label>
                  )}
                </>
              )}

              <label className="field-box">
                <span className="field-label">Stop at (Profit)</span>
                <div className="field-value amount-value">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={stopProfit}
                    onChange={(event) => setStopProfit(event.target.value)}
                    className="stake-input"
                    aria-label="Stop at profit"
                    placeholder="0.00"
                  />
                </div>
              </label>

              <label className="field-box">
                <span className="field-label">Stop at (Loss)</span>
                <div className="field-value amount-value">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={stopLoss}
                    onChange={(event) => setStopLoss(event.target.value)}
                    className="stake-input"
                    aria-label="Stop at loss"
                    placeholder="0.00"
                  />
                </div>
              </label>
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
                <span>{isAccumulatorMode ? 'Estimated return' : 'Potential payout'}</span>
                <strong>${displayedPayout.toFixed(2)}</strong>
              </div>
              <div className="summary-row payout-row">
                <span>Profit</span>
                <strong>${profit.toFixed(2)} ({profitPercent}%)</strong>
              </div>
            </div>

            {isAutoBot ? (
              <button
                type="button"
                className={`trade-submit-button ${autoBotRunning ? 'is-fall' : 'is-rise'}`}
                onClick={autoBotRunning ? stopAutoBot : startAutoBot}
              >
                <span className="submit-bullet">{autoBotRunning ? '■' : '◔'}</span>
                {autoBotRunning ? `Stop ${loadedBot.name}` : `Start ${loadedBot.name}`}
              </button>
            ) : (
            <button
              type="button"
              className={`trade-submit-button ${tradeDirection === activeTradeType.secondaryValue ? 'is-fall' : 'is-rise'}`}
              onClick={() => openTrade({ smart: smartTradingOpen })}
            >
              <span className="submit-bullet">◔</span>
              {isAccumulatorMode ? 'Buy' : `Trade ${directionLabel}`}
            </button>
            )}
            <p className="trade-status" aria-live="polite">{tradeStatus}</p>
          </div>
        </div>
      </div>

      {activeTradesMinimized ? (
        <button
          type="button"
          className="active-trades-activity-button"
          onClick={() => setActiveTradesMinimized(false)}
          aria-label={`Show active trades${activeTrades.length ? ` (${activeTrades.length})` : ''}`}
        >
          <span className="activity-icon" aria-hidden="true">≋</span>
          <span>Activity</span>
          <strong>{activeTrades.length}</strong>
        </button>
      ) : (
        <div className="active-trades-bar" aria-live="polite">
          <div className="active-trades-header">
            <span>Active trades</span>
            <div className="active-trades-header-actions">
              <strong>{activeTrades.length}</strong>
              <button
                type="button"
                className="active-trades-minimize"
                onClick={() => setActiveTradesMinimized(true)}
                aria-label="Minimize active trades"
                title="Minimize active trades"
              >
                −
              </button>
            </div>
          </div>

          <div className="active-trades-list">
            {activeTrades.length > 0 ? (
              activeTrades.map((trade) => (
                <div key={trade.id} className="active-trade-item">
                  <div className="active-trade-main">
                    <span className="active-trade-symbol">{trade.symbol}</span>
                    <span className={`active-trade-direction ${trade.direction.toLowerCase() === 'fall' || trade.direction.toLowerCase() === 'down' || trade.direction.toLowerCase() === 'odd' || trade.direction.toLowerCase() === 'under' ? 'is-fall' : 'is-rise'}`}>
                      {trade.direction}
                    </span>
                    <span className={`active-trade-status ${trade.status === 'Losing' ? 'is-losing' : 'is-winning'}`}>
                      {trade.status || 'Winning'}
                    </span>
                  </div>
                  <div className="active-trade-meta">
                    <span>Stake</span>
                    <strong>${Number(trade.stake).toFixed(2)}</strong>
                  </div>
                  <div className="active-trade-meta">
                    <span>Price</span>
                    <strong>{Number(trade.price).toFixed(2)}</strong>
                  </div>
                  <button type="button" className="stop-trade-button" onClick={() => stopTrade(trade.id)}>
                    Stop
                  </button>
                </div>
              ))
            ) : (
              <div className="active-trades-empty">No Active trades</div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
  );
}

export default TradingDeckPage;
