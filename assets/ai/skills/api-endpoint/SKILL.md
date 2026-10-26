---
name: api-endpoint
description: Add or change an HTTP API endpoint with input validation, authorization, consistent errors and tests. Use for REST/HTTP routes in Express, NestJS or similar Node.js back ends.
---

# API endpoint

Read the framework reference that matches the project before writing code:

- Express: [references/express.md](references/express.md)
- NestJS: [references/nestjs.md](references/nestjs.md)

## Steps

1. Find an existing endpoint in the project and follow its structure, naming, error shape, pagination and status-code conventions.
2. Define the contract first: method, path, request body, params and query (with limits), response shape, error codes. Changing an existing public contract needs approval.
3. Validate every untrusted input at the boundary (body, params, query, headers). Reject unknown fields so clients cannot set fields they do not own (mass assignment).
4. Enforce authentication and authorization on the server for this route explicitly. Never rely on a sibling route or the UI. Never trust client-supplied ids or amounts for authorization decisions.
5. Keep handlers thin: parse input, call a service, map the result. Business rules belong in the service layer.
6. Handle expected failures (not found, conflict, validation) with the project's error format. Unknown errors must not leak stack traces or database details.
7. Make retried operations idempotent where clients may retry (payments, webhooks, creates with client keys).
8. Bound everything that can grow: page size limits, body size limits, query timeouts.
9. Write tests: success, validation failures, unauthorized and forbidden access, not found, and limits. Use HTTP-level tests (for example Supertest) against the app, with a test database, never a real or production one.

## Done when

The contract is documented where the project documents APIs, tests cover success and failure paths, and typecheck, lint and tests pass with results reported.
