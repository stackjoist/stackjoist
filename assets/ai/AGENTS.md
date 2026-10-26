# AI Development Operating System

> Purpose: Build and maintain reliable software with an AI coding agent through a repeatable, reviewable workflow.
>
> Use this as the strict project-level operating guide. Adapt command names and stack-specific implementation details to the actual repository, but never waive mandatory safety, verification integrity, documentation, or approval rules. Do not assume every project uses the same stack.

---

## 0. Operating Principles

1. **Understand before changing.** Inspect the repository, its current state, existing conventions, and relevant documentation before editing.
2. **Prefer evidence over assumptions.** Verify commands, APIs, package versions, framework behavior, and configuration against the repository and official documentation when needed.
3. **Keep changes small and scoped.** Implement one independently reviewable task at a time.
4. **Preserve user work.** Never overwrite, discard, reset, or reformat unrelated user changes.
5. **Verify claims.** Never say a check passed unless it was actually run and its result observed.
6. **Keep documentation synchronized.** Update the relevant source-of-truth documents when behavior, contracts, architecture, setup, or decisions change.
7. **Protect data and credentials.** Treat production systems, secrets, migrations, deployments, billing, and destructive commands as sensitive.
8. **Human approval remains required** for consequential, irreversible, externally visible, or costly actions.

These instructions are mandatory. The agent must not silently skip, weaken, or rewrite them. If a rule cannot be followed, stop the affected action, explain the blocker, and ask for direction. These instructions do not replace repository permissions, CI checks, branch protection, code review, or backups.

---

## 1. First-Run and Existing-Project Detection

At the beginning of a project or session:

1. Identify whether this is:
   - a new project,
   - an existing project with established code and conventions, or
   - an existing project with incomplete/contradictory documentation.
2. Inspect the root files, package manifests, lockfiles, directory structure, Git status, and relevant source files.
3. Read applicable agent instructions (including this file and any more-specific instructions in subdirectories), README, architecture, task/progress notes, and relevant decision records.
4. Do not assume the documentation is current. Check it against source code, schemas, tests, migrations, and package scripts.
5. For an existing project, do not propose a rewrite or replace its stack just because another approach is fashionable. Preserve working architecture unless the task requires a change.
6. If the working tree contains changes, identify them and preserve them. Do not attribute existing changes to your own work.

### If this is a new project

Start with a short, staged discovery interview. Ask a small group of related questions at a time, not one huge questionnaire. Cover as relevant:

- Problem and intended outcome
- Users, roles, and target markets
- MVP features, exclusions, and acceptance criteria
- Platform and user journeys
- Data sensitivity, authentication, authorization, and compliance needs
- Integrations (payments, email, SMS, OAuth, APIs)
- Expected scale, reliability, budget, hosting, and operational constraints
- Timeline and what "launch-ready" means
- Existing designs, APIs, assets, or code
- Preferred stack and constraints
- Target devices/browsers, supported languages/locales, and light/dark/system theme requirements
- Whether the product depends on search/AI-search visibility — if yes, ask for an existing keyword/topic list, or offer to research and propose one for approval, plus target market and language

Use sensible defaults for low-impact details and clearly label assumptions. Ask for clarification when ambiguity could materially change architecture, cost, security, data model, or user-facing behavior. Do not block progress on trivial choices.

Do not begin implementation until the MVP scope, critical constraints, and acceptance criteria are sufficiently clear and the user has reviewed and explicitly approved the proposed baseline.

### If this is an existing project

Do not repeat the full discovery interview. First establish the requested change, inspect relevant implementation, and ask only for missing information that materially affects the task.

---

## 2. Research and Technical Choices

Research when the task depends on current or external facts, including framework APIs, security guidance, third-party integrations, deployment platforms, or changing package behavior.

- Prefer official documentation, release notes, and repository-local evidence.
- Check the installed and locked versions before using documentation for a newer major version.
- Prefer stable, supported versions compatible with the project over "latest" for its own sake.
- Do not upgrade dependencies or change major versions unless required or explicitly approved.
- When options have meaningful trade-offs, summarize the practical differences and ask for approval for major architectural or cost-impacting choices.
- Cite or link important external technical references in project documentation when useful.
- Never claim research was performed if browsing or documentation access was unavailable.

---

## 3. System Design

Before or alongside significant implementation, make design decisions explicit and reviewable rather than implicit in code.

### Architecture and scalability

- Define system boundaries: what each service/module owns, how they communicate, and where data lives.
- Identify the expected load profile (requests/sec, data volume, concurrency) at a realistic horizon, not a hypothetical hyperscale one; do not over-engineer for scale the product does not need yet.
- Note single points of failure, and which are acceptable for the current stage vs. which need mitigation.
- Choose synchronous vs. asynchronous communication (queues, events, webhooks) deliberately, based on actual coupling and latency needs — not by default.
- Design for horizontal scaling only where the product's growth plan justifies the added complexity.

### Data design

- Model entities and relationships based on actual access patterns, not just the domain shape.
- Decide on consistency requirements per data type (strong vs. eventual) and document why.
- Plan indexing, partitioning, and archiving strategy for tables/collections expected to grow large.
- Define data retention and deletion rules where privacy/compliance is relevant.

### API design

- Keep API contracts explicit (OpenAPI/GraphQL schema) and versioned in a way that avoids breaking existing consumers.
- Design for idempotency on operations that may be retried (payments, webhooks, order creation).
- Apply consistent pagination, filtering, error shape, and status-code conventions across endpoints.
- Rate-limit and validate at the boundary; never trust client-supplied identifiers or amounts for authorization decisions.

### Security-by-design

- Identify trust boundaries and what data crosses them (client, server, third-party, database).
- Apply least privilege for service accounts, API keys, and database roles.
- Plan authentication/authorization model up front (session vs. token, roles/permissions, multi-tenancy isolation) rather than retrofitting it.
- Consider abuse cases (enumeration, replay, privilege escalation, mass assignment) for anything user-facing or public.

### Documenting design decisions

- Record significant design decisions in `docs/ARCHITECTURE.md` and `docs/DECISIONS.md` (see Section 4), including the alternatives considered and why the chosen approach fits the project's actual scale and constraints.
- Flag when a design choice trades off cost, complexity, or time-to-market against long-term flexibility, and get user approval for the trade-off if it's consequential.

---

## 4. Project Documentation and Sources of Truth

Create or maintain only the documents useful for this repository. Avoid duplicating the same rules in multiple files.

Suggested layout:

```text
AGENTS.md                         # Agent workflow and repository-wide rules
README.md                         # Setup, scripts, environment, run/deploy overview
docs/
  PRD.md                          # Product scope, users, requirements, acceptance criteria
  ARCHITECTURE.md                 # System boundaries, modules, data flow, key patterns
  DEVELOPMENT.md                  # Coding conventions and verified commands
  TASKS.md                        # Prioritized, actionable work items
  PROGRESS.md                     # Current phase, completed work, blockers, next task
  DECISIONS.md                    # Significant architecture/product decisions (ADRs)
  API.md                          # API contract, if not already maintained by OpenAPI
  DATABASE.md                     # Data model notes, if not adequately represented by schema
  SECURITY.md                     # Threat-sensitive decisions and operational safeguards
  TESTING.md                      # Test strategy, coverage expectations, how to run each test type
  SEO_KEYWORDS.md                 # Target keywords/topics mapped to pages (only if SEO/GEO applies)
```

Use the repository's existing documentation conventions when present.

### Documentation rules

- `AGENTS.md` contains durable agent instructions, not a running diary.
- `PRD.md` records agreed product requirements and explicit out-of-scope items.
- `ARCHITECTURE.md` records the current architecture, not an aspirational design that was never implemented.
- `DEVELOPMENT.md` records verified commands and coding conventions.
- `TASKS.md` is the task backlog, with status and acceptance criteria.
- `PROGRESS.md` is a concise handoff: current state, last completed task, checks, blockers, and next action.
- `DECISIONS.md` records consequential decisions, alternatives, rationale, status, and consequences. Do not log every minor implementation detail.
- `TESTING.md` records what is covered by which test type, how to run each suite locally and in CI, and any known gaps.
- Generated or machine-maintained contracts (e.g. Prisma schema, OpenAPI schema, GraphQL schema) should remain the source of truth where appropriate. Avoid manually duplicating generated details.
- If documentation conflicts with code, tests, or migrations, report the discrepancy and determine the authoritative source before making a consequential change.

For a new project, propose the minimum useful documents and get user review of the product scope and significant architecture before substantial implementation.

---

## 5. Task Planning and Approval

Maintain `docs/TASKS.md` for multi-step work. Each task should have:

- ID and concise title
- Goal and context
- Scope and explicit non-goals
- Acceptance criteria that can be checked
- Dependencies
- Test/verification plan
- Status: Todo / In Progress / Blocked / Done

Break work into small, independently verifiable changes. Avoid arbitrary time estimates unless the user asks for them.

Before implementing a task, provide a brief plan containing:
1. What will change and why
2. Relevant files/modules expected to change
3. Important assumptions, risks, and dependencies
4. How the result will be verified

Proceed without asking for confirmation for routine, reversible, clearly scoped implementation details that stay within the approved task. Explicitly ask before:
- changing an approved requirement or public contract,
- changing core architecture or major dependencies,
- performing destructive or irreversible operations,
- touching production data or services,
- incurring material cost or deploying/publishing,
- making a security/privacy trade-off,
- acting when a critical requirement is ambiguous.

Do not ask the user to approve every small file edit. Do not silently expand the task. Approval for one consequential action does not imply approval for other consequential actions.

---

## 6. Implementation Standards

- Follow the established stack, directory structure, naming, and architectural boundaries.
- Read nearby code and reuse existing abstractions where appropriate; do not create abstractions solely for hypothetical future use.
- Make the smallest coherent change that satisfies the acceptance criteria.
- Keep controllers/routes/handlers thin where that matches the project architecture; keep business rules in the appropriate domain/service layer.
- Validate untrusted input at system boundaries.
- Enforce authentication and authorization on the server, not only in the UI.
- Handle expected failures explicitly and use the project's established error/response format.
- Avoid unsafe type assertions and broad `any` usage. If the repository permits `any`, justify exceptional use; otherwise follow its stricter rule.
- Do not suppress compiler, linter, or test errors to make a check pass.
- Avoid unrelated refactoring, formatting churn, generated-file edits, and dependency additions.
- Add or update tests for changed behavior, including relevant edge cases and regression scenarios.
- Consider accessibility, responsiveness, performance, and user experience for user-facing changes.
- Never hardcode secrets, credentials, private keys, tokens, or personal data.
- Never log secrets or sensitive user data.
- Do not copy real production data into tests or documentation.

### Database and migrations

- Inspect the current schema, migration history, and data access patterns before changing data structures.
- Use the project's migration workflow; do not edit an applied migration or mutate production schema ad hoc.
- Consider backward compatibility, data backfills, locking, rollback/recovery, and deployment order.
- Do not run destructive migrations, resets, seed operations against non-test environments, or production database commands without explicit approval and a verified target.
- Update schema-derived clients and tests using the repository's documented commands.
- Document operationally significant migration steps.

### Dependencies

- Inspect package manager and lockfile first.
- Use the existing package manager and repository scripts.
- Explain and seek approval for new dependencies or major upgrades unless already authorized by project rules.
- Do not manually edit lockfiles when the package manager should generate them.
- Check license compatibility before adding a new dependency to a commercial project.

---

## 7. Stack-Specific Rules

Apply only the rules relevant to the actual project. Do not force a default stack onto an existing repository.

### TypeScript / Node.js

- Respect the repository's TypeScript configuration and module system.
- Prefer explicit, accurate types and narrow `unknown` safely.
- Run the repository's typecheck command; do not assume `tsc --noEmit` is valid for every build setup.

### NestJS (when used)

- Follow the project's module/provider boundaries and dependency injection patterns.
- Use DTO validation at request boundaries where appropriate.
- Keep authorization checks explicit and tested.
- Follow the existing exception filter, interceptor, logging, and response conventions.
- Do not add a global interceptor/filter or alter response envelopes without checking existing behavior and API compatibility.
- Test provider/business logic and important HTTP flows.

### Prisma (when used)

- Follow the installed Prisma version's official configuration and client-generation workflow.
- Use migrations for schema changes and review generated SQL where risk warrants it.
- Handle known database errors at the appropriate application boundary; do not blindly convert every database error into the same response.
- Never expose raw database errors or sensitive query details to clients.

### React / Next.js (when used)

- Follow the installed framework version and current project rendering/data-fetching conventions (App Router conventions where the project uses App Router).
- Consider server/client boundaries, loading/error/empty states, accessibility, responsive behavior, and avoid unnecessary client-side JavaScript.
- Verify metadata, canonical URLs, structured data, and indexing behavior only where relevant to the page and product.
- Support the project's theming approach (light/dark/system) consistently; do not hardcode colors that bypass the theme system.

### Shopify (when used)

- Follow the app's Shopify API version, extension/runtime constraints, and official documentation.
- Preserve existing app configuration, scopes, billing behavior, webhook verification, and merchant data protections.
- Test relevant extension/app flows and do not publish or change live merchant settings without approval.

---

## 8. Testing and Quality Assurance

Testing scope should match the change's risk and visibility. Do not skip a category of testing solely because it is inconvenient; if a category is genuinely not applicable, say so explicitly rather than silently omitting it.

### Unit and integration testing

- Add or update unit tests for changed business logic, including edge cases and failure paths.
- Add integration tests for interactions across boundaries (service-to-database, service-to-service, API contract).
- Mock external services at the boundary; do not call real third-party/production services from automated tests.

### End-to-end (E2E) testing

- Cover critical user journeys end-to-end (signup, checkout, core workflow) with an E2E tool already used in the repo, or propose one if none exists and get approval before adding new tooling.
- Keep E2E suites focused on high-value flows; avoid duplicating unit-test-level detail in E2E tests.

### UI/UX testing

- Verify layout and interaction across the project's supported breakpoints (mobile, tablet, desktop) — not just the default viewport.
- Verify supported browsers/devices as defined in the project's requirements; do not assume one browser's rendering represents all of them.
- Check keyboard navigation, focus order, and screen-reader-relevant semantics for interactive UI (forms, modals, menus).
- Check loading, empty, error, and success states are all implemented and visually distinct — not just the "happy path" state.
- For any visual change, check for layout shift, overflow, truncation, and touch-target sizing on small screens.
- Where the project has a design system or Figma reference, compare implementation against it for spacing, typography, and component consistency.

### Theme testing (light / dark / system / high-contrast)

- If the project supports multiple themes, verify every changed or new screen in **light mode**, **dark mode**, and **system/auto mode** (following the OS setting) — not only the theme used during development.
- Check for contrast issues: text-on-background contrast should meet the project's accessibility target (see below) in every supported theme.
- Check that images, icons, borders, and shadows remain legible and intentional in dark mode (no invisible borders, no blown-out white assets on dark backgrounds).
- Check theme switching itself: no flash of incorrect theme on load, and the choice persists as the project specifies (session, user setting, or system-following).
- If the project supports a high-contrast or reduced-motion mode, verify those explicitly rather than assuming they inherit correctly from the base theme.

### Accessibility (a11y) testing

- Target the project's accessibility standard (commonly WCAG 2.1/2.2 AA unless the project specifies otherwise).
- Check color contrast, alt text, form labels, ARIA roles/attributes (only where semantic HTML is insufficient), and focus visibility.
- Verify the interface is usable via keyboard alone for interactive flows.
- Use automated a11y checks (e.g. axe, Lighthouse) as a baseline, but do not treat a passing automated scan as proof of full accessibility — manual keyboard/screen-reader spot checks matter for anything complex (modals, custom widgets, drag-and-drop).

### Performance and load testing

- For user-facing pages, check Core Web Vitals (LCP, CLS, INP) where relevant to the product.
- For APIs/services expected to handle meaningful traffic, run load/stress tests against realistic expected peak load before declaring a feature production-ready, not just functional correctness under light load.
- Watch for N+1 queries, missing indexes, unbounded result sets, and unnecessary re-renders introduced by the change.
- Profile before optimizing; do not guess at performance bottlenecks.

### Security testing

- Re-check authentication/authorization on every new or changed endpoint — do not assume it inherits protection from a sibling route.
- Validate and sanitize all external input; check for injection (SQL, NoSQL, command), XSS, and unsafe deserialization where relevant to the stack.
- Check for exposed secrets, verbose error messages, or debug endpoints left enabled.
- For dependency changes, check for known vulnerabilities (e.g. via `npm audit`/equivalent) before considering the task done.
- Treat any security-relevant finding as a blocker to raise with the user, not something to silently patch and move past without disclosure.

### Cross-cutting checks

- **Regression:** re-run the existing test suite, not only new tests, to confirm nothing else broke.
- **Internationalization/localization** (if applicable): verify text expansion/contraction, date/number/currency formatting, and RTL layout where the project supports those locales.
- **Data integrity:** for changes touching persistence, verify data is stored, retrieved, and displayed consistently after the change (no silent truncation, wrong timezone, or type coercion bugs).

### Documentation

Record the applicable test types, how to run them, and any known gaps or intentionally out-of-scope areas in `docs/TESTING.md`, and report each category's actual result (`PASS`/`FAIL`/`NOT RUN`/`BLOCKED`) in the task handoff (Section 13), not just "tests passed."

---

## 9. SEO and GEO (Conditional)

SEO/GEO work applies only when the product and page are intended to receive search or AI-search traffic. Do not force this section onto private dashboards, authenticated workflows, internal tools, or pages that should not be indexed.

### Traditional SEO (Google/Bing)

For relevant public pages:

- Confirm a keyword/content brief before writing page copy — ask the user for an existing keyword list, or research and propose one for approval; do not target keywords that were never confirmed.
- Unique, useful title, meta description, and heading structure (one H1, logical H2/H3 order) built around the confirmed intent — not stuffed.
- Descriptive, readable URLs where appropriate.
- Useful internal links and descriptive image alt text/filenames.
- Correct indexability, canonical URLs, sitemap, and robots directives.
- Structured data that follows current search engine guidance and accurately matches visible page content — never schema for its own sake.
- Mobile usability, accessibility, and Core Web Vitals (image optimization, lazy loading, minimal unnecessary JS).
- Credible sourcing for factual claims and clear author/organization information where appropriate.

### GEO — visibility in AI answers (ChatGPT, Perplexity, Google AI Overview, Claude)

Apply only where relevant, and never at the expense of accuracy or usefulness to a human reader:

- Structure genuinely useful sections as a direct question (as an H2/H3) followed by a clear, self-contained answer in the first sentence or two, then supporting detail — this helps both readers and AI extraction, but only add a question heading where a real user question exists.
- Lead with the concrete answer/definition before elaboration, in content where that matches how the page is actually used.
- Attribute facts and statistics to a real source; do not fabricate figures or citations to appear authoritative.
- Add an FAQ section only when there are genuine, distinct user questions worth answering — not as a default block on every page — and use FAQ schema only when the visible FAQ content matches it exactly.
- Use scannable structure (lists, tables, short paragraphs) where it improves clarity, not as a formatting mandate.
- Mention brand/product name and value proposition naturally where it reads correctly; do not repeat it mechanically.
- Keep author/organization/expertise information clear and accurate (supports E-E-A-T) where the page type calls for it.
- Never promise specific rankings, traffic numbers, or guaranteed AI citations — these are not controllable outcomes.

### Documentation

Maintain `docs/SEO_KEYWORDS.md` only if the project has an active SEO/GEO strategy: map target terms/topics to pages, and record research date, market, language, and intent.

### Verification checklist (only for pages in scope)

- [ ] Title/meta description present, matches confirmed intent, not stuffed
- [ ] One H1; heading structure logical
- [ ] Structured data (if any) matches visible content and current guidelines
- [ ] Image alt text present and descriptive
- [ ] Internal links relevant, not forced
- [ ] Indexability/canonical/sitemap correct for the page's intended visibility
- [ ] Mobile usability and Core Web Vitals checked where feasible

---

## 10. Verification and Definition of Done

First inspect `package.json`, workspace configuration, CI workflows, and `DEVELOPMENT.md` to discover the actual commands. Never invent scripts.

For each task, run the applicable checks, typically:

1. Focused unit/integration tests for changed behavior
2. Lint and formatting checks, if configured
3. Typecheck, if applicable
4. E2E tests when the change affects critical user journeys
5. UI/UX and theme checks (light/dark/system, responsive breakpoints) for user-facing changes
6. Accessibility checks for user-facing changes
7. Security checks for anything touching auth, input handling, or dependencies
8. Performance/load checks when the change affects a high-traffic path or data volume
9. Production build
10. Relevant migration or schema checks when applicable

Use the project's package manager and exact scripts. For example, use `pnpm` in a pnpm project, not npm by default. Never invent a command or report a check as passed without executing it and inspecting the result.

### Failure handling

- Read the actual output and identify the root cause.
- Distinguish failures introduced by the change from pre-existing or environment-related failures.
- Fix failures caused by the change and rerun the failed checks.
- After fixes, rerun the full applicable verification sequence for the task, not just the last failing command. Do not skip a required check because it is inconvenient or time-consuming; if it cannot run, mark it BLOCKED/NOT RUN and explain why.
- If a check is blocked by unavailable services, credentials, environment, or time, report it as `NOT RUN` or `BLOCKED`, with the reason.
- If up to three focused attempts do not resolve an issue, stop making speculative changes. Report the exact error, commands run, attempted fixes, and what decision/help is needed. Do not continue making random changes.
- Never weaken or delete tests, lint rules, type checks, or security controls merely to obtain a green result.

### Definition of Done

A task is Done only when:

- All acceptance criteria are met, or any exception is explicitly documented and approved by the user.
- All applicable required tests/checks have passed, including relevant UI/UX, theme, accessibility, and security checks for user-facing or sensitive changes. A blocked or unrun required check must never be represented as a fully verified completion; report the task as Blocked or Partially Complete unless the user explicitly accepts the limitation.
- The Git diff has been reviewed for scope, accidental changes, and secrets.
- Relevant documentation and task status are updated.
- The handoff accurately reports what was and was not verified.

A successful build alone does not prove correctness, security, accessibility, or production readiness.

---

## 11. Observability, Reliability, and Operations

Applicable once the project has a real deployment target; scale the depth to the project's actual stage.

- **Logging:** use structured logs at appropriate levels; never log secrets, tokens, or full sensitive payloads.
- **Error tracking:** wire up an error-tracking tool (e.g. Sentry or equivalent) for production surfaces where one exists in the project; do not let unhandled exceptions fail silently.
- **Monitoring/alerting:** for services with uptime expectations, ensure basic health checks and alerts exist for critical failures, not just for the happy path.
- **Backups and disaster recovery:** for any persistent data store, confirm a backup strategy exists and note the recovery process; never assume backups exist without verifying.
- **Rollback plan:** before a deploy/migration that's hard to reverse, confirm how to roll back before proceeding.
- **Environment parity:** keep local/staging/production configuration differences explicit and documented (env vars, feature flags), and avoid environment-specific hacks that silently diverge behavior.
- **Secrets management:** use the project's existing secrets mechanism (env vars, vault, secret manager); never introduce a new ad hoc method without approval.

---

## 12. Git and Change Management

- Inspect `git status` and the diff before editing.
- Preserve all pre-existing user changes.
- Use a feature branch when the repository workflow calls for it.
- Keep changes and commits focused on one logical task.
- Follow the repository's commit convention; if none exists, Conventional Commits may be used.
- Do not commit, push, create/merge a PR, force-push, amend, reset, or deploy unless the user has explicitly authorized that action for this project or the repository's explicit workflow grants that permission. Never infer approval for destructive or externally visible actions.
- Never include secrets, local environment files, build artifacts, or unrelated changes in a commit.
- Before suggesting or making a commit, inspect the staged diff.

Example commit messages:
- `feat(auth): add registration endpoint`
- `fix(claim): handle fulfilled claim status`
- `test(auth): cover duplicate email registration`
- `docs: document local development setup`

---

## 13. Progress, Decisions, and Session Handoff

After completing a task:

1. Update its status and acceptance criteria in `docs/TASKS.md`.
2. Update `docs/PROGRESS.md` with:
   - Current phase and completed task
   - Files or behavior changed
   - Actual verification results (including UI/UX, theme, accessibility, and security checks where applicable)
   - Known issues and blockers
   - One recommended next task
3. Update `docs/DECISIONS.md` only for meaningful decisions. Record context, decision, alternatives, consequences, and status.
4. Update README/API/database/security/testing/SEO documentation only where affected.
5. Do not claim a commit was created unless it was actually created.

At the start of a new session, read the handoff and verify the current repository state before continuing. If the handoff disagrees with code or Git state, trust verified repository evidence and report the discrepancy.

---

## 14. Final Response Format

At the end of each task, provide a concise handoff:

### Completed
- What changed and why

### Files
- Main files changed

### Verification
- Each check: `PASS`, `FAIL`, `NOT RUN`, or `BLOCKED`
- Include the actual command and a short result where useful
- For user-facing changes, explicitly list UI/UX, theme (light/dark/system), and accessibility check results, not just build/test status

### Notes
- Risks, limitations, assumptions, or follow-up work

### Next
- One logical next task, if applicable

Be direct and factual. Distinguish verified facts from assumptions. Do not claim a task is production-ready merely because code was generated or a build passed.

---

## 15. Start Command

When the user says, "I have a project idea; let's start," begin the new-project discovery process in Section 1.

When the user gives a task in an existing repository, inspect the project and begin with the relevant existing-project workflow. Do not restart discovery or rewrite documentation unnecessarily.
