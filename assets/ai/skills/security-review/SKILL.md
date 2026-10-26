---
name: security-review
description: Review a change for security risks - authentication, authorization, input handling, injection, secrets, data exposure and vulnerable dependencies. Use for changes touching auth, user input, data access, file or process handling, payments, or dependencies.
---

# Security review

Review the actual diff (`git diff` and new files), not a summary of it.

## Checklist

1. **Trust boundaries.** Which inputs cross from client, third party or file system into the code? Each must be validated for type, size and allowed values.
2. **Authentication and authorization.** Every new or changed endpoint or action checks identity and permission on the server. Look for missing checks on sibling routes, IDOR (accessing another user's record by id), and privilege escalation through writable role or owner fields.
3. **Injection.** SQL/NoSQL queries built from input, shell commands built from strings, template or HTML output without escaping (XSS), path traversal in file access, unsafe deserialization, server-side request forgery from user-controlled URLs.
4. **Secrets.** No credentials, tokens or private keys in code, tests, fixtures, logs or docs. `.env` files are ignored by git; `.env.example` holds placeholders only.
5. **Data exposure.** Responses and logs do not include internal fields, stack traces, database errors or personal data that is not needed.
6. **Abuse.** Rate limits or quotas where requests are expensive or enumerable (login, signup, search, password reset); replay protection and idempotency for payments and webhooks; webhook signatures verified.
7. **Dependencies.** For dependency changes, run the package manager's audit (for example `npm audit` or `pnpm audit`) and review new packages' maintenance and license.
8. **Configuration.** Security headers, CORS allowlist, cookie flags (`HttpOnly`, `Secure`, `SameSite`), debug endpoints and verbose errors disabled in production.

## Output

Findings ordered by severity, each with file and line, a concrete exploit scenario, and a fix. Say explicitly which areas you could not check.

## Rules

- Treat any real finding as a blocker to raise with the user, not something to patch silently.
- Do not run exploits against shared or production systems.

## Done when

Every checklist area is marked checked, not applicable (with reason) or not checked, and every finding has an owner and a decision.
