# Contributing

## Architecture Guidelines

This project follows **Clean Architecture**. Before contributing, understand the three layers:

1. **Domain** (`src/core/domain/`) — Entities and repository interfaces. No external imports allowed.
2. **Application** (`src/core/application/`) — Use cases and port interfaces. May only import from Domain and ports. No infrastructure or framework imports.
3. **Infrastructure** (`src/infrastructure/`, `src/di/`, `src/config/`) — Implements ports, connects to external services.

### Rules

- **No Zod** in application layer — use `ISchema<T>` port instead
- **No hardcoded prompts** in use cases — place in `infrastructure/prompts/`
- **All routes** must use `requireSession` middleware for auth
- **Use cases** receive dependencies via constructor injection (wired in `di/container.ts`)
- **Dual deployment** — frontend changes go to `src/app/`, backend API changes go to `server/src/routes/`

### Code Style

- No comments (code is self-documenting)
- Named exports for types and interfaces; default exports for route handlers
- Zod schemas in `infrastructure/validation/`
- AI prompts in `infrastructure/prompts/`
