import Dsl from './dsl/index.js';

describe('Expense Breakdown', function () {
  let dsl;

  beforeEach(async function () {
    dsl = await Dsl.create();
    dsl.login();
    await dsl.accounts.createAccount({
      alias: 'account1',
      date: '2024-01-01',
      balance: 0,
    });
  });

  afterEach(function () {
    return dsl.tearDown();
  });

  describe('3.1 Basic Scenarios', function () {
    beforeEach(async function () {
      await dsl.categories.createCategory({
        alias: 'cat1',
        name: 'Food',
      });
      await dsl.categories.createCategory({
        alias: 'cat2',
        name: 'Transport',
      });
      await dsl.categories.createCategory({
        alias: 'cat3',
        name: 'Entertainment',
      });
    });

    it('should report single category single expense (EB-3.1.1)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'expense',
        amount: -500,
        category: 'cat1',
      });
      await dsl.analysis.verifyExpenseBreakdown({
        monthEnd: 31,
        expected: [
          { category: 'cat1', month: 202402, totalExpenses: -500 },
        ],
      });
    });

    it('should report multiple categories (EB-3.1.2)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'expense',
        amount: -500,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'expense',
        amount: -300,
        category: 'cat2',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'expense',
        amount: -200,
        category: 'cat3',
      });
      await dsl.analysis.verifyExpenseBreakdown({
        monthEnd: 31,
        expected: [
          { category: 'cat1', month: 202402, totalExpenses: -500 },
          { category: 'cat2', month: 202402, totalExpenses: -300 },
          { category: 'cat3', month: 202402, totalExpenses: -200 },
        ],
      });
    });

    it('should aggregate multiple expenses in same category and month (EB-3.1.3)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-05',
        type: 'expense',
        amount: -100,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'expense',
        amount: -200,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-15',
        type: 'expense',
        amount: -300,
        category: 'cat1',
      });
      await dsl.analysis.verifyExpenseBreakdown({
        monthEnd: 31,
        expected: [
          { category: 'cat1', month: 202402, totalExpenses: -600 },
        ],
      });
    });

    it('should exclude expenses without categories (EB-3.1.4)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'expense',
        amount: -500,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'expense',
        amount: -300,
        category: 'cat1',
      });
      await dsl.analysis.verifyExpenseBreakdown({
        monthEnd: 31,
        expected: [
          { category: 'cat1', month: 202402, totalExpenses: -300 },
        ],
      });
    });

    it('should exclude income transactions (EB-3.1.5)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'income',
        amount: 1000,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'expense',
        amount: -500,
        category: 'cat2',
      });
      await dsl.analysis.verifyExpenseBreakdown({
        monthEnd: 31,
        expected: [
          { category: 'cat2', month: 202402, totalExpenses: -500 },
        ],
      });
    });

    it('should exclude transfer transactions (EB-3.1.6)', async function () {
      await dsl.accounts.createAccount({
        alias: 'account2',
        date: '2023-01-01',
        balance: 0,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'transfer',
        toAccount: 'account2',
        amount: 1000,
        category: 'cat1',
      });
      await dsl.analysis.verifyExpenseBreakdown({
        monthEnd: 31,
        expected: [],
      });
    });

    it('should exclude openingBalance transactions (EB-3.1.7)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'openingBalance',
        amount: 5000,
        category: 'cat1',
      });
      await dsl.analysis.verifyExpenseBreakdown({
        monthEnd: 31,
        expected: [],
      });
    });
  });

  describe('3.2 Month-End Day Grouping', function () {
    beforeEach(async function () {
      await dsl.categories.createCategory({
        alias: 'cat1',
        name: 'Food',
      });
    });

    it('should group by default month end day 31 (EB-3.2.1)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'expense',
        amount: -100,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'expense',
        amount: -200,
        category: 'cat1',
      });
      await dsl.analysis.verifyExpenseBreakdown({
        monthEnd: 31,
        expected: [
          { category: 'cat1', month: 202401, totalExpenses: -100 },
          { category: 'cat1', month: 202402, totalExpenses: -200 },
        ],
      });
    });

    it('should group by custom month end day 15 (EB-3.2.2)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-20',
        type: 'expense',
        amount: -100,
        category: 'cat1',
      });
      // Day 20 > 15, so grouped as 202402
      await dsl.analysis.verifyExpenseBreakdown({
        monthEnd: 15,
        expected: [
          { category: 'cat1', month: 202402, totalExpenses: -100 },
        ],
      });
    });

    it('should treat exact boundary day as current month (EB-3.2.3)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'expense',
        amount: -100,
        category: 'cat1',
      });
      // Day 15 is NOT > 15, so month = 202401
      await dsl.analysis.verifyExpenseBreakdown({
        monthEnd: 15,
        expected: [
          { category: 'cat1', month: 202401, totalExpenses: -100 },
        ],
      });
    });

    it('should group cross-boundary expenses together (EB-3.2.4)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-20',
        type: 'expense',
        amount: -100,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'expense',
        amount: -200,
        category: 'cat1',
      });
      // Jan 20 day > 15 => 202402, Feb 10 day <= 15 => 202402
      await dsl.analysis.verifyExpenseBreakdown({
        monthEnd: 15,
        expected: [
          { category: 'cat1', month: 202402, totalExpenses: -300 },
        ],
      });
    });
  });

  describe('3.3 Date Ranges', function () {
    beforeEach(async function () {
      await dsl.categories.createCategory({
        alias: 'cat1',
        name: 'Food',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'expense',
        amount: -100,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-15',
        type: 'expense',
        amount: -200,
        category: 'cat1',
      });
    });

    it('should filter with after date (EB-3.3.1)', async function () {
      await dsl.analysis.verifyExpenseBreakdown({
        after: '2024-01-31',
        monthEnd: 31,
        expected: [
          { category: 'cat1', month: 202402, totalExpenses: -200 },
        ],
      });
    });

    it('should return all without after date (EB-3.3.2)', async function () {
      await dsl.analysis.verifyExpenseBreakdown({
        monthEnd: 31,
        expected: [
          { category: 'cat1', month: 202401, totalExpenses: -100 },
          { category: 'cat1', month: 202402, totalExpenses: -200 },
        ],
      });
    });

    it('should use strict greater-than for after date (EB-3.3.3)', async function () {
      await dsl.analysis.verifyExpenseBreakdown({
        after: '2024-01-15',
        monthEnd: 31,
        expected: [
          { category: 'cat1', month: 202402, totalExpenses: -200 },
        ],
      });
    });
  });

  describe('3.4 Ordering', function () {
    it('should order by categoryId then month (EB-3.4.1)', async function () {
      await dsl.categories.createCategory({
        alias: 'cat1',
        name: 'Food',
      });
      await dsl.categories.createCategory({
        alias: 'cat2',
        name: 'Transport',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-10',
        type: 'expense',
        amount: -100,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'expense',
        amount: -200,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-10',
        type: 'expense',
        amount: -300,
        category: 'cat2',
      });

      await dsl.analysis.verifyExpenseBreakdown({
        monthEnd: 31,
        expected: [
          { category: 'cat1', month: 202401, totalExpenses: -100 },
          { category: 'cat1', month: 202402, totalExpenses: -200 },
          { category: 'cat2', month: 202401, totalExpenses: -300 },
        ],
      });
    });
  });
});
