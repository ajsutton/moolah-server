# Analysis Data Invariants

This document records the invariants that should hold across the analysis endpoints,
particularly between individual account balances and the aggregated net worth / daily balance data.

## Data Model Context

- **Transactions** have `type` (income, expense, transfer, openingBalance), `account_id` (source),
  `to_account_id` (transfer destination), `amount` (negative for money leaving source account).
- **Accounts** have `type` — notably "investment" vs non-investment (e.g. "bank").
- **investment_value** table stores market valuations per investment account per date,
  separate from transaction-based tracking.
- **Earmarks** are tracked via the `earmark` field on income/expense transactions.

## Invariants

### 1. Sum of Individual Account Balances == `balance + investments`

On any given date, the `balance` field from `/api/analysis/dailyBalances` (which tracks
non-investment accounts) plus `investments` (which tracks investment account transaction flow)
should equal the sum of every individual account's balance as returned by
`/api/account/{id}/balances`.

This is the most powerful cross-check available because it compares two independent
code paths that should agree.

### 2. Transfers Are Net-Zero on Total Balance

No transfer of any kind should change `balance + investments`:

- **Bank-to-bank transfers**: excluded entirely from `dailyProfitAndLoss` query.
  Each individual account changes, but the aggregate does not.
- **Investment-to-investment transfers**: included in query but both `profit` and
  `investments` compute to 0.
- **Bank-to-investment / investment-to-bank**: `profit` and `investments` change by
  equal-and-opposite amounts.

### 3. `availableFunds == balance - earmarked`

On every date in dailyBalances output, `availableFunds` must equal `balance - earmarked`.
The `earmarked` running total accumulates from `SUM(IF(earmark IS NOT NULL, amount, 0))`
across income/expense transactions.

### 4. `netWorth == balance + investmentValue`

When investment_value entries exist, `netWorth` should equal `balance + investmentValue`
(market-value based). When no investment_value entries exist, it falls back to
`balance + investments` (transaction-based).

### 5. Date-Range Consistency

The balance at any date should be the same regardless of whether the query starts from
the beginning of time or uses an `after` parameter with a starting balance. That is:

    dailyBalances(after=null)[dateX].balance == dailyBalances(after=dateY)[dateX].balance

for any dateY < dateX.

### 6. Monthly Profit Consistency

The sum of `profit` values from `incomeAndExpense` over a date range should equal the
change in `balance` from `dailyBalances` over the same range — provided the date ranges
align (accounting for the custom month-end day grouping).

### 7. Chronological Ordering

All entries in the dailyBalances response must be in strictly ascending date order.
This is non-trivial because investment_value entries can introduce dates that have no
transaction data, and the gap-filling logic must maintain order.

### 8. Gap-Filled Entries Carry Forward Correctly

On dates where no transactions occurred but an entry exists (due to investment_value),
the `balance`, `earmarked`, `availableFunds`, and `investments` fields should equal
the values from the most recent prior date that had transaction data.

## Known Bug Risks

### Investment Value Initialization with `after` Date

`getCombinedValues` calculates deltas using a subquery that only looks for previous values
at or after the `from` date. If the first investment_value entry in the range had a prior
value *before* the from date, that prior value is ignored — the delta becomes
`value - 0` instead of `value - previous_value`, inflating the starting investment value.

### Falsy-Zero Fallback in Gap-Fill

The gap-fill code uses `||` chaining:
```js
entry.investmentValue = balancesList[i-1].investmentValue || balancesList[i-1].investments || 0;
```
If `investmentValue` is legitimately `0`, this falls through to `investments` (transaction-based),
silently switching from market-value to transaction-based valuation.

### Object Key Ordering for Mixed-Source Dates

Entries from transactions are inserted into the `balances` object first, then entries from
investment_value dates. `Object.values()` returns insertion-order, so investment-value-only
dates may not be in chronological position relative to transaction dates. The gap-fill loop
iterates by array index, not by date, which could produce incorrect carry-forward values.
