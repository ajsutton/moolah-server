import Dsl from './dsl/index.js';

describe('Income and Expense', function () {
  let dsl;

  beforeEach(async function () {
    dsl = await Dsl.create();
    dsl.login();
  });

  afterEach(function () {
    return dsl.tearDown();
  });

  describe('2.1 Basic Transaction Types', function () {
    beforeEach(async function () {
      await dsl.accounts.createAccount({
        alias: 'account1',
        date: '2023-01-01',
        balance: 0,
      });
    });

    it('should report income only (IE-2.1.1)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'income',
        amount: 1000,
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-02-10',
            end: '2024-02-10',
            month: 202402,
            income: 1000,
            expense: 0,
            profit: 1000,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
        ],
      });
    });

    it('should report expense only (IE-2.1.2)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'expense',
        amount: -500,
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-02-10',
            end: '2024-02-10',
            month: 202402,
            income: 0,
            expense: -500,
            profit: -500,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
        ],
      });
    });

    it('should report negative income as income (IE-2.1.3)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-15',
        type: 'income',
        amount: -200,
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-02-15',
            end: '2024-02-15',
            month: 202402,
            income: -200,
            expense: 0,
            profit: -200,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
        ],
      });
    });

    it('should exclude openingBalance from income/expense (IE-2.1.4)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-01',
        type: 'openingBalance',
        amount: 5000,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 100,
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-01-15',
            end: '2024-01-15',
            month: 202401,
            income: 100,
            expense: 0,
            profit: 100,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
        ],
      });
    });

    it('should handle null account_id transactions (IE-2.1.5)', async function () {
      await dsl.earmarks.createEarmark({ alias: 'earmark1' });
      await dsl.transactions.createTransaction({
        date: '2024-02-10',
        type: 'income',
        amount: 2000,
        earmark: 'earmark1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'income',
        amount: 1000,
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-02-10',
            end: '2024-02-10',
            month: 202402,
            income: 1000,
            expense: 0,
            profit: 1000,
            earmarkedIncome: 2000,
            earmarkedExpense: 0,
            earmarkedProfit: 2000,
          },
        ],
      });
    });
  });

  describe('2.2 Transfer Types', function () {
    it('should exclude bank-to-bank transfer (IE-2.2.1)', async function () {
      await dsl.accounts.createAccount({
        alias: 'bank1',
        date: '2023-01-01',
        balance: 0,
      });
      await dsl.accounts.createAccount({
        alias: 'bank2',
        date: '2023-01-01',
        balance: 0,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-02-10',
        type: 'transfer',
        toAccount: 'bank2',
        amount: 1000,
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [],
      });
    });

    it('should handle bank-to-investment transfer (IE-2.2.2)', async function () {
      await dsl.accounts.createAccount({
        alias: 'bank1',
        date: '2023-01-01',
        balance: 0,
      });
      await dsl.accounts.createAccount({
        alias: 'invest1',
        date: '2024-02-10',
        balance: 0,
        type: 'investment',
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-02-10',
        type: 'transfer',
        toAccount: 'invest1',
        amount: -5000,
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-02-10',
            end: '2024-02-10',
            month: 202402,
            income: 0,
            expense: 0,
            profit: 0,
            earmarkedIncome: 0,
            earmarkedExpense: 5000,
            earmarkedProfit: 5000,
          },
        ],
      });
    });

    it('should handle investment-to-bank transfer (IE-2.2.3)', async function () {
      await dsl.accounts.createAccount({
        alias: 'bank1',
        date: '2023-01-01',
        balance: 0,
      });
      await dsl.accounts.createAccount({
        alias: 'invest1',
        date: '2024-02-10',
        balance: 0,
        type: 'investment',
      });
      await dsl.transactions.createTransaction({
        account: 'invest1',
        date: '2024-02-10',
        type: 'transfer',
        toAccount: 'bank1',
        amount: -2000,
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-02-10',
            end: '2024-02-10',
            month: 202402,
            income: 0,
            expense: 0,
            profit: 0,
            earmarkedIncome: -2000,
            earmarkedExpense: 0,
            earmarkedProfit: -2000,
          },
        ],
      });
    });

    it('should handle investment-to-investment transfer (IE-2.2.4)', async function () {
      await dsl.accounts.createAccount({
        alias: 'invest1',
        date: '2024-02-10',
        balance: 0,
        type: 'investment',
      });
      await dsl.accounts.createAccount({
        alias: 'invest2',
        date: '2024-02-10',
        balance: 0,
        type: 'investment',
      });
      await dsl.transactions.createTransaction({
        account: 'invest1',
        date: '2024-02-10',
        type: 'transfer',
        toAccount: 'invest2',
        amount: -3000,
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-02-10',
            end: '2024-02-10',
            month: 202402,
            income: 0,
            expense: 0,
            profit: 0,
            earmarkedIncome: -3000,
            earmarkedExpense: 3000,
            earmarkedProfit: 0,
          },
        ],
      });
    });
  });

  describe('2.3 Month-End Day Grouping', function () {
    beforeEach(async function () {
      await dsl.accounts.createAccount({
        alias: 'account1',
        date: '2023-01-01',
        balance: 0,
      });
    });

    it('should group by default month end day 31 (IE-2.3.1)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'income',
        amount: 500,
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-01-15',
            end: '2024-01-15',
            month: 202401,
            income: 1000,
            expense: 0,
            profit: 1000,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
          {
            start: '2024-02-10',
            end: '2024-02-10',
            month: 202402,
            income: 500,
            expense: 0,
            profit: 500,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
        ],
      });
    });

    it('should group by custom month end day 15 (IE-2.3.2)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-10',
        type: 'income',
        amount: 100,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-20',
        type: 'income',
        amount: 200,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'income',
        amount: 300,
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 15,
        expected: [
          {
            start: '2024-01-10',
            end: '2024-01-10',
            month: 202401,
            income: 100,
            expense: 0,
            profit: 100,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
          {
            start: '2024-01-20',
            end: '2024-02-10',
            month: 202402,
            income: 500,
            expense: 0,
            profit: 500,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
        ],
      });
    });

    it('should treat exact month-end day as current month (IE-2.3.3)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
      });
      // With monthEnd=15, day 15 is NOT > 15, so month = 202401
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 15,
        expected: [
          {
            start: '2024-01-15',
            end: '2024-01-15',
            month: 202401,
            income: 1000,
            expense: 0,
            profit: 1000,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
        ],
      });
      // With monthEnd=14, day 15 > 14, so month = 202402
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 14,
        expected: [
          {
            start: '2024-01-15',
            end: '2024-01-15',
            month: 202402,
            income: 1000,
            expense: 0,
            profit: 1000,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
        ],
      });
    });

    it('should skip months with no transactions (IE-2.3.4)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-03-15',
        type: 'income',
        amount: 500,
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-01-15',
            end: '2024-01-15',
            month: 202401,
            income: 1000,
            expense: 0,
            profit: 1000,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
          {
            start: '2024-03-15',
            end: '2024-03-15',
            month: 202403,
            income: 500,
            expense: 0,
            profit: 500,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
        ],
      });
    });

    it('should handle short month with monthEnd=30 (IE-2.3.5)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-28',
        type: 'income',
        amount: 1000,
      });
      // Feb 28, day 28 <= 30, so month = 202402
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 30,
        expected: [
          {
            start: '2024-02-28',
            end: '2024-02-28',
            month: 202402,
            income: 1000,
            expense: 0,
            profit: 1000,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
        ],
      });
    });
  });

  describe('2.4 Earmarked Calculations', function () {
    beforeEach(async function () {
      await dsl.accounts.createAccount({
        alias: 'account1',
        date: '2023-01-01',
        balance: 0,
      });
      await dsl.earmarks.createEarmark({ alias: 'earmark1' });
      await dsl.earmarks.createEarmark({ alias: 'earmark2' });
    });

    it('should report earmarked income (IE-2.4.1)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'income',
        amount: 1000,
        earmark: 'earmark1',
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-02-10',
            end: '2024-02-10',
            month: 202402,
            income: 1000,
            expense: 0,
            profit: 1000,
            earmarkedIncome: 1000,
            earmarkedExpense: 0,
            earmarkedProfit: 1000,
          },
        ],
      });
    });

    it('should report earmarked expense (IE-2.4.2)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'expense',
        amount: -500,
        earmark: 'earmark1',
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-02-10',
            end: '2024-02-10',
            month: 202402,
            income: 0,
            expense: -500,
            profit: -500,
            earmarkedIncome: 0,
            earmarkedExpense: -500,
            earmarkedProfit: -500,
          },
        ],
      });
    });

    it('should separate earmarked and non-earmarked (IE-2.4.3)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'income',
        amount: 1000,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'income',
        amount: 500,
        earmark: 'earmark1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'expense',
        amount: -200,
        earmark: 'earmark1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'expense',
        amount: -300,
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-02-10',
            end: '2024-02-10',
            month: 202402,
            income: 1500,
            expense: -500,
            profit: 1000,
            earmarkedIncome: 500,
            earmarkedExpense: -200,
            earmarkedProfit: 300,
          },
        ],
      });
    });

    it('should aggregate all earmarks together (IE-2.4.4)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'income',
        amount: 1000,
        earmark: 'earmark1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'income',
        amount: 500,
        earmark: 'earmark2',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'expense',
        amount: -200,
        earmark: 'earmark1',
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-02-10',
            end: '2024-02-10',
            month: 202402,
            income: 1500,
            expense: -200,
            profit: 1300,
            earmarkedIncome: 1500,
            earmarkedExpense: -200,
            earmarkedProfit: 1300,
          },
        ],
      });
    });
  });

  describe('2.5 Date Ranges', function () {
    beforeEach(async function () {
      await dsl.accounts.createAccount({
        alias: 'account1',
        date: '2023-12-01',
        balance: 0,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-15',
        type: 'income',
        amount: 2000,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-03-15',
        type: 'income',
        amount: 3000,
      });
    });

    it('should filter with after date (IE-2.5.1)', async function () {
      await dsl.analysis.verifyIncomeAndExpense({
        after: '2024-01-31',
        monthEnd: 31,
        expected: [
          {
            start: '2024-02-15',
            end: '2024-02-15',
            month: 202402,
            income: 2000,
            expense: 0,
            profit: 2000,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
          {
            start: '2024-03-15',
            end: '2024-03-15',
            month: 202403,
            income: 3000,
            expense: 0,
            profit: 3000,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
        ],
      });
    });

    it('should return full history without after date (IE-2.5.2)', async function () {
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-01-15',
            end: '2024-01-15',
            month: 202401,
            income: 1000,
            expense: 0,
            profit: 1000,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
          {
            start: '2024-02-15',
            end: '2024-02-15',
            month: 202402,
            income: 2000,
            expense: 0,
            profit: 2000,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
          {
            start: '2024-03-15',
            end: '2024-03-15',
            month: 202403,
            income: 3000,
            expense: 0,
            profit: 3000,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
        ],
      });
    });

    it('should use strict greater-than for after date (IE-2.5.3)', async function () {
      await dsl.analysis.verifyIncomeAndExpense({
        after: '2024-01-15',
        monthEnd: 31,
        expected: [
          {
            start: '2024-02-15',
            end: '2024-02-15',
            month: 202402,
            income: 2000,
            expense: 0,
            profit: 2000,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
          {
            start: '2024-03-15',
            end: '2024-03-15',
            month: 202403,
            income: 3000,
            expense: 0,
            profit: 3000,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
        ],
      });
    });
  });

  describe('2.6 Cross-Check Invariants', function () {
    it('should have profit == income + expense (IE-2.6.2)', async function () {
      await dsl.accounts.createAccount({
        alias: 'account1',
        date: '2023-01-01',
        balance: 0,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-10',
        type: 'income',
        amount: 5000,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'expense',
        amount: -1200,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-20',
        type: 'income',
        amount: 300,
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-01-10',
            end: '2024-01-20',
            month: 202401,
            income: 5300,
            expense: -1200,
            profit: 4100,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
        ],
      });
    });

    it('should have earmarkedProfit == earmarkedIncome + earmarkedExpense (IE-2.6.3)', async function () {
      await dsl.accounts.createAccount({
        alias: 'account1',
        date: '2023-01-01',
        balance: 0,
      });
      await dsl.earmarks.createEarmark({ alias: 'earmark1' });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-10',
        type: 'income',
        amount: 2000,
        earmark: 'earmark1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'expense',
        amount: -800,
        earmark: 'earmark1',
      });
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-01-10',
            end: '2024-01-15',
            month: 202401,
            income: 2000,
            expense: -800,
            profit: 1200,
            earmarkedIncome: 2000,
            earmarkedExpense: -800,
            earmarkedProfit: 1200,
          },
        ],
      });
    });
  });
});
