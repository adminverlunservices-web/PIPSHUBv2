# Security controls

## Client protection

The React entrypoint disables the browser context menu to reduce casual copying and unwanted browser actions. This is only a user-interface control and does not protect source code, credentials, or API endpoints.

## Deployment headers

The production deployment applies the headers listed in `security-headers.json` through `vercel.json`.

## Required server-side controls

- Keep secrets in deployment environment variables, never in the React bundle.
- Validate and authorize every API request on the server.
- Use secure, `HttpOnly`, `SameSite` cookies for sessions.
- Keep the backend and dependencies patched.
- Do not treat client-side restrictions as authentication or authorization.

Report suspected vulnerabilities privately to the repository owner rather than opening a public issue with exploit details.
