# Test Style Guide

This document describes the conventions and patterns used in the moolah-server test suite.
Follow these guidelines when writing new tests.

## Test Framework and Tools

- **Test runner**: Mocha
- **Assertions**: Chai `assert` (not BDD-style `expect`)
- **Mocking/stubbing**: Sinon
- **Module system**: ES modules (`import`/`export`)

## Three Test Tiers

Tests are organized into three tiers, each with distinct patterns:

### 1. DAO Tests (`test/db/*.spec.js`)

Test database queries directly against a real MySQL test database.

```js
import dbTestUtils from '../utils/dbTestUtils.js';
import AnalysisDao from '../../src/db/analysisDao.js';
import { assert } from 'chai';
import idGenerator from '../../src/utils/idGenerator.js';

describe('Analysis DAO', function () {
  let connection;
  let analysisDao;
  let userId;

  beforeEach(async function () {
    userId = idGenerator();
    connection = await dbTestUtils.createConnection();
    analysisDao = new AnalysisDao(dbTestUtils.queryFunction(connection));
  });

  afterEach(async function () {
    await dbTestUtils.deleteData(userId, connection);
    connection.destroy();
  });

  it('should get daily profit and loss', async function () {
    await transactionDao.create(userId, makeTransaction({
      date: '2017-06-03', type: 'income', amount: 100,
    }));
    assert.deepEqual(
      await analysisDao.dailyProfitAndLoss(userId, '2017-06-01'),
      [{ date: '2017-06-03', profit: '100', earmarked: '0', investments: '0' }]
    );
  });
});
```

Key conventions:
- Create a fresh `userId` via `idGenerator()` per test for isolation.
- Instantiate DAOs with `dbTestUtils.queryFunction(connection)`.
- Clean up with `dbTestUtils.deleteData(userId, connection)` then `connection.destroy()`.
- Create test data directly via DAO `create()` methods.
- Use a `makeTransaction()` helper to merge overrides into a minimal template.
- DAO results return string values for numeric fields (MySQL driver behavior).

### 2. Unit Handler Tests (`test/unit/handlers/**/*.spec.js`)

Test HTTP handlers in isolation with stubbed DAOs.

```js
import sinon from 'sinon';
import { assert } from 'chai';
import { create as serverFactory } from '../../../../src/server.js';
import dbTestUtils from '../../../utils/dbTestUtils.js';
import idGenerator from '../../../../src/utils/idGenerator.js';

describe('Create Transaction Handler', function () {
  let server;
  let userId;
  let daos;

  beforeEach(async function () {
    userId = idGenerator();
    daos = dbTestUtils.stubDaos();
    server = await serverFactory();
  });

  afterEach(function () {
    dbTestUtils.restoreDaos();
    return server.stop();
  });

  it('should return bad request when account does not exist', async function () {
    daos.accounts.account.resolves(undefined);
    const response = await makeRequest({ accountId: 'missing', amount: 100 });
    assert.equal(response.statusCode, 400);
  });

  function makeRequest(payload) {
    return server.inject({
      url: '/api/transactions/',
      method: 'POST',
      payload,
      auth: { strategy: 'cookie', credentials: { userId } },
    });
  }
});
```

Key conventions:
- Use `dbTestUtils.stubDaos()` to get Sinon stubs for all DAOs.
- Configure stubs with `.resolves()`, `.withArgs()`, `.onCall()`.
- Use `server.inject()` to simulate HTTP requests.
- Always restore stubs with `dbTestUtils.restoreDaos()` and stop server.
- Extract a `makeRequest()` helper for repeated request patterns.

### 3. Integration Tests (`test/integration/*.spec.js`)

Full end-to-end tests using the DSL framework.

```js
import Dsl from './dsl/index.js';

describe('Analysis', function () {
  let dsl;

  beforeEach(async function () {
    dsl = await Dsl.create();
    dsl.login();
    await dsl.accounts.createAccount({
      alias: 'account1', date: '2017-05-31', balance: 0,
    });
  });

  afterEach(function () {
    return dsl.tearDown();
  });

  it('should get daily balances', async function () {
    await dsl.transactions.createTransaction({
      account: 'account1', date: '2017-06-03', type: 'income', amount: 1000,
    });
    await dsl.analysis.verifyDailyBalances({
      expected: [{
        date: '2017-06-03',
        balance: 1000,
        earmarked: 0,
        investments: 0,
      }],
    });
  });
});
```

Key conventions:
- Create DSL with `await Dsl.create()`, tear down with `dsl.tearDown()`.
- Call `dsl.login()` before making requests.
- Reference test data by alias strings (e.g., `account: 'account1'`).
- Use domain-specific DSL methods: `dsl.accounts`, `dsl.transactions`,
  `dsl.analysis`, `dsl.categories`, `dsl.earmarks`, `dsl.budgets`.
- DSL verify methods make assertions internally.
- Express expected amounts as arithmetic expressions for clarity
  (e.g., `balance: 1000 - 5000 + 100`).

## DSL Framework (`test/integration/dsl/`)

The DSL provides a fluent interface for integration tests:

- **`Dsl.create()`**: Creates a Hapi server instance and all DSL helpers.
- **`dsl.login(args)`**: Sets auth credentials. Generates a unique userId.
- **`dsl.tearDown()`**: Stops server and deletes all test data.
- **Alias maps**: Each DSL tracks created entities by alias in `Map` objects.
  Use `alias: 'name'` when creating, then reference by alias in later calls.
- **`dslUtils.lookupId(alias, map)`**: Resolves alias to actual ID.
  Special value `<noValue>` passes the string literally.
- **`dslUtils.formatQueryArgs(obj)`**: Builds URL query strings.
- **`dslUtils.override(obj, overrides)`**: Merges non-undefined values.
- **`dslUtils.withoutUndefined(obj)`**: Strips undefined properties.

When adding a new DSL module, follow the existing pattern: constructor takes
`(server, ...aliasMaps)`, methods accept an options object merged with defaults
via `Object.assign`.

## General Conventions

### Describe/It Structure
- Top-level `describe` names the feature or module.
- Nested `describe` blocks group related scenarios.
- `it` descriptions start with `should` (e.g., `'should get daily balances'`).
- Use `function()` not arrow functions (Mocha binds `this` for timeouts).

### Assertions
- Use `assert.deepEqual(actual, expected)` for objects and arrays.
- Use `assert.equal(actual, expected)` for primitives.
- Use `assert.include(object, subset)` for partial matching.
- Use `assert.isUndefined(value)` for undefined checks.
- Actual value comes first: `assert.equal(actual, expected)`.

### Async
- All async tests and hooks use `async function`.
- Use `await` throughout, no `.then()` chains.
- `afterEach` can return a promise directly (e.g., `return dsl.tearDown()`).

### Test Data
- Use fixed, deterministic dates (e.g., `'2017-06-03'`).
- Use `idGenerator()` for unique IDs when creating data directly via DAOs.
- Use the `makeTransaction(overrides)` pattern for DAO tests:
  ```js
  const minimalTransaction = {
    id: 'transaction1', type: 'expense',
    date: '2017-06-04', accountId: 'account-id', amount: 5000,
  };

  function makeTransaction(args) {
    return Object.assign({}, minimalTransaction, { id: idGenerator() }, args);
  }
  ```
- Express expected numeric values as arithmetic for readability:
  ```js
  balance: 1000 - 5000 + -10 + 100,
  ```

### User Isolation
- Every test gets a unique `userId` from `idGenerator()`.
- Cleanup deletes by `userId`, so tests never interfere.

### File Naming
- Test files: `*.spec.js`
- DSL files: `*Dsl.js`
- Helper files: `*Utils.js` or descriptive names (e.g., `transactionHelper.js`)
- Mirror source structure in test directories where applicable.

### Formatting
- Prettier with: single quotes, trailing commas (es5), no parens on single arrow params.
- ESLint with recommended rules and Prettier compatibility.
