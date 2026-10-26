# Express reference

- Express 5 forwards rejected promises from async handlers to the error middleware; do not wrap every handler in try/catch. Express 4 does not: check the installed major version.
- Order matters: security headers (helmet) and CORS first, then body parsers with a size limit, then routes, then the 404 handler, then the error handler (four arguments) last.
- `req.query` is read-only in Express 5. Parse it into a new variable instead of assigning back.
- Validate with the schema library the project already uses (often Zod). Use strict objects for request bodies.
- Return a consistent error body; map body-parser errors (`entity.parse.failed` → 400, `entity.too.large` → 413) instead of returning 500.
- Keep `app` creation separate from `listen`, so tests can import the app without opening a port.
- Configure CORS with an explicit allowlist; never reflect arbitrary origins with credentials.
- Do not log authorization headers, cookies or request bodies that may contain secrets.
