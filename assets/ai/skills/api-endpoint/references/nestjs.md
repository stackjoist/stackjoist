# NestJS reference

- Follow the existing module/provider boundaries. A feature gets its own module; controllers stay thin and call providers.
- Validate DTOs at the boundary. With class-validator, use a `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` so unknown fields are rejected. If the project uses Zod pipes instead, follow that.
- Put authorization in guards and apply them explicitly to new routes; test that unauthenticated and unauthorized requests fail.
- Use the project's existing exception filters and response format. Do not add a global interceptor or filter, or change the response envelope, without checking API compatibility and getting approval.
- Map known database errors (for example Prisma unique-constraint violations) to proper HTTP errors in one place; never return raw database errors.
- Test providers with unit tests and important flows with HTTP-level tests (`@nestjs/testing` + Supertest) against a test database.
- Keep Swagger/OpenAPI decorators in sync with DTOs when the project publishes an API contract.
