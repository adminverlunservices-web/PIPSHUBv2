(() => {
    const menu = document.querySelector('[data-menu]');
    const sidebar = document.querySelector('[data-sidebar]');
    menu?.addEventListener('click', () => sidebar?.classList.toggle('open'));

    document.querySelectorAll('[data-volatility-widget]').forEach((widget) => {
        const canvas = widget.querySelector('[data-volatility-canvas]') || widget.querySelector('#pulse-chart');
        const chartMarket = widget.querySelector('[data-chart-market]') || widget.querySelector('[data-market]');
        const tick = widget.querySelector('[data-volatility-tick]') || widget.querySelector('[data-tick]');
        if (!canvas || !chartMarket) return;
        const context = canvas.getContext('2d');
        const prices = [];
        let chartSocket;
        let chartRequestId = 0;
        const draw = () => {
            const ratio = window.devicePixelRatio || 1;
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            context.scale(ratio, ratio);
            context.clearRect(0, 0, width, height);
            context.strokeStyle = '#e1e9e4';
            context.lineWidth = 1;
            for (let y = 28; y < height; y += 42) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
            if (prices.length < 2) return;
            const low = Math.min(...prices);
            const high = Math.max(...prices);
            const spread = high - low || 1;
            const points = prices.map((price) => 16 + (high - price) / spread * (height - 32));
            context.beginPath();
            points.forEach((value, index) => { const x = index * width / (points.length - 1); index ? context.lineTo(x, value) : context.moveTo(x, value); });
            context.strokeStyle = '#2377c9'; context.lineWidth = 2; context.stroke();
            const gradient = context.createLinearGradient(0, 0, 0, height); gradient.addColorStop(0, 'rgba(35,119,201,.14)'); gradient.addColorStop(1, 'rgba(35,119,201,0)');
            context.lineTo(width, height); context.lineTo(0, height); context.closePath(); context.fillStyle = gradient; context.fill();
        };
        const connectChart = () => {
            const requestId = ++chartRequestId;
            prices.length = 0;
            chartSocket?.close();
            chartSocket = new WebSocket('wss://api.derivws.com/trading/v1/options/ws/public');
            chartSocket.addEventListener('open', () => {
                chartSocket.send(JSON.stringify({ ticks_history: chartMarket.value, end: 'latest', count: 80, style: 'ticks', req_id: requestId }));
            });
            chartSocket.addEventListener('message', (event) => {
                const message = JSON.parse(event.data);
                if (message.error) { if (tick) tick.textContent = message.error.message || 'Market data unavailable'; return; }
                if (message.history?.prices) {
                    prices.push(...message.history.prices.slice(-80));
                    draw();
                    chartSocket.send(JSON.stringify({ ticks: chartMarket.value, subscribe: 1, req_id: requestId + 1 }));
                }
                if (message.tick) {
                    prices.push(Number(message.tick.quote));
                    if (prices.length > 80) prices.shift();
                    draw();
                    if (tick) tick.textContent = `${Number(message.tick.quote).toFixed(2)} · live`;
                }
            });
            chartSocket.addEventListener('error', () => { if (tick) tick.textContent = 'Unable to connect to market data'; });
            chartSocket.addEventListener('close', () => { if (requestId === chartRequestId && tick) tick.textContent = 'Market data disconnected'; });
        };
        draw(); window.addEventListener('resize', draw); connectChart();
        chartMarket?.addEventListener('change', connectChart);
    });
    document.querySelector('[data-add-block]')?.addEventListener('click', () => {
        const blocks = document.querySelector('[data-blocks]');
        if (!blocks) return;
        const block = document.createElement('div'); block.className = 'logic-block blue'; block.innerHTML = '<span class="grip">⋮⋮</span><div><b>Price movement</b><small>matches selected direction</small></div><button class="remove-block" aria-label="Remove condition">×</button>';
        blocks.insertBefore(block, blocks.querySelector('.drop-zone')); block.querySelector('button').addEventListener('click', () => block.remove());
    });
    document.querySelectorAll('.remove-block').forEach((button) => button.addEventListener('click', () => button.parentElement.remove()));
    document.querySelectorAll('[data-save-bot],[data-run-bot],[data-start-scan]').forEach((button) => button.addEventListener('click', () => { const original = button.innerHTML; button.innerHTML = 'Saved ✓'; setTimeout(() => { button.innerHTML = original; }, 1500); }));

    const ticket = document.querySelector('[data-trade-ticket]');
    if (ticket) {
        const market = ticket.querySelector('[data-market]');
        const stake = ticket.querySelector('[data-stake]');
        const duration = ticket.querySelector('[data-duration]');
        const quote = ticket.querySelector('[data-quote]');
        const quoteStatus = ticket.querySelector('[data-quote-status]');
        const accountStatus = ticket.querySelector('[data-account-status]');
        const tradeStatus = ticket.querySelector('[data-trade-status]');
        const buttons = [...ticket.querySelectorAll('[data-contract]')];
        let socket;
        let authorized = false;
        let currentQuote;
        let pendingDirection;

        const setButtons = (enabled) => buttons.forEach((button) => { button.disabled = !enabled; });
        const setStatus = (message, error = false) => {
            tradeStatus.textContent = message;
            tradeStatus.style.color = error ? '#b42318' : '';
        };
        const sendProposal = (direction) => {
            const amount = Number(stake.value);
            const minutes = Number(duration.value);
            if (!Number.isFinite(amount) || amount < 0.35 || !Number.isInteger(minutes) || minutes < 1) {
                setStatus('Enter a valid stake and whole-minute duration.', true);
                return;
            }
            pendingDirection = direction;
            setButtons(false);
            setStatus('Requesting a live proposal...');
            socket.send(JSON.stringify({ proposal: 1, amount, basis: 'stake', contract_type: direction, currency: 'USD', duration: minutes, duration_unit: 'm', underlying_symbol: market.value }));
        };

        fetch('api/deriv-session.php', { credentials: 'same-origin' })
            .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
            .then(({ ok, data }) => {
                if (!ok || typeof data.ws_url !== 'string' || data.ws_url === '') throw new Error(data.ws_error || data.error || 'Live trading is unavailable for this account.');
                socket = new WebSocket(data.ws_url);
                socket.addEventListener('open', () => {
                    authorized = true;
                    accountStatus.textContent = 'Live account';
                    quoteStatus.textContent = 'Live pricing connected';
                    socket.send(JSON.stringify({ ticks: market.value, subscribe: 1 }));
                });
                socket.addEventListener('message', (event) => {
                    const message = JSON.parse(event.data);
                    if (message.error) {
                        setStatus(message.error.message || 'Deriv rejected the request.', true);
                        if (message.error.code === 'InvalidToken' || message.error.code === 'AuthorizationRequired') {
                            accountStatus.textContent = 'Authentication expired';
                        }
                        setButtons(authorized && currentQuote !== undefined);
                        return;
                    }
                    if (message.msg_type === 'tick') {
                        currentQuote = message.tick.quote;
                        quote.textContent = Number(currentQuote).toFixed(2);
                        setButtons(authorized);
                    } else if (message.msg_type === 'proposal' && pendingDirection) {
                        const proposal = message.proposal;
                        setStatus('Buying the live contract...');
                        socket.send(JSON.stringify({ buy: proposal.id, price: proposal.ask_price }));
                    } else if (message.msg_type === 'buy') {
                        pendingDirection = undefined;
                        setStatus(`Trade opened. Contract ID: ${message.buy.contract_id}`);
                        setButtons(authorized && currentQuote !== undefined);
                    }
                });
                socket.addEventListener('close', () => {
                    authorized = false;
                    accountStatus.textContent = 'Disconnected';
                    quoteStatus.textContent = 'Deriv connection closed';
                    setButtons(false);
                });
                socket.addEventListener('error', () => setStatus('Could not connect to Deriv live trading.', true));
            })
            .catch((error) => {
                accountStatus.textContent = 'Not connected';
                quoteStatus.textContent = error.message;
                setStatus(error.message, true);
            });

        buttons.forEach((button) => button.addEventListener('click', () => sendProposal(button.dataset.contract)));
        market.addEventListener('change', () => {
            currentQuote = undefined;
            setButtons(false);
            if (authorized) socket.send(JSON.stringify({ ticks: market.value, subscribe: 1 }));
        });
    }

    const balance = document.querySelector('[data-balance]');
    const balanceStatus = document.querySelector('[data-balance-status]');
    if (balance && balanceStatus) {
        fetch('api/deriv-session.php', { credentials: 'same-origin' })
            .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
            .then(({ ok, data }) => {
                if (!ok || typeof data.balance !== 'number') throw new Error(data.error || 'Connect Deriv to begin');
                balance.textContent = `${data.balance.toFixed(2)} ${data.currency}`;
                balanceStatus.textContent = `Live ${data.account_type} account balance`;
            })
            .catch((error) => { balanceStatus.textContent = error.message; });
    }

    const accountSetup = document.querySelector('[data-account-setup]');
    if (accountSetup) {
        const list = accountSetup.querySelector('[data-account-list]');
        const status = accountSetup.querySelector('[data-account-setup-status]');
        const message = accountSetup.querySelector('[data-account-setup-message]');
        const secureRequest = window.CeccuroServo?.request || fetch;
        const renderAccounts = (accounts, selectedId) => {
            list.innerHTML = '';
            accounts.forEach((account) => {
                const item = document.createElement('div');
                item.className = 'account-row';
                const isSelected = account.account_id === selectedId;
                item.innerHTML = `<div><b>${account.account_type === 'real' ? 'Real account' : 'Demo account'}</b><small>${account.account_id} · ${account.currency} · ${account.status}</small></div><strong>${Number(account.balance).toFixed(2)} ${account.currency}</strong><button type="button" ${isSelected ? 'disabled' : ''}>${isSelected ? 'Selected' : 'Use account'}</button>`;
                item.querySelector('button').addEventListener('click', () => {
                    const body = new URLSearchParams({ account_id: account.account_id });
                    message.textContent = 'Switching account...';
                    secureRequest('api/deriv-accounts.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
                        .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
                        .then(({ ok, data }) => {
                            if (!ok) throw new Error(data.error || 'Account switch failed.');
                            renderAccounts(data.accounts, data.selected_account_id);
                            message.textContent = 'Account selected. Open Manual Trading to refresh the trading connection.';
                        })
                        .catch((error) => { message.textContent = error.message; });
                });
                list.appendChild(item);
            });
        };
        fetch('api/deriv-accounts.php', { credentials: 'same-origin' })
            .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.error || 'Unable to load accounts.');
                renderAccounts(data.accounts, data.selected_account_id);
                status.textContent = `${data.accounts.length} account${data.accounts.length === 1 ? '' : 's'}`;
            })
            .catch((error) => { status.textContent = 'Unavailable'; message.textContent = error.message; });
    }

    const contractsPage = document.querySelector('[data-contracts-page]');
    if (contractsPage) {
        const list = contractsPage.querySelector('[data-contract-list]');
        const status = contractsPage.querySelector('[data-contracts-status]');
        const message = contractsPage.querySelector('[data-contracts-message]');
        const contracts = new Map();
        const renderContracts = () => {
            list.innerHTML = '';
            if (contracts.size === 0) {
                list.innerHTML = '<p class="empty-state">No Active trades</p>';
                return;
            }
            contracts.forEach((contract) => {
                const row = document.createElement('div');
                row.className = 'account-row';
                const profit = Number(contract.profit || 0);
                const canSell = Number(contract.is_valid_to_sell) === 1 && Number(contract.is_sold) !== 1;
                row.innerHTML = `<div><b>${contract.contract_type || 'Contract'} · ${contract.underlying_symbol || ''}</b><small>ID ${contract.contract_id} · ${contract.status || 'open'} · Payout ${contract.payout || '--'}</small></div><strong style="color:${profit >= 0 ? 'var(--green)' : 'var(--red)'}">${profit.toFixed(2)} ${contract.currency || ''}</strong><button type="button" ${canSell ? '' : 'disabled'}>${canSell ? 'Stop trade' : 'Not sellable'}</button>`;
                if (canSell) {
                    row.querySelector('button').addEventListener('click', () => {
                        const button = row.querySelector('button');
                        button.disabled = true;
                        message.textContent = `Closing contract ${contract.contract_id}...`;
                        socket.send(JSON.stringify({ sell: Number(contract.contract_id), price: Number(contract.bid_price) || 0 }));
                    });
                }
                list.appendChild(row);
            });
        };
        let socket;
        fetch('api/deriv-session.php', { credentials: 'same-origin' })
            .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
            .then(({ ok, data }) => {
                if (!ok || !data.ws_url) throw new Error(data.error || data.ws_error || 'Connect Deriv to view contracts.');
                socket = new WebSocket(data.ws_url);
                socket.addEventListener('open', () => socket.send(JSON.stringify({ proposal_open_contract: 1, subscribe: 1 })));
                socket.addEventListener('message', (event) => {
                    const data = JSON.parse(event.data);
                    if (data.error) { message.textContent = data.error.message || 'Deriv rejected the request.'; return; }
                    if (data.proposal_open_contract) {
                        const contract = data.proposal_open_contract;
                        if (Number(contract.is_sold) === 1 || Number(contract.is_expired) === 1 || contract.status !== 'open') contracts.delete(String(contract.contract_id));
                        else contracts.set(String(contract.contract_id), contract);
                        status.textContent = `${contracts.size} open`;
                        renderContracts();
                    }
                    if (data.sell) { message.textContent = `Contract ${data.sell.contract_id} stopped.`; }
                });
                socket.addEventListener('error', () => { status.textContent = 'Unavailable'; message.textContent = 'Unable to connect to Deriv.'; });
                socket.addEventListener('close', () => { status.textContent = 'Disconnected'; });
            })
            .catch((error) => { status.textContent = 'Unavailable'; message.textContent = error.message; });
    }
})();
