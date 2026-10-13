# PIPSHUB

PIPSHUB is a React/Vite trading workspace for public Deriv market data and strategy templates. The main workspace includes a Deriv OAuth login entry point; account-backed trading is not enabled.

## Stack

- React 18 and Vite for the application interface
- Vercel Node function for public market validation

## Run the frontend

Install Node.js 18 or newer, then run from the project directory:

```powershell
npm install
npm run dev
```

The frontend uses hash routes, so it can run without web-server rewrite rules.

The main React entrypoint is `src/main.jsx`, which mounts the application in `index.html`. The dashboard, bot builder, strategy, and market analysis views are React routes in `src/App.jsx`.

## Build for Apache

```powershell
npm run build
```

The production bundle is written to `react-dist/`. Deploy the repository to Vercel; `vercel.json` points Vercel at that output directory.

For Vercel, the included `vercel.json` points the deployment output to `react-dist/`.

Public tick data does not require OAuth credentials. Starting Deriv login requires the App ID configured below.

## Main workspace Deriv login

Set `DERIV_APP_ID` in `ceccuro_servo/cred.js` to your public Deriv App ID. The redirect URI is built from the current page URL so the same source works on XAMPP and GitHub Pages. Register the exact local and hosted page URLs as redirect URIs in your Deriv app before building/deploying.

The Login with Deriv button starts an OAuth authorization-code flow with PKCE. This workspace does not yet exchange the returned code for tokens or enable account-backed trading.

## Rise/Fall app

The dedicated Rise/Fall trading interface is in `deriv/rise-fall-app`. Deploy it as a separate Vercel project with its Root Directory set to `deriv/rise-fall-app`, then set these variables in that project:

```text
NEXT_PUBLIC_DERIV_APP_ID=your_deriv_app_id
NEXT_PUBLIC_DERIV_REDIRECT_URI=https://your-rise-fall-project.vercel.app
NEXT_PUBLIC_DERIV_OAUTH_SCOPES=trade,account_manage
NEXT_PUBLIC_DERIV_ENV=production
```

Set `VITE_RISE_FALL_URL` in the main Vercel project to the deployed Rise/Fall URL. The main PIPSHUB navigation will then open this dedicated app for Rise/Fall trading.

The same navigation exposes the attached Digits and Deriv Bot apps. Deploy them as separate Vercel projects with Root Directories `deriv/digits-no-chart-app` and `deriv/bot-app`, then set `VITE_DIGITS_URL` and `VITE_BOT_URL` in the main project.

## Repository notes

Standalone Deriv apps under `deriv/` are separate deployments and retain their own authentication configuration. They are not part of the main workspace login flow. The obsolete legacy router that wrote user data to a remote database has been removed.