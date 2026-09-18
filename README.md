# PIPSHUB

PIPSHUB is a React/Vite trading application backed by PHP endpoints for Deriv OAuth, account selection, market data, and contract execution. The user interface lives in `src/`; PHP is retained as the server-side integration layer.

## Stack

- React 18 and Vite for the application interface
- PHP 8.2+ for the session and Deriv API endpoints
- Apache/XAMPP for local full-stack hosting

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

The production bundle is written to `react-dist/`. Copy the project into an Apache document root, enable PHP and cURL, and open the project URL. The root `index.php` serves the built React app when `react-dist/index.html` exists.

## Deriv OAuth setup

The OAuth client configuration lives in `deriv/config.php`. Register the exact callback URL with Deriv before connecting an account:

```text
https://your-domain.example/PIPSHUB/deriv/callback.php
```

For local XAMPP testing, use a callback URL that is registered for your local host. Keep access tokens in the PHP session and do not commit private credentials or generated build output.

## Repository notes

The legacy PHP pages remain available alongside the React app. The React app is the default interface after a production build, while the PHP API and OAuth routes continue to be served directly by Apache.