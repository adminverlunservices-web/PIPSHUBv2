import { useEffect, useRef, useState } from 'react';
import { BOT_URL, DIGITS_URL, RISE_FALL_URL } from './config';

const nav = [
  ['dashboard', 'Dashboard', '/'],
  ['rise-fall', 'Rise / Fall', RISE_FALL_URL],
  ['digits', 'Digits Trading', DIGITS_URL],
  ['bot-app', 'Deriv Bot', BOT_URL],
  ['builder', 'Bot Builder', '/builder'],
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
  const external = href.startsWith('http') || href.startsWith('/rise-fall') || href.startsWith('/digits') || href.startsWith('/bot');
  return <a className={className} href={external ? href : `#${href}`} onClick={onClick}>{children}</a>;
}

function Layout({ route, title, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
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
          <div className="top-actions"><span className="connection"><i /> Live gateway</span></div>
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
  return <><section className="hero-row"><div><p className="kicker">Market command center</p><h2>Trade with a clearer signal.</h2><p className="lede">Build and explore Deriv strategies from one focused workspace.</p></div><Link className="primary-button" href="/builder">Create a bot <span>+</span></Link></section><section className="metric-grid"><article className="metric"><span>Market data</span><strong>Live ticks</strong><small>Public Deriv feed</small></article><article className="metric"><span>Strategy templates</span><strong>3</strong><small className="neutral">Ready to configure</small></article><article className="metric"><span>Live trading</span><strong>Disabled</strong><small className="neutral">Account connection unavailable</small></article></section><section className="dashboard-grid"><article className="panel chart-panel"><div className="panel-heading"><div><p className="kicker">Live pulse</p><h3>Volatility 100 Index</h3></div></div><PulseChart market={market} onMarketChange={setMarket} /></article><article className="panel signal-panel"><PanelHeading kicker="Strategy feed" heading="Latest signals" action={<span className="live-tag">LIVE</span>} /><div className="signal-list"><div><b>Digit Over</b><span>R_100 · 1 min</span><em>Ready</em></div><div><b>Rise / Fall</b><span>R_75 · 5 ticks</span><em>Ready</em></div><div><b>Even / Odd</b><span>1HZ10V · 3 ticks</span><em>Ready</em></div></div><Link className="text-link" href="/markets">Open analysis →</Link></article></section><section className="quick-row"><Link href="/smart"><span>01</span><b>Smart trading</b><small>Let signals guide entries</small></Link><Link href="/speed"><span>02</span><b>Speed bots</b><small>Automate rapid strategies</small></Link><Link href="/bots"><span>03</span><b>Trading bots</b><small>Browse strategy templates</small></Link></section></>;
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
  if (path === '/builder') content = <Builder />;
  if (path === '/markets') content = <Markets />;
  if (path === '/bots' || path === '/speed') content = <Bots path={path} />;
  if (simplePages[path]) content = <SimplePage path={path} />;
  return <Layout route={route} title={title}>{content}</Layout>;
}

export default App;
