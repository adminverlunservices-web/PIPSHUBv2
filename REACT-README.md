# PIPSHUB React frontend

The root workspace now has a Vite-powered React frontend. The existing PHP files under `api/` and `deriv/` remain the session, OAuth, account, and trading backend.

## Run locally

Install Node.js 18 or newer, then from this directory run:

```powershell
npm install
npm run dev
```

Open the URL printed by Vite. Hash routes keep navigation working without Apache rewrite rules.

## Build for XAMPP

```powershell
npm run build
```

The build is written to `react-dist/`. The root `index.php` serves that bundle when it exists, so Apache continues to handle the PHP API and Deriv OAuth endpoints.
