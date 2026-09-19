# PIPSHUB

PIPSHUB is a React/Vite trading application backed by PHP endpoints for Deriv OAuth, account selection, market data, and contract execution. The user interface lives in `src/`; PHP is retained as the server-side integration layer.

## Stack

- React 18 and Vite for the application interface
- Vercel Node functions for sessions, OAuth, and Deriv API endpoints

## Run the frontend

Install Node.js 18 or newer, then run from the project directory:

```powershell
npm install
npm run dev
```

The frontend uses hash routes, so it can run without web-server rewrite rules.

The main React entrypoint is `src/main.jsx`, which mounts the application in `index.html`. The dashboard, account setup, contracts, bot builder, trading, and market analysis views are React routes in `src/App.jsx`.

## Build for Apache

```powershell
npm run build
```

The production bundle is written to `react-dist/`. Deploy the repository to Vercel; `vercel.json` points Vercel at that output directory.

For Vercel, the included `vercel.json` points the deployment output to `react-dist/`.

## Vercel backend setup

The React app includes Vercel Node functions under `api/` for account data, trading sessions, OAuth, logout, and market validation. Configure these Vercel environment variables:

```text
DERIV_CLIENT_ID=your_deriv_client_id
DERIV_REDIRECT_URI=https://your-project.vercel.app/api/deriv-callback.js
APP_URL=https://your-project.vercel.app
SESSION_SECRET=a-long-random-secret
```

Register the exact callback URL with Deriv before connecting an account:

```text
https://your-project.vercel.app/api/deriv-callback.js
```

For a separately hosted frontend, set `VITE_API_BASE_URL` to the API origin and set `FRONTEND_ORIGIN` on the API deployment. Do not commit real credentials or generated build output. `.env.example` contains the complete variable list.

## Trading pages

Rise / Fall, Digits Trading, Accumulators, Bot Builder, Trading Bots, and Speed Bots are restored as internal React workspace pages and use the main application's hash navigation.

## Repository notes

The old PHP pages and duplicate API handlers have been removed. The four requested legacy Deriv files and the root `config.php` remain preserved, but they are not imported by the React build.