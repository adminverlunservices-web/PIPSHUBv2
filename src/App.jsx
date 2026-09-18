import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL, apiUrl } from './config';

const nav = [
  ['dashboard', 'Dashboard', '/'],
  ['account', 'Account Setup', '/account'],
  ['contracts', 'Contracts', '/contracts'],
  ['builder', 'Bot Builder', '/builder'],
  ['manual', 'Manual Trading', '/manual'],
  ['smart', 'Smart Trading', '/smart'],
  ['speed', 'Speed Bots', '/speed'],
  ['bots', 'Trading Bots', '/bots'],
  ['automated', 'Automated Bots', '/automated'],
  ['markets', 'Market Analysis', '/markets'],
];

const routeNames = Object.fromEntries(nav.map(([key, label, path]) => [path, [key, label]]));

function useRoute() {
  const [path, setPath] = useState(() => window.location.hash.slice(1) || '/');
  useEffect(() => {
    const onHashChange = () => setPath(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return [routeNames[path] ? path : '/', (nextPath) => { window.location.hash = nextPath; }];
}

function Link({ href, children, className = '', onClick }) {
  return <a className={className} href={`#${href}`} onClick={onClick}>{children}</a>;
}

async function requestJson(url, options) {
  const response = await fetch(apiUrl(url), { credentials: 'include', ...options });
  const body = await response.text();
  let data;
  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    throw new Error(response.status === 403 ? 'The PHP API is not available on this deployment. Deploy the PHP backend and configure the frontend API URL.' : `API returned an invalid response (${response.status}).`);
  }
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

function Layout({ route, title, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const connected = false;
  return (
    <>
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <Link className="brand" href="/"><span>VERLUN</span><b>|</b><small>PIPSHUB</small></Link>
        <p className="eyebrow">Trading workspace</p>
        <nav>{nav.map(([key, label, href]) => <Link key={key} className={`nav-link ${route === key ? 'is-active' : ''}`} href={href} onClick={() => setMenuOpen(false)}><span className="nav-dot" />{label}</Link>)}</nav>
        <div className="sidebar-foot"><span className="status-dot" /><span>Deriv link ready</span><a href="https://t.me/derivdominator" target="_blank" rel="noreferrer">Community ↗</a></div>
      </aside>
      <main className="shell">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Open menu">☰</button>
          <div><p className="eyebrow">VERLUN / PIPSHUB</p><h1>{title}</h1></div>
          <div className="top-actions"><span className="connection"><i /> Live gateway</span>{connected ? <><span className="login-button">Connected</span><a className="login-button" href={`${API_BASE_URL}/api/logout.js`}>Logout</a></> : <a className="login-button" href={`${API_BASE_URL}/api/deriv-login.js`}>Connect Deriv</a>}</div>
        </header>
        {children}
      </main>
    </>
  );
}

function Hero({ kicker, heading, lede, action }) {
  return <section className="hero-row compact"><div><p className="kicker">{kicker}</p><h2>{heading}</h2><p className="lede">{lede}</p></div>{action}</section>;
}

function PanelHeading({ kicker, heading, action }) {
  return <div className="panel-heading"><div><p className="kicker">{kicker}</p><h3>{heading}</h3></div>{action}</div>;
}

function PulseChart({ market = 'R_100', onMarketChange }) {
  const canvasRef = useRef(null);
  const [tick, setTick] = useState('Waiting for tick');
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    const prices = [];
    let socket;
    let closed = false;
    const draw = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.strokeStyle = '#e1e9e4';
      for (let y = 28; y < height; y += 42) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
      if (prices.length < 2) return;
      const low = Math.min(...prices);
      const high = Math.max(...prices);
      const spread = high - low || 1;
      context.beginPath();
      prices.forEach((price, index) => { const x = index * width / (prices.length - 1); const y = 16 + (high - price) / spread * (height - 32); index ? context.lineTo(x, y) : context.moveTo(x, y); });
      context.strokeStyle = '#2377c9'; context.lineWidth = 2; context.stroke();
    };
    try {
      socket = new WebSocket('wss://api.derivws.com/trading/v1/options/ws/public');
      socket.addEventListener('open', () => socket.send(JSON.stringify({ ticks_history: market, end: 'latest', count: 80, style: 'ticks' })));
      socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        if (message.error) setTick(message.error.message || 'Market data unavailable');
        if (message.history?.prices) { prices.push(...message.history.prices.slice(-80)); draw(); socket.send(JSON.stringify({ ticks: market, subscribe: 1 })); }
        if (message.tick) { prices.push(Number(message.tick.quote)); if (prices.length > 80) prices.shift(); draw(); setTick(`${Number(message.tick.quote).toFixed(2)} · live`); }
      });
      socket.addEventListener('error', () => setTick('Unable to connect to market data'));
      socket.addEventListener('close', () => { if (!closed) setTick('Market data disconnected'); });
    } catch { setTick('Unable to connect to market data'); }
    draw();
    window.addEventListener('resize', draw);
    return () => { closed = true; socket?.close(); window.removeEventListener('resize', draw); };
  }, [market]);
  return <><canvas ref={canvasRef} data-volatility-canvas height="210" /><div className="chart-footer"><span><i className="legend-dot" /> Deriv live ticks</span><strong>{tick}</strong></div><select value={market} onChange={(event) => onMarketChange?.(event.target.value)}><option value="R_100">Volatility 100 Index</option><option value="R_75">Volatility 75 Index</option><option value="R_50">Volatility 50 Index</option><option value="1HZ10V">Volatility 10 (1s)</option></select></>;
}

function Dashboard() {
  const [market, setMarket] = useState('R_100');
  const [balance, setBalance] = useState('--');
  const [balanceStatus, setBalanceStatus] = useState('Connect Deriv to begin');
  useEffect(() => { fetch(apiUrl('api/deriv-session.js'), { credentials: 'include' }).then((response) => response.json().then((data) => ({ ok: response.ok, data }))).then(({ ok, data }) => { if (!ok || typeof data.balance !== 'number') throw new Error(data.error || 'Connect Deriv to begin'); setBalance(`${data.balance.toFixed(2)} ${data.currency}`); setBalanceStatus(`Live ${data.account_type} account balance`); }).catch((error) => setBalanceStatus(error.message)); }, []);
  return <><section className="hero-row"><div><p className="kicker">Market command center</p><h2>Trade with a clearer signal.</h2><p className="lede">Build, test, and monitor Deriv strategies from one focused workspace.</p></div><Link className="primary-button" href="/builder">Create a bot <span>+</span></Link></section><section className="metric-grid"><article className="metric"><span>Account balance</span><strong>{balance}</strong><small>{balanceStatus}</small></article><article className="metric"><span>Open positions</span><strong>0</strong><small className="neutral">No active contracts</small></article><article className="metric"><span>Session return</span><strong>--</strong><small className="neutral">Awaiting market data</small></article></section><section className="dashboard-grid"><article className="panel chart-panel"><div className="panel-heading"><div><p className="kicker">Live pulse</p><h3>Volatility 100 Index</h3></div></div><PulseChart market={market} onMarketChange={setMarket} /></article><article className="panel signal-panel"><PanelHeading kicker="Strategy feed" heading="Latest signals" action={<span className="live-tag">LIVE</span>} /><div className="signal-list"><div><b>Digit Over</b><span>R_100 · 1 min</span><em>Ready</em></div><div><b>Rise / Fall</b><span>R_75 · 5 ticks</span><em>Ready</em></div><div><b>Even / Odd</b><span>1HZ10V · 3 ticks</span><em>Ready</em></div></div><Link className="text-link" href="/markets">Open analysis →</Link></article></section><section className="quick-row"><Link href="/manual"><span>01</span><b>Manual trading</b><small>Place a focused contract</small></Link><Link href="/smart"><span>02</span><b>Smart trading</b><small>Let signals guide entries</small></Link><Link href="/speed"><span>03</span><b>Speed bots</b><small>Automate rapid strategies</small></Link></section></>;
}

function AccountSetup() {
  const [accounts, setAccounts] = useState([]); const [status, setStatus] = useState('Loading'); const [message, setMessage] = useState(''); const [selected, setSelected] = useState('');
  useEffect(() => { requestJson('api/deriv-accounts.js').then((data) => { setAccounts(data.accounts); setSelected(data.selected_account_id); setStatus(`${data.accounts.length} account${data.accounts.length === 1 ? '' : 's'}`); }).catch((error) => { setStatus('Unavailable'); setMessage(error.message); }); }, []);
  const choose = (account) => { setMessage('Switching account...'); const body = new URLSearchParams({ account_id: account.account_id }); requestJson('api/deriv-accounts.js', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }).then((data) => { setAccounts(data.accounts); setSelected(data.selected_account_id); setMessage('Account selected.'); }).catch((error) => setMessage(error.message)); };
  return <><Hero kicker="Account control" heading="Account setup." lede="Choose which Deriv account powers your balance and trading session." /><section className="panel table-panel"><PanelHeading kicker="Available accounts" heading="Select an account" action={<span className="badge">{status}</span>} /><div className="account-list">{accounts.length ? accounts.map((account) => <div className="account-row" key={account.account_id}><div><b>{account.account_type === 'real' ? 'Real account' : 'Demo account'}</b><small>{account.account_id} · {account.currency} · {account.status}</small></div><strong>{Number(account.balance).toFixed(2)} {account.currency}</strong><button type="button" disabled={account.account_id === selected} onClick={() => choose(account)}>{account.account_id === selected ? 'Selected' : 'Use account'}</button></div>) : <p className="empty-state">Loading Deriv accounts...</p>}</div><p aria-live="polite">{message}</p></section></>;
}

function Contracts() {
  const [contracts, setContracts] = useState([]); const [status, setStatus] = useState('Connecting'); const [message, setMessage] = useState('');
  useEffect(() => { let socket; fetch(apiUrl('api/deriv-session.js'), { credentials: 'include' }).then((response) => response.json().then((data) => ({ ok: response.ok, data }))).then(({ ok, data }) => { if (!ok || !data.ws_url) throw new Error(data.error || data.ws_error || 'Connect Deriv to view contracts.'); socket = new WebSocket(data.ws_url); socket.addEventListener('open', () => socket.send(JSON.stringify({ proposal_open_contract: 1, subscribe: 1 }))); socket.addEventListener('message', (event) => { const data = JSON.parse(event.data); if (data.error) { setMessage(data.error.message); return; } if (data.proposal_open_contract) { const contract = data.proposal_open_contract; setContracts((current) => Number(contract.is_sold) === 1 || Number(contract.is_expired) === 1 || contract.status !== 'open' ? current.filter((item) => item.contract_id !== contract.contract_id) : [...current.filter((item) => item.contract_id !== contract.contract_id), contract]); setStatus(`${contracts.length} open`); } if (data.sell) setMessage(`Contract ${data.sell.contract_id} stopped.`); }); socket.addEventListener('close', () => setStatus('Disconnected')); }).catch((error) => { setStatus('Unavailable'); setMessage(error.message); }); return () => socket?.close(); }, []);
  const sell = (contract) => { setMessage(`Closing contract ${contract.contract_id}...`); fetch(apiUrl('api/deriv-session.js'), { credentials: 'include' }).then((response) => response.json()).then((data) => { const socket = new WebSocket(data.ws_url); socket.addEventListener('open', () => socket.send(JSON.stringify({ sell: Number(contract.contract_id), price: Number(contract.bid_price) || 0 }))); }); };
  return <><Hero kicker="Position control" heading="Open contracts." lede="Monitor active trades and close eligible contracts at the current market price." /><section className="panel table-panel"><PanelHeading kicker="Live portfolio" heading="Open trades" action={<span className="badge">{status}</span>} /><div className="account-list">{contracts.length ? contracts.map((contract) => <div className="account-row" key={contract.contract_id}><div><b>{contract.contract_type || 'Contract'} · {contract.underlying_symbol || ''}</b><small>ID {contract.contract_id} · {contract.status || 'open'} · Payout {contract.payout || '--'}</small></div><strong>{Number(contract.profit || 0).toFixed(2)} {contract.currency || ''}</strong><button type="button" disabled={Number(contract.is_valid_to_sell) !== 1} onClick={() => sell(contract)}>Stop trade</button></div>) : <p className="empty-state">Connecting to your Deriv portfolio...</p>}</div><p aria-live="polite">{message}</p></section></>;
}

function ManualTrading() {
  const [market, setMarket] = useState('R_100'); const [stake, setStake] = useState('1.00'); const [duration, setDuration] = useState('5'); const [quote, setQuote] = useState('--'); const [status, setStatus] = useState('Connecting to Deriv...'); const [accountStatus, setAccountStatus] = useState('Checking account'); const [tradeStatus, setTradeStatus] = useState(''); const socketRef = useRef(null);
  useEffect(() => { let socket; fetch(apiUrl('api/deriv-session.js'), { credentials: 'include' }).then((response) => response.json().then((data) => ({ ok: response.ok, data }))).then(({ ok, data }) => { if (!ok || !data.ws_url) throw new Error(data.error || data.ws_error || 'Live trading is unavailable.'); socket = new WebSocket(data.ws_url); socketRef.current = socket; socket.addEventListener('open', () => { setAccountStatus('Live account'); setStatus('Live pricing connected'); socket.send(JSON.stringify({ ticks: market, subscribe: 1 })); }); socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (message.error) setTradeStatus(message.error.message); if (message.tick) setQuote(Number(message.tick.quote).toFixed(2)); if (message.proposal) socket.send(JSON.stringify({ buy: message.proposal.id, price: message.proposal.ask_price })); if (message.buy) setTradeStatus(`Trade opened. Contract ID: ${message.buy.contract_id}`); }); socket.addEventListener('close', () => { setAccountStatus('Disconnected'); setStatus('Deriv connection closed'); }); }).catch((error) => { setAccountStatus('Not connected'); setStatus(error.message); }); return () => socket?.close(); }, [market]);
  const trade = (direction) => { const amount = Number(stake); const minutes = Number(duration); if (!Number.isFinite(amount) || amount < 0.35 || !Number.isInteger(minutes) || minutes < 1) { setTradeStatus('Enter a valid stake and whole-minute duration.'); return; } setTradeStatus('Requesting a live proposal...'); socketRef.current?.send(JSON.stringify({ proposal: 1, amount, basis: 'stake', contract_type: direction, currency: 'USD', duration: minutes, duration_unit: 'm', underlying_symbol: market })); };
  return <><Hero kicker="Direct execution" heading="Manual trading desk." lede="Set the contract precisely, review the quote, and keep every action visible." /><section className="panel chart-panel volatility-widget"><div className="panel-heading"><div><p className="kicker">Live market</p><h3>Volatility chart</h3></div></div><PulseChart market={market} onMarketChange={setMarket} /></section><section className="trade-layout"><article className="panel trade-ticket"><PanelHeading kicker="New contract" heading="Rise / Fall" action={<span className="badge">{accountStatus}</span>} /><label>Market<select value={market} onChange={(event) => setMarket(event.target.value)}><option value="R_100">Volatility 100 Index</option><option value="R_75">Volatility 75 Index</option><option value="JD25">Jump 25 Index</option></select></label><div className="quote"><span>Current quote</span><strong>{quote}</strong><small>{status}</small></div><div className="two-col"><label>Stake<input type="number" value={stake} min="0.35" step="0.01" onChange={(event) => setStake(event.target.value)} /></label><label>Duration<input type="number" value={duration} min="1" step="1" onChange={(event) => setDuration(event.target.value)} /></label></div><div className="trade-buttons"><button className="rise" onClick={() => trade('CALL')} disabled={quote === '--'}>Rise ↑</button><button className="fall" onClick={() => trade('PUT')} disabled={quote === '--'}>Fall ↓</button></div><p aria-live="polite">{tradeStatus}</p></article><article className="panel instructions"><p className="kicker">Order notes</p><h3>Keep risk in view.</h3><p>Trade controls stay disabled until a Deriv account is connected. Your session credentials are kept in the browser session.</p><div className="note-line"><span>01</span> Check the selected market</div><div className="note-line"><span>02</span> Confirm duration and stake</div><div className="note-line"><span>03</span> Submit only when quote is live</div></article></section></>;
}

const simplePages = {
  '/smart': ['Smart Trading', 'Signal assisted execution.', 'Combine clear entry signals with controlled risk and a repeatable workflow.'],
  '/speed': ['Speed Bots', 'Speed bots.', 'Launch lightweight strategies for short contract cycles with clear limits.'],
  '/automated': ['Automated Bots', 'Automated bots.', 'Manage reusable strategies and keep their running state visible.'],
};

function SimplePage({ path }) {
  const [title, heading, lede] = simplePages[path];
  return <><Hero kicker="Trading workspace" heading={heading} lede={lede} action={<button className="primary-button">Run selected <span>▶</span></button>} /><section className="panel table-panel"><PanelHeading kicker="Strategy library" heading="Ready to configure" action={<span className="badge">0 active</span>} /><div className="empty-state"><span>◎</span><h3>No active strategies yet</h3><p>Open Bot Builder to create a strategy for this workspace.</p><Link className="text-link" href="/builder">Open Bot Builder →</Link></div></section></>;
}

function Builder() { return <><Hero kicker="Visual strategy lab" heading="Assemble your next bot." lede="Choose a market, define the contract, and arrange the logic blocks that drive execution." action={<button className="primary-button">Save strategy <span>↓</span></button>} /><section className="builder-layout"><article className="panel builder-controls"><PanelHeading kicker="Parameters" heading="Bot settings" action={<span className="badge">Draft</span>} /><label>Market<select><option>Volatility 100 Index</option><option>Volatility 75 Index</option><option>1HZ10V</option></select></label><label>Contract type<select><option>Digits Over / Under</option><option>Rise / Fall</option><option>Even / Odd</option></select></label><div className="two-col"><label>Duration<input type="number" defaultValue="5" min="1" /></label><label>Unit<select><option>Ticks</option><option>Minutes</option></select></label></div><button className="outline-button">Add condition <span>+</span></button></article><article className="panel workspace"><PanelHeading kicker="Logic canvas" heading="Entry conditions" action={<span className="canvas-state"><i /> Ready</span>} /><div className="block-stack"><div className="logic-block blue"><span className="grip">::</span><div><b>When market updates</b><small>On every incoming tick</small></div><strong>...</strong></div><div className="logic-block coral"><span className="grip">::</span><div><b>Digit last tick</b><small>is greater than 5</small></div><button aria-label="Remove condition">x</button></div><div className="drop-zone">Drop a condition here</div></div><div className="code-preview"><span>Generated strategy</span><code>if (lastDigit &gt; 5) {'{'} placeContract(); {'}'}</code></div></article></section></>; }

function Bots({ path }) { const speed = path === '/speed'; return <><Hero kicker={speed ? 'Rapid automation' : 'Strategy catalog'} heading={speed ? 'Speed bots.' : 'Trading bots.'} lede={speed ? 'Launch lightweight strategies for short contract cycles with clear limits.' : 'Browse purpose-built templates and send any one of them into the builder.'} action={<Link className="primary-button" href="/builder">Build custom <span>+</span></Link>} /><section className="bot-grid">{['Digit Compass', 'Tick Current', 'Quiet Range'].map((name, index) => <article className={`bot-card ${index === 0 ? 'selected' : ''}`} key={name}><div className="bot-top"><span className="bot-icon">{speed ? '⚡' : '▣'}</span><span className="badge">{speed ? 'Ready' : 'Template'}</span></div><h3>{name}</h3><p>Purpose-built synthetic market strategy with clear entry rules.</p><div className="bot-meta"><span>{index === 0 ? 'R_100' : 'R_75'}</span><span>{speed ? '5 ticks' : 'Medium'}</span><b>{speed ? '0 runs' : 'Use →'}</b></div></article>)}</section></>; }

function Markets() { return <><Hero kicker="Market intelligence" heading="Read the market." lede="A compact view of volatility, tick flow, and contract readiness." action={<select className="market-select"><option>All synthetic markets</option><option>Volatility indices</option><option>1HZ indices</option></select>} /><section className="analysis-grid"><article className="panel"><PanelHeading kicker="Market matrix" heading="Live conditions" action={<span className="connection"><i /> Polling</span>} /><table><thead><tr><th>Market</th><th>Spread</th><th>Tick flow</th><th>Bias</th></tr></thead><tbody>{[['R_100', '0.01', '88%', 'Bullish'], ['R_75', '0.02', '64%', 'Neutral'], ['R_50', '0.01', '52%', 'Quiet'], ['1HZ10V', '0.01', '76%', 'Active']].map(([name, spread, flow, bias]) => <tr key={name}><td>{name}</td><td>{spread}</td><td><span className="bar"><i style={{ width: flow }} /></span></td><td className="positive">{bias}</td></tr>)}</tbody></table></article><article className="panel checklist"><p className="kicker">Pre-flight</p><h3>Before you trade</h3><label><input type="checkbox" /> Account connected</label><label><input type="checkbox" /> Market selected</label><label><input type="checkbox" /> Risk limit set</label><Link className="outline-button full" href="/manual">Open trading desk</Link></article></section></>; }

function App() {
  const [path] = useRoute();
  const [route, title] = routeNames[path];
  let content = <Dashboard />;
  if (path === '/account') content = <AccountSetup />;
  if (path === '/contracts') content = <Contracts />;
  if (path === '/builder') content = <Builder />;
  if (path === '/manual') content = <ManualTrading />;
  if (path === '/markets') content = <Markets />;
  if (path === '/bots' || path === '/speed') content = <Bots path={path} />;
  if (simplePages[path]) content = <SimplePage path={path} />;
  return <Layout route={route} title={title}>{content}</Layout>;
}

export default App;
