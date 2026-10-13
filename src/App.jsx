import { useEffect, useRef, useState } from 'react';
import { BOT_URL, DIGITS_URL, RISE_FALL_URL } from './config';
import { DERIV_APP_ID, getDerivRedirectUrl } from '../ceccuro_servo/cred';

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

function encodeBase64Url(bytes) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function OAuthCallback() {
  const [status, setStatus] = useState({ type: 'pending', message: 'Completing Deriv login…' });

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const returnedState = params.get('state');
    const oauthError = params.get('error');
    const errorDescription = params.get('error_description');

    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.hash}`
    );

    const fail = (message) => {
      sessionStorage.removeItem('deriv.oauth.state');
      sessionStorage.removeItem('deriv.oauth.verifier');
      sessionStorage.removeItem('deriv.oauth.app_id');
      if (active) setStatus({ type: 'error', message });
    };

    const completeLogin = async () => {
      if (oauthError) {
        fail(errorDescription || `Deriv authorization failed: ${oauthError}`);
        return;
      }

      const expectedState = sessionStorage.getItem('deriv.oauth.state');
      const verifier = sessionStorage.getItem('deriv.oauth.verifier');
      const appId = sessionStorage.getItem('deriv.oauth.app_id');
      if (!code || !returnedState || returnedState !== expectedState || !verifier || !appId) {
        fail('The login response could not be verified. Return to PIPSHUB and try again.');
        return;
      }

      try {
        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: appId,
          redirect_uri: getDerivRedirectUrl(),
          code_verifier: verifier,
        });
        const response = await fetch('https://auth.deriv.com/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
          cache: 'no-store',
        });
        const tokenData = await response.json();
        if (!response.ok || !tokenData.access_token) {
          throw new Error(tokenData.error_description || tokenData.error || 'Token exchange failed.');
        }

        sessionStorage.setItem('deriv.oauth.tokens', JSON.stringify(tokenData));
        sessionStorage.removeItem('deriv.oauth.state');
        sessionStorage.removeItem('deriv.oauth.verifier');
        sessionStorage.removeItem('deriv.oauth.app_id');
        if (active) {
          setStatus({ type: 'success', message: 'Login successful. Returning to PIPSHUB…' });
          window.location.replace(getDerivRedirectUrl());
        }
      } catch (error) {
        fail(error instanceof Error ? error.message : 'Unable to complete Deriv login.');
      }
    };

    completeLogin();
    return () => { active = false; };
  }, []);

  return (
    <main className="oauth-callback">
      <section className="panel">
        <p className="kicker">Deriv authorization</p>
        <h1>Login with Deriv</h1>
        <p className={status.type === 'error' ? 'oauth-error' : 'oauth-status'} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</p>
        {status.type === 'error' && <a className="text-link" href={window.location.pathname}>Return to PIPSHUB →</a>}
      </section>
    </main>
  );
}

function Layout({ route, title, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginError, setLoginError] = useState('');

  const loginWithDeriv = async () => {
    setLoginError('');
    if (!DERIV_APP_ID.trim()) {
      setLoginError('Add your Deriv App ID in ceccuro_servo/cred.js.');
      return;
    }

    try {
      const redirectUri = getDerivRedirectUrl();
      const verifier = encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)));
      const state = encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)));
      const challengeBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
      const params = new URLSearchParams({
        client_id: DERIV_APP_ID.trim(),
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'trade account_manage',
        state,
        code_challenge: encodeBase64Url(new Uint8Array(challengeBytes)),
        code_challenge_method: 'S256',
      });

      sessionStorage.setItem('deriv.oauth.state', state);
      sessionStorage.setItem('deriv.oauth.verifier', verifier);
      sessionStorage.setItem('deriv.oauth.app_id', DERIV_APP_ID.trim());
      const authorizationLink = document.createElement('a');
      authorizationLink.href = `https://auth.deriv.com/oauth2/auth?${params.toString()}`;
      authorizationLink.target = '_self';
      authorizationLink.rel = 'noopener';
      document.body.appendChild(authorizationLink);
      authorizationLink.click();
      authorizationLink.remove();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Unable to start Deriv login.');
    }
  };

  return (
    <>
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <Link className="brand" href="/"><span>VERLUN</span><b>|</b><small>PIPSHUB</small></Link>
        <p className="eyebrow">Trading workspace</p>
        <nav>{nav.map(([key, label, href]) => <Link key={key} className={`nav-link ${route === key ? 'is-active' : ''}`} href={href} onClick={() => setMenuOpen(false)}><span className="nav-dot" />{label}</Link>)}</nav>
        <div className="sidebar-foot"><span className="status-dot" /><span>Deriv link ready</span></div>
      </aside>
      <main className="shell">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Open menu">☰</button>
          <div><p className="eyebrow">VERLUN / PIPSHUB</p><h1>{title}</h1></div>
          <div className="top-actions"><span className="connection"><i /> Live gateway</span><button className="deriv-login-button" type="button" onClick={loginWithDeriv}>Login with Deriv</button>{loginError && <span className="login-error" role="alert">{loginError}</span>}</div>
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
  const oauthParams = new URLSearchParams(window.location.search);
  if (oauthParams.has('code') || oauthParams.has('error')) return <OAuthCallback />;

  const [route, title] = routeNames[path];
  let content = <Dashboard />;
  if (path === '/builder') content = <Builder />;
  if (path === '/markets') content = <Markets />;
  if (path === '/bots' || path === '/speed') content = <Bots path={path} />;
  if (simplePages[path]) content = <SimplePage path={path} />;
  return <Layout route={route} title={title}>{content}</Layout>;
}

export default App;
