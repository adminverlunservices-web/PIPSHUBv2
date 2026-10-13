# PIPSHUB React frontend

The root workspace has a Vite-powered React frontend. The main workspace does not use Deriv OAuth, server sessions, or account-backed trading APIs.

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

The build is written to `react-dist/`. The root `index.php` serves that bundle when it exists.
