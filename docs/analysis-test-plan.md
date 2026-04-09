# Analysis Endpoints Test Plan

This document enumerates specific test cases for all four analysis endpoints.
Each test targets a particular behaviour, edge case, or invariant from
`analysis-invariants.md`. The goal is a blueprint comprehensive enough to
surface the known bug risks documented there and any similar latent issues.

---

## Notation

- **bank account** -- any non-investment account (type = "bank").
- **investment account** -- account with type = "investment".
- **earmarked** -- transaction with a non-null `earmark` field.
- All monetary amounts are integers (cents).
- "Invariant N" references the numbered invariants in `analysis-invariants.md`.

---

## 1. `/api/analysis/dailyBalances`

### 1.1 Basic Transaction Types

#### DB-1.1.1 Income only (positive amount)
- **Setup**: One bank account. Single income transaction, amount +1000, date 2024-01-15.
- **Expected**: One entry with balance=1000, earmarked=0, availableFunds=1000, investments=0, netWorth=1000.
- **Validates**: Basic accumulation; Invariant 3 (availableFunds == balance - earmarked).

#### DB-1.1.2 Expense only (negative amount)
- **Setup**: One bank account. Single expense transaction, amount -500, date 2024-01-15.
- **Expected**: One entry with balance=-500, earmarked=0, availableFunds=-500, investments=0, netWorth=-500.
- **Validates**: Negative balance handling; Invariant 3.

#### DB-1.1.3 Income with negative amount (refund / reversal)
- **Setup**: One bank account. Income +1000 on 2024-01-10, then income -200 on 2024-01-15.
- **Expected**: Day 10: balance=1000. Day 15: balance=800.
- **Validates**: Negative income reduces balance correctly.

#### DB-1.1.4 openingBalance transaction
- **Setup**: One bank account. openingBalance +5000 on 2024-01-01, then income +100 on 2024-01-02.
- **Expected**: Day 1: balance=5000. Day 2: balance=5100. openingBalance is included in `profit` via the `dailyProfitAndLoss` query (it is not excluded by type filter).
- **Validates**: openingBalance contributes to running balance.

#### DB-1.1.5 Multiple transaction types on the same day
- **Setup**: One bank account. On 2024-01-15: income +2000, expense -300, openingBalance +500.
- **Expected**: Single entry with balance=2200.
- **Validates**: Same-day aggregation.

### 1.2 Transfer Types

#### DB-1.2.1 Bank-to-bank transfer
- **Setup**: Two bank accounts. Transfer from account1 to account2, amount 1000, date 2024-02-01.
- **Expected**: The transfer is excluded from `dailyProfitAndLoss` (query filters out transfers where neither side is investment). No entry appears for that date (or balance unchanged if other transactions exist).
- **Validates**: Invariant 2 (transfers are net-zero); bank-to-bank transfers excluded from aggregate.

#### DB-1.2.2 Bank-to-investment transfer
- **Setup**: One bank account, one investment account. Transfer from bank to investment, amount -5000 (money leaving bank), date 2024-03-01.
- **Expected**: balance decreases by 5000, investments increases by 5000. netWorth unchanged.
- **Validates**: Invariant 2 (net-zero on total); Invariant 4 (netWorth == balance + investmentValue, falling back to investments when no investment_value entries).

#### DB-1.2.3 Investment-to-bank transfer
- **Setup**: One bank account, one investment account. Prior bank-to-investment of -5000. Then transfer from investment to bank, amount -2000 (money leaving investment), date 2024-03-15.
- **Expected**: balance increases by 2000, investments decreases by 2000. netWorth unchanged.
- **Validates**: Invariant 2.

#### DB-1.2.4 Investment-to-investment transfer
- **Setup**: Two investment accounts. Transfer from investment1 to investment2, amount -3000, date 2024-04-01.
- **Expected**: Included in dailyProfitAndLoss (at least one side is investment), but both `profit` and `investments` compute to 0 for this row. Total balance + investments unchanged.
- **Validates**: Invariant 2.

#### DB-1.2.5 All four transfer types in sequence
- **Setup**: Two bank accounts, two investment accounts. One of each transfer type on consecutive days. Also add income of +10000 on day 1.
- **Expected**: On each day, `balance + investments` equals 10000 (transfers never change the total).
- **Validates**: Invariant 2 comprehensively.

### 1.3 Account Types

#### DB-1.3.1 Non-investment accounts only
- **Setup**: Two bank accounts. Income into each.
- **Expected**: All amounts appear in `balance`. `investments` is 0 throughout.
- **Validates**: Basic non-investment path.

#### DB-1.3.2 Investment accounts only (income/expense in investment accounts)
- **Setup**: One investment account. Income +1000 into the investment account.
- **Expected**: The income appears in `investments` (since the source account is investment-type). `balance` (non-investment) is 0. `profit` is 0 (investment account income excluded from profit).
- **Validates**: Correct separation of investment vs non-investment in the SQL.

#### DB-1.3.3 Transactions with null account_id
- **Setup**: One bank account. Income +2000 with account_id=null on 2024-01-15. Income +1000 with account_id=account1 on same date.
- **Expected**: The null-account income is excluded from `profit` in `dailyProfitAndLoss` (the SQL uses `IF(account_id IS NOT NULL ...)`). Only +1000 counted.
- **Validates**: Null account_id handling. Also cross-check: null-account transactions DO appear in earmarked if they have an earmark (the earmarked SUM does not filter on account_id).

#### DB-1.3.4 Null account_id with earmark
- **Setup**: Income +2000, account_id=null, earmark='earmark1', date 2024-01-15.
- **Expected**: balance=0 (null account excluded from profit), earmarked=2000 (earmark SUM does not check account_id), availableFunds=-2000.
- **Validates**: Invariant 3 (availableFunds == balance - earmarked) holds even when earmarked > balance.

### 1.4 Earmarks

#### DB-1.4.1 Earmarked income
- **Setup**: One bank account. Income +1000 with earmark, date 2024-01-15.
- **Expected**: balance=1000, earmarked=1000, availableFunds=0.
- **Validates**: Invariant 3.

#### DB-1.4.2 Earmarked expense
- **Setup**: One bank account. After earmarked income of +1000, earmarked expense -400, date 2024-01-20.
- **Expected**: balance=600, earmarked=600, availableFunds=0.
- **Validates**: Invariant 3; earmarked tracks the running sum.

#### DB-1.4.3 Mix of earmarked and non-earmarked
- **Setup**: One bank account. Income +5000 (no earmark), income +1000 (earmarked), expense -200 (earmarked), expense -300 (no earmark).
- **Expected**: balance=5500, earmarked=800, availableFunds=4700.
- **Validates**: Invariant 3.

#### DB-1.4.4 Earmarked transfer (should not affect earmarked total)
- **Setup**: One bank account, one investment. Transfer from bank to investment, amount -1000, with earmark set.
- **Expected**: The earmarked SUM in dailyProfitAndLoss uses `SUM(IF(earmark IS NOT NULL, amount, 0))`, which includes transfers. Verify whether earmarked changes or not -- if transfers with earmarks exist, the current code WILL add them to earmarked. Document whether this is intended.
- **Validates**: Understanding of earmark + transfer interaction.

### 1.5 Date Ranges

#### DB-1.5.1 No after date (full history)
- **Setup**: Transactions on 2024-01-01, 2024-02-01, 2024-03-01.
- **Expected**: Three entries, running balances accumulate from zero.
- **Validates**: Default behaviour.

#### DB-1.5.2 With after date
- **Setup**: Same as DB-1.5.1. Query with after=2024-01-15.
- **Expected**: Two entries (Feb and Mar). Starting balance equals the full-history balance at 2024-01-01. Feb entry balance matches full-history Feb balance.
- **Validates**: Invariant 5 (date-range consistency).

#### DB-1.5.3 After date equals exact transaction date
- **Setup**: Transactions on 2024-01-15 and 2024-02-15. Query with after=2024-01-15.
- **Expected**: Only Feb entry appears. The Jan 15 transaction IS included in the starting balance (query uses `date > after`, and the balance seed uses `date < after+1` which is `date <= after`).
- **Validates**: Boundary date handling; Invariant 5.

#### DB-1.5.4 After date after all transactions
- **Setup**: Transactions on 2024-01-15. Query with after=2024-06-01.
- **Expected**: Empty results array. Starting balance computed correctly (full balance of all transactions).
- **Validates**: Edge case -- no results.

#### DB-1.5.5 Date-range consistency cross-check
- **Setup**: Transactions on multiple dates spanning several months.
- **Expected**: For each date D in the full-history result, query with after=(some date before D) and verify the balance at D matches.
- **Validates**: Invariant 5 explicitly.

### 1.6 Investment Values

#### DB-1.6.1 No investment_value entries
- **Setup**: Bank and investment accounts with transactions, but no rows in investment_value table.
- **Expected**: `netWorth = balance + investments` (transaction-based fallback). No gap-fill logic triggered.
- **Validates**: Invariant 4 fallback path.

#### DB-1.6.2 Investment_value on dates with transactions
- **Setup**: Bank income on 2024-01-15. Investment_value entry for investment account on 2024-01-15 with value=8000.
- **Expected**: Entry on 2024-01-15 has `investmentValue=8000`, `netWorth = balance + 8000`.
- **Validates**: Invariant 4 (market-value path).

#### DB-1.6.3 Investment_value on dates without transactions (gap-fill)
- **Setup**: Bank income on 2024-01-10. Investment_value on 2024-01-20 with value=5000. No transactions on 2024-01-20.
- **Expected**: Two entries. 2024-01-20 entry has balance/earmarked/availableFunds/investments carried forward from 2024-01-10, and investmentValue=5000.
- **Validates**: Invariant 8 (gap-fill carry-forward); Invariant 7 (chronological ordering).

#### DB-1.6.4 Investment_value date BEFORE first transaction date
- **Setup**: Investment_value on 2024-01-05, value=3000. Bank income on 2024-01-10.
- **Expected**: Two entries in chronological order. 2024-01-05 entry has balance=0, earmarked=0, availableFunds=0, investments=0, investmentValue=3000, netWorth=3000.
- **Validates**: Invariant 7 (ordering); gap-fill for entry with no prior transaction data.

#### DB-1.6.5 Investment_value date BETWEEN two transaction dates (ordering bug)
- **Setup**: Transaction on 2024-01-10. Investment_value on 2024-01-15. Transaction on 2024-01-20.
- **Expected**: Three entries in strict chronological order: Jan 10, Jan 15, Jan 20. The Jan 15 entry carries forward from Jan 10. The Jan 20 entry has its own transaction data.
- **Validates**: Invariant 7. **This targets the known bug risk about Object.values() insertion-order**: transaction dates are inserted first, then investment_value dates. If Jan 15 is appended after Jan 20, the array order is [Jan 10, Jan 20, Jan 15] and gap-fill produces wrong results.

#### DB-1.6.6 Multiple investment accounts with values on same date
- **Setup**: Two investment accounts. investment_value for both on 2024-01-15 (values 5000 and 3000).
- **Expected**: `getCombinedValues` groups by date, so delta = (5000-0) + (3000-0) = 8000. Single date entry with investmentValue=8000.
- **Validates**: Multi-account aggregation in getCombinedValues.

#### DB-1.6.7 Zero-value investment entry (falsy-zero bug)
- **Setup**: Investment_value on 2024-01-10, value=5000. Investment_value on 2024-01-20, value=5000 (delta=0, so cumulative investmentValue stays at 5000). Investment_value on 2024-01-25, value=5000 (delta=0 again). No transactions on these dates, only a bank income on 2024-01-05.
- **Expected**: On 2024-01-20, `investmentValue` should be 5000 (unchanged). On 2024-01-25, also 5000.
- **Validates**: **Known bug risk (falsy-zero)**: The gap-fill code uses `balancesList[i-1].investmentValue || balancesList[i-1].investments || 0`. If investmentValue is 0 (which it is NOT in this case), it would fall through. Construct a scenario where cumulative investmentValue truly equals 0.

#### DB-1.6.8 Investment value that sums to exactly zero
- **Setup**: Investment_value on 2024-01-10, value=5000 (delta=5000). Investment_value on 2024-01-20, value=0 (delta=-5000, cumulative=0). A transaction-only date on 2024-01-15 with investments=3000.
- **Expected**: On 2024-01-20, investmentValue should be 0 (from market data), NOT 3000 (from transaction-based investments). The gap-fill code would see `!entry.investmentValue` as true for 0, but since this date HAS its own investmentValue from the delta loop, the gap-fill `if (i != 0 && !entry.investmentValue)` check triggers and overwrites 0 with the previous entry's investmentValue or investments.
- **Validates**: **Known bug -- falsy-zero**: `!entry.investmentValue` is true when investmentValue is 0, causing the gap-fill to overwrite a legitimate zero.

#### DB-1.6.9 Investment_value with after date (delta initialization bug)
- **Setup**: Investment_value on 2024-01-10 with value=5000. Investment_value on 2024-01-20 with value=8000. Query with after=2024-01-15.
- **Expected**: getCombinedValues uses `from=2024-01-16`. The subquery for the 2024-01-20 entry looks for prior values with `date >= 2024-01-16` -- it finds none (the 2024-01-10 entry is before from). So delta = 8000 - 0 = 8000, instead of the correct 8000 - 5000 = 3000.
- **Validates**: **Known bug risk (investment value initialization with after date)**: the delta is inflated when prior investment_value entries exist before the `from` date.

#### DB-1.6.10 Multiple investment_value entries, after date, with prior value in range
- **Setup**: Investment_value: Jan 10 = 5000, Jan 20 = 8000, Jan 25 = 9000. Query with after=2024-01-15.
- **Expected**: From=Jan 16. Jan 20 delta = 8000 - 0 = 8000 (bug: should be 3000). Jan 25 delta = 9000 - 8000 = 1000 (correct, because Jan 20 is in range). Cumulative: Jan 20 = 8000, Jan 25 = 9000.
- **Validates**: Only the first entry in range is affected by the initialization bug; subsequent deltas are correct.

### 1.7 Cross-Check Invariants

#### DB-1.7.1 Sum of individual account balances == balance + investments
- **Setup**: Two bank accounts, two investment accounts. Various transactions (income, expense, transfers of all types) across multiple dates.
- **Expected**: On each date, sum all individual account balances from `/api/account/{id}/balances` and verify it equals the `balance + investments` from dailyBalances.
- **Validates**: Invariant 1.

#### DB-1.7.2 netWorth == balance + investmentValue (with market data)
- **Setup**: Transactions and investment_value entries.
- **Expected**: On each entry, `netWorth == balance + investmentValue`.
- **Validates**: Invariant 4.

#### DB-1.7.3 netWorth == balance + investments (without market data)
- **Setup**: Transactions but NO investment_value entries.
- **Expected**: On each entry, `netWorth == balance + investments`.
- **Validates**: Invariant 4 (fallback).

#### DB-1.7.4 Chronological ordering
- **Setup**: Transactions on various dates plus investment_value entries on interleaving dates.
- **Expected**: All entries in the response array are in strictly ascending date order.
- **Validates**: Invariant 7.

#### DB-1.7.5 Chronological ordering with many interleaved investment_value dates
- **Setup**: Transactions on Jan 5, Jan 15, Jan 25. Investment_values on Jan 10, Jan 20, Jan 30.
- **Expected**: Output order: Jan 5, Jan 10, Jan 15, Jan 20, Jan 25, Jan 30.
- **Validates**: Invariant 7. Targets the Object.values() ordering bug -- transaction dates [5, 15, 25] are inserted first, then investment-only dates [10, 20, 30] are appended, producing [5, 15, 25, 10, 20, 30] in insertion order.

---

## 2. `/api/analysis/incomeAndExpense`

### 2.1 Basic Transaction Types

#### IE-2.1.1 Income only
- **Setup**: One bank account. Income +1000 on 2024-02-10. monthEnd=31.
- **Expected**: One month entry with income=1000, expense=0, profit=1000, earmarkedIncome=0, earmarkedExpense=0, earmarkedProfit=0.
- **Validates**: Basic income reporting.

#### IE-2.1.2 Expense only
- **Setup**: One bank account. Expense -500 on 2024-02-10. monthEnd=31.
- **Expected**: income=0, expense=-500, profit=-500.
- **Validates**: Basic expense reporting.

#### IE-2.1.3 Income with negative amount
- **Setup**: One bank account. Income -200 on 2024-02-15. monthEnd=31.
- **Expected**: income=-200, expense=0, profit=-200.
- **Validates**: Negative income (refund) is reported as income, not expense.

#### IE-2.1.4 openingBalance excluded
- **Setup**: One bank account. openingBalance +5000 on 2024-01-01, income +100 on 2024-01-15. monthEnd=31.
- **Expected**: openingBalance type is not 'income' or 'expense', and not a transfer with investment accounts, so it is excluded from incomeAndExpense entirely. Only the income +100 appears.
- **Validates**: openingBalance filtering.

#### IE-2.1.5 Transactions with null account_id
- **Setup**: Income +2000 with account_id=null. monthEnd=31.
- **Expected**: The SQL filters `t.account_id IS NOT NULL` for income/expense sums. So income=0, expense=0, profit=0. But the row still appears if other qualifying transactions exist in the same month. If this is the only transaction, the WHERE clause still matches (type='income'), but the SUM produces 0 for all fields except possibly earmarked fields.
- **Validates**: Null account handling in aggregation.

### 2.2 Transfer Types

#### IE-2.2.1 Bank-to-bank transfer
- **Setup**: Two bank accounts. Transfer 1000 between them. monthEnd=31.
- **Expected**: The WHERE clause includes `(t.type IN ('income', 'expense') OR (t.type = 'transfer' AND at.type = 'investment' OR af.type = 'investment'))`. A bank-to-bank transfer has neither side as investment, so it is excluded entirely.
- **Validates**: Bank-to-bank transfers excluded from income/expense.

#### IE-2.2.2 Bank-to-investment transfer
- **Setup**: One bank, one investment. Transfer from bank to investment, amount -5000. monthEnd=31.
- **Expected**: income=0, expense=0, profit=0 (not income/expense type). earmarkedIncome includes `SUM(IF(type='transfer' AND af.type='investment' AND amount < 0, amount, 0))`. Since af (source) is bank, not investment, that term is 0. The `at.type='investment'` terms apply: `earmarkedExpense += SUM(IF(type='transfer' AND at.type='investment' AND amount < 0, -amount, 0))` = -(-5000) = 5000. And `earmarkedProfit += SUM(IF(type='transfer' AND at.type='investment', -amount, 0))` = -(-5000) = 5000.
- **Validates**: Investment transfer treatment in earmarked calculations.

#### IE-2.2.3 Investment-to-bank transfer
- **Setup**: One bank, one investment. Transfer from investment to bank, amount -2000 (money leaving investment). monthEnd=31.
- **Expected**: af.type='investment', so: `earmarkedIncome += SUM(IF(type='transfer' AND af.type='investment' AND amount < 0, amount, 0))` = -2000. `earmarkedProfit += SUM(IF(type='transfer' AND af.type='investment', amount, 0))` = -2000.
- **Validates**: Inverse of bank-to-investment.

#### IE-2.2.4 Investment-to-investment transfer
- **Setup**: Two investment accounts. Transfer between them. monthEnd=31.
- **Expected**: Both af.type and at.type are 'investment'. The earmarked terms involving af.type='investment' and at.type='investment' both fire but with opposite signs, netting to zero for earmarkedProfit.
- **Validates**: Invariant 2 for earmarked calculations.

### 2.3 Month-End Day Grouping

#### IE-2.3.1 Default month end (day 31)
- **Setup**: Transactions on 2024-01-15 and 2024-02-10. monthEnd=31.
- **Expected**: Two separate months: 202401 and 202402.
- **Validates**: Standard monthly grouping.

#### IE-2.3.2 Custom month end (day 15)
- **Setup**: Transactions on 2024-01-10, 2024-01-20, 2024-02-10. monthEnd=15.
- **Expected**: Jan 10 is day <= 15, so month = 202401. Jan 20 is day > 15, so month = 202402. Feb 10 is day <= 15, so month = 202402. Jan 20 and Feb 10 are grouped together.
- **Validates**: Custom month boundary logic.

#### IE-2.3.3 Transaction on exact month-end day
- **Setup**: Transaction on 2024-01-15. monthEnd=15.
- **Expected**: Day 15 is NOT > 15, so month = 202401 (current month). If monthEnd=14, then day 15 > 14, month = 202402.
- **Validates**: Boundary: the `>` comparison (not `>=`).

#### IE-2.3.4 Month with no transactions
- **Setup**: Transactions in January and March, none in February. monthEnd=31.
- **Expected**: Only two month entries. February is not represented (GROUP BY produces no row).
- **Validates**: Sparse month handling.

#### IE-2.3.5 Custom month end at end of short month
- **Setup**: monthEnd=30. Transactions on Feb 28 (non-leap year).
- **Expected**: Feb 28, day 28 <= 30, so month = 202402. This works correctly since the day never exceeds 28 in February.
- **Validates**: Short month edge case.

### 2.4 Earmarked Calculations

#### IE-2.4.1 Earmarked income only
- **Setup**: One bank account. Income +1000 with earmark. monthEnd=31.
- **Expected**: income=1000, earmarkedIncome=1000, earmarkedProfit=1000.
- **Validates**: Earmarked income tracking.

#### IE-2.4.2 Earmarked expense only
- **Setup**: One bank account. Expense -500 with earmark. monthEnd=31.
- **Expected**: expense=-500, earmarkedExpense=-500, earmarkedProfit=-500.
- **Validates**: Earmarked expense tracking.

#### IE-2.4.3 Mix of earmarked and non-earmarked
- **Setup**: Income +1000 (no earmark), income +500 (earmarked), expense -200 (earmarked), expense -300 (no earmark). monthEnd=31.
- **Expected**: income=1500, expense=-500, profit=1000. earmarkedIncome=500, earmarkedExpense=-200, earmarkedProfit=300.
- **Validates**: Separation of earmarked vs total.

#### IE-2.4.4 Multiple earmarks in same month
- **Setup**: Income +1000 earmark1, income +500 earmark2, expense -200 earmark1. monthEnd=31.
- **Expected**: earmarkedIncome=1500, earmarkedExpense=-200, earmarkedProfit=1300. (All earmarked transactions aggregated regardless of which earmark.)
- **Validates**: Earmarks are not separated by earmark ID in this endpoint.

### 2.5 Date Ranges

#### IE-2.5.1 With after date
- **Setup**: Transactions in Jan, Feb, Mar. Query with after=2024-01-31.
- **Expected**: Only Feb and Mar months returned.
- **Validates**: After-date filtering.

#### IE-2.5.2 No after date
- **Setup**: Transactions in Jan, Feb, Mar.
- **Expected**: All three months returned.
- **Validates**: Full history.

#### IE-2.5.3 After date on exact transaction date
- **Setup**: Transaction on 2024-01-15. Query with after=2024-01-15.
- **Expected**: The SQL uses `date > ?`, so the Jan 15 transaction is excluded.
- **Validates**: Boundary: strict greater-than.

### 2.6 Cross-Check Invariants

#### IE-2.6.1 Monthly profit sums match balance deltas from dailyBalances
- **Setup**: Multiple transactions across several months.
- **Expected**: Sum of `profit` from incomeAndExpense over a date range equals the change in `balance` from dailyBalances over the same date range, provided the month boundaries align with the daily data.
- **Validates**: Invariant 6.

#### IE-2.6.2 Profit == income + expense
- **Setup**: Various income and expense transactions.
- **Expected**: For each month entry, `profit == income + expense`.
- **Validates**: Internal consistency of the aggregation.

#### IE-2.6.3 earmarkedProfit == earmarkedIncome + earmarkedExpense (for non-transfer months)
- **Setup**: Earmarked income and expense, no investment transfers.
- **Expected**: `earmarkedProfit == earmarkedIncome + earmarkedExpense`.
- **Validates**: Earmarked field consistency.

---

## 3. `/api/analysis/expenseBreakdown`

### 3.1 Basic Scenarios

#### EB-3.1.1 Single category, single expense
- **Setup**: One category. One expense -500 with that category. monthEnd=31.
- **Expected**: One entry: {categoryId, month, totalExpenses: -500}.
- **Validates**: Basic expense breakdown.

#### EB-3.1.2 Multiple categories
- **Setup**: Three categories. Expenses in each.
- **Expected**: One entry per (category, month) pair with correct totals.
- **Validates**: Multi-category grouping.

#### EB-3.1.3 Multiple expenses in same category and month
- **Setup**: One category. Expenses -100, -200, -300 all in same month. monthEnd=31.
- **Expected**: Single entry with totalExpenses=-600.
- **Validates**: Aggregation within category+month.

#### EB-3.1.4 Expenses without categories (null category_id)
- **Setup**: Expense -500 with category_id=null.
- **Expected**: Excluded from results. The SQL has `AND category_id IS NOT NULL`.
- **Validates**: Null category exclusion.

#### EB-3.1.5 Income transactions excluded
- **Setup**: Income +1000 with a category. Expense -500 with a different category. monthEnd=31.
- **Expected**: Only the expense appears. The SQL filters `type = 'expense'`.
- **Validates**: Only expenses included.

#### EB-3.1.6 Transfer transactions excluded
- **Setup**: Transfer with a category.
- **Expected**: Excluded. SQL filters `type = 'expense'`.
- **Validates**: Type filter.

#### EB-3.1.7 openingBalance transactions excluded
- **Setup**: openingBalance with a category.
- **Expected**: Excluded.
- **Validates**: Type filter.

### 3.2 Month-End Day Grouping

#### EB-3.2.1 Default month end (day 31)
- **Setup**: Expenses on 2024-01-15 and 2024-02-10. monthEnd=31.
- **Expected**: Grouped as 202401 and 202402 respectively.
- **Validates**: Standard grouping.

#### EB-3.2.2 Custom month end (day 15)
- **Setup**: Expense on 2024-01-20 (day > 15). monthEnd=15.
- **Expected**: Grouped as 202402 (next month).
- **Validates**: Custom boundary.

#### EB-3.2.3 Transaction on exact month-end day boundary
- **Setup**: Expense on day 15. monthEnd=15.
- **Expected**: Day 15 is NOT > 15, so grouped into current month.
- **Validates**: Boundary condition.

#### EB-3.2.4 Same category, expenses spanning month boundary
- **Setup**: Category1: expense on Jan 20, expense on Feb 10. monthEnd=15.
- **Expected**: Both grouped into month 202402 (Jan 20 day > 15, Feb 10 day <= 15).
- **Validates**: Cross-boundary grouping.

### 3.3 Date Ranges

#### EB-3.3.1 With after date
- **Setup**: Expenses in Jan and Feb. Query with after=2024-01-31. monthEnd=31.
- **Expected**: Only February expenses returned.
- **Validates**: After-date filtering.

#### EB-3.3.2 No after date
- **Setup**: Expenses in Jan and Feb.
- **Expected**: All expenses returned.
- **Validates**: Full history.

#### EB-3.3.3 After date on exact expense date
- **Setup**: Expense on 2024-01-15. Query with after=2024-01-15. monthEnd=31.
- **Expected**: Excluded (SQL uses `date > ?`).
- **Validates**: Strict greater-than boundary.

### 3.4 Ordering

#### EB-3.4.1 Results ordered by categoryId then month
- **Setup**: Multiple categories, multiple months.
- **Expected**: Results ordered by categoryId first, then by month within each category.
- **Validates**: ORDER BY clause.

---

## 4. `/api/analysis/categoryBalances`

### 4.1 Basic Scenarios

#### CB-4.1.1 Single category, single transaction
- **Setup**: One category. Income +1000 with that category, in a bank account.
- **Expected**: `{categoryId: 1000}`.
- **Validates**: Basic balance by category.

#### CB-4.1.2 Multiple categories
- **Setup**: Three categories. Transactions in each.
- **Expected**: One key per category with summed balance.
- **Validates**: Multi-category aggregation.

#### CB-4.1.3 Multiple transactions in same category
- **Setup**: Category1: +1000, +500, -200.
- **Expected**: `{category1Id: 1300}`.
- **Validates**: Sum aggregation.

#### CB-4.1.4 Transactions with null category excluded
- **Setup**: Income +1000 with category_id=null. Income +500 with category1.
- **Expected**: Only category1 appears: `{category1Id: 500}`.
- **Validates**: `category_id IS NOT NULL` filter.

#### CB-4.1.5 Transfers excluded (when no account filter)
- **Setup**: Transfer +1000 with a category, no account filter.
- **Expected**: Excluded. The query adds `AND t.type != "transfer"` when accountId is undefined.
- **Validates**: Transfer exclusion logic.

#### CB-4.1.6 Transfers included (when account filter is set)
- **Setup**: Transfer +1000 with a category, from account1 to account2. Query with account=account1.
- **Expected**: The transfer IS included when filtering by account (the `type != "transfer"` clause is only added when `accountId === undefined`). For account1 (source), the balance calculation uses `SUM(IF(to_account_id = ?, -amount, amount))`, so the amount is counted positively for account1 (it's the source, not the to_account).
- **Validates**: Account-specific transfer handling.

### 4.2 Account Filtering

#### CB-4.2.1 Filter by specific bank account
- **Setup**: Two bank accounts. Category1 income in account1 (+1000) and account2 (+700).
- **Expected**: With account=account1: `{category1Id: 1000}`. Without filter: `{category1Id: 1700}`.
- **Validates**: Account filter.

#### CB-4.2.2 Filter by non-existent account
- **Setup**: Query with account=nonexistent.
- **Expected**: 404 error ("Account not found").
- **Validates**: Account validation in parseOptions.

#### CB-4.2.3 Filter by investment account
- **Setup**: Investment account with categorized transactions.
- **Expected**: Returns balances for that specific investment account.
- **Validates**: Investment account compatibility.

### 4.3 Date Range Filtering

#### CB-4.3.1 From date filter
- **Setup**: Category1 transactions on Jan 15 (+1000) and Feb 15 (+500). Query with from=2024-02-01.
- **Expected**: `{category1Id: 500}` (only Feb transaction).
- **Validates**: From-date filtering.

#### CB-4.3.2 To date filter
- **Setup**: Category1 transactions on Jan 15 (+1000) and Feb 15 (+500). Query with to=2024-01-31.
- **Expected**: `{category1Id: 1000}` (only Jan transaction).
- **Validates**: To-date filtering.

#### CB-4.3.3 Both from and to
- **Setup**: Transactions in Jan, Feb, Mar. Query with from=2024-01-20, to=2024-02-28.
- **Expected**: Only Feb transaction(s) included.
- **Validates**: Date range.

### 4.4 Category Filtering

#### CB-4.4.1 Filter by specific categories
- **Setup**: Three categories with transactions. Query with category=[category1, category2].
- **Expected**: Only category1 and category2 balances returned.
- **Validates**: Category filter.

#### CB-4.4.2 Filter by non-existent category
- **Setup**: Query with category=[nonexistent].
- **Expected**: 404 error ("Unknown category ...").
- **Validates**: Category validation.

### 4.5 Earmark Filtering

#### CB-4.5.1 Filter by earmark
- **Setup**: Income +1000 with earmark1 and category1. Income +500 with no earmark and category1. Query with earmark=earmark1.
- **Expected**: `{category1Id: 1000}`.
- **Validates**: Earmark filter.

### 4.6 Transaction Type Filtering

#### CB-4.6.1 Filter by transaction type
- **Setup**: Income +1000 and expense -500, both with category1. Query with transactionType=expense.
- **Expected**: `{category1Id: -500}`.
- **Validates**: Transaction type filter.

### 4.7 Scheduled Transaction Handling

#### CB-4.7.1 Scheduled transactions excluded by default
- **Setup**: Regular income +1000 with category1. Scheduled income +500 with category1.
- **Expected**: `{category1Id: 1000}` (scheduled excluded since `scheduled` defaults to false).
- **Validates**: Scheduled transaction exclusion.

#### CB-4.7.2 Scheduled transactions included when requested
- **Setup**: Same as above. Query with scheduled=true.
- **Expected**: `{category1Id: 500}` (only scheduled).
- **Validates**: Scheduled filter.

### 4.8 Payee Filtering

#### CB-4.8.1 Filter by payee
- **Setup**: Income +1000 with category1 and payee="Acme Corp". Income +500 with category1 and payee="Other". Query with payee=Acme.
- **Expected**: `{category1Id: 1000}`.
- **Validates**: Payee LIKE filter.

---

## 5. Multi-Endpoint Cross-Checks

These tests query multiple endpoints with the same underlying data and verify
consistency between them.

### MC-5.1 dailyBalances balance delta matches incomeAndExpense profit sum
- **Setup**: Diverse transactions over 3+ months with various types, earmarks, and transfers.
- **Action**: Query dailyBalances (full history). Query incomeAndExpense with same after date and a monthEnd that cleanly partitions the daily data.
- **Expected**: For each month in incomeAndExpense, the sum of daily profit changes within that month's date range equals the month's `profit` value.
- **Validates**: Invariant 6.

### MC-5.2 Sum of per-account balances equals dailyBalances aggregate
- **Setup**: Multiple bank and investment accounts with transactions of all types.
- **Action**: For each date in dailyBalances output, query `/api/account/{id}/balances` for every account and sum balances.
- **Expected**: Sum of all individual account balances == `balance + investments` from dailyBalances.
- **Validates**: Invariant 1.

### MC-5.3 Date-range consistency across dailyBalances queries
- **Setup**: Transactions spanning a wide date range.
- **Action**: Query dailyBalances with no after date. Then query with several different after dates.
- **Expected**: For every date appearing in both the full query and a filtered query, all fields (balance, earmarked, availableFunds, investments) match exactly.
- **Validates**: Invariant 5.

### MC-5.4 Category balances sum matches total balance (income+expense only)
- **Setup**: All income and expense transactions have categories assigned (no null category_id). No transfers.
- **Action**: Query categoryBalances with no filters. Sum all category balances. Query dailyBalances and take the final balance.
- **Expected**: Sum of category balances == final dailyBalances balance.
- **Validates**: Cross-endpoint total consistency.

### MC-5.5 expenseBreakdown monthly totals match incomeAndExpense expense
- **Setup**: All expense transactions have categories. Various months.
- **Action**: Sum totalExpenses across all categories for a given month in expenseBreakdown. Compare to the `expense` field for that month in incomeAndExpense.
- **Expected**: They match (provided all expenses have categories and monthEnd values are the same).
- **Validates**: Cross-endpoint consistency between expenseBreakdown and incomeAndExpense.

---

## 6. Known Bug Reproduction Tests

These tests are specifically designed to trigger the bug risks identified in
`analysis-invariants.md`.

### BUG-6.1 Falsy-zero investmentValue gap-fill
- **Setup**: Bank income +1000 on Jan 5. Investment_value: Jan 10 = 5000, Jan 15 = 0 (delta = -5000, cumulative investmentValue = 0). Jan 20 = 0 (delta = 0, cumulative stays 0). No transactions on Jan 10, 15, or 20.
- **Expected (correct)**: Jan 15 investmentValue = 0, Jan 20 investmentValue = 0.
- **Expected (buggy)**: Jan 15 gets investmentValue = 0 from its own delta computation. But gap-fill checks `!entry.investmentValue` which is true for 0. It overwrites with `balancesList[i-1].investmentValue || balancesList[i-1].investments || 0`. Previous entry's investmentValue is 5000, so Jan 15 becomes 5000.
- **Validates**: Falsy-zero bug in gap-fill.

### BUG-6.2 Object key ordering for mixed-source dates
- **Setup**: Transactions on Jan 5 and Jan 25. Investment_value on Jan 15 only.
- **Expected (correct)**: Output order: [Jan 5, Jan 15, Jan 25]. Jan 15 carries forward Jan 5's balance fields.
- **Expected (buggy)**: Balances object populated with transaction dates first: `{Jan 5: {...}, Jan 25: {...}}`. Then investment_value date added: `{Jan 5: {...}, Jan 25: {...}, Jan 15: {...}}`. `Object.values()` yields [Jan 5, Jan 25, Jan 15]. Gap-fill at index 2 (Jan 15) carries forward from index 1 (Jan 25), which is wrong -- it should carry forward from Jan 5.
- **Validates**: Object key ordering bug.

### BUG-6.3 Investment value delta inflation with after date
- **Setup**: Investment_value: Dec 15 = 10000, Jan 15 = 12000. Bank income +500 on Jan 10. Query with after=2024-01-01.
- **Expected (correct)**: investmentValue delta on Jan 15 = 12000 - 10000 = 2000.
- **Expected (buggy)**: getCombinedValues from=2024-01-02. Subquery for Jan 15 looks for prior values with `date >= 2024-01-02` -- finds none. Delta = 12000 - 0 = 12000.
- **Validates**: Investment value initialization bug with after date.

### BUG-6.4 Gap-fill with zero balance
- **Setup**: No transactions at all. Investment_value on Jan 10 = 5000.
- **Expected**: One entry with balance=0, earmarked=0, availableFunds=0, investments=0, investmentValue=5000, netWorth=5000.
- **Validates**: The `else if (!entry.balance)` path for i==0 when no transaction data exists for a date.

---

## 7. Coverage Gap Summary

The existing tests (in `analysis.spec.js` and `analysisDao.spec.js`) cover:
- Basic income/expense/transfer flow
- Bank-to-bank, bank-to-investment, investment-to-investment, investment-to-bank transfers
- Earmarked income and expense
- Custom month-end grouping
- After-date filtering for dailyBalances
- Category balances with and without account filter
- Expense breakdown by category

**Not currently covered (high priority):**
1. Investment_value entries and gap-fill logic (DB-1.6.*)
2. Falsy-zero investmentValue bug (BUG-6.1)
3. Object key ordering bug with interleaved dates (BUG-6.2)
4. Investment value delta inflation with after date (BUG-6.3)
5. Null account_id transactions (DB-1.3.3, DB-1.3.4)
6. Cross-endpoint invariant checks (MC-5.*)
7. Date-range consistency invariant (DB-1.5.5, MC-5.3)
8. categoryBalances with earmark, payee, transactionType, date-range filters (CB-4.*)
9. expenseBreakdown with null categories (EB-3.1.4)
10. Scheduled transaction exclusion in analysis queries
