# Moolah Server

Back-end server for the Moolah personal finance tracker. Built with Hapi.js, MySQL, and ES modules.

## Project Structure

```
src/
  auth/          # OAuth and session authentication
  db/            # Database access layer (DAOs)
  handlers/      # HTTP request handlers (grouped by domain)
  model/         # Business logic (e.g., transaction forecasting)
  plugins/       # Hapi plugins
  routes/        # Route definitions
  utils/         # Shared utilities
  config.js      # Configuration via configue
  server.js      # Hapi server factory
test/
  db/            # DAO tests (real database)
  integration/   # End-to-end tests using DSL framework
    dsl/         # Domain-specific test helpers
  unit/          # Handler and model unit tests (stubbed DAOs)
  utils/         # Test infrastructure (dbTestUtils, etc.)
db/              # Database migrations
```

## Key Commands

Use `yarn` (not npm) for all package management and script execution.

```sh
yarn test                    # Run all tests (migrates DB first)
yarn integration-test        # Integration tests only
yarn dao-test                # DAO tests only
yarn unit-test               # Unit tests only
yarn test-watch              # All tests with watch mode
yarn run migrate-db          # Run database migrations
yarn lint                    # ESLint
yarn pretty                  # Prettier
```

## Code Conventions

- ES modules (`import`/`export`), not CommonJS.
- Amounts are stored as integers (cents).
- Transaction `amount` is negative for money leaving `account_id` (transfers, expenses).
- Account types: `"bank"` (default) and `"investment"`.
- Prettier: single quotes, trailing commas (es5), no parens on single arrow params.

## Testing

See [docs/test-style-guide.md](docs/test-style-guide.md) for full conventions.

Three test tiers:
- **DAO tests** (`test/db/`): Direct database queries with real MySQL.
- **Unit tests** (`test/unit/`): Handlers tested with stubbed DAOs via `dbTestUtils.stubDaos()`.
- **Integration tests** (`test/integration/`): Full HTTP stack using the DSL framework (`Dsl.create()`, alias-based data tracking).

Assertions use Chai `assert` (not `expect`). Mocking uses Sinon.

## Analysis Endpoints

The analysis endpoints compute aggregated financial data:

- `GET /api/analysis/dailyBalances/` — Daily running balances, net worth, earmarks, investment values
- `GET /api/analysis/incomeAndExpense/` — Monthly income/expense with custom month-end day
- `GET /api/analysis/expenseBreakdown/` — Expense totals by category and month
- `GET /api/analysis/categoryBalances/` — Balance totals by category with filters

See [docs/analysis-invariants.md](docs/analysis-invariants.md) for the invariants that should hold across these endpoints (balance consistency, transfer net-zero, net worth calculation, etc.) and known bug risks.

See [docs/analysis-test-plan.md](docs/analysis-test-plan.md) for a comprehensive test plan covering all analysis endpoints.
