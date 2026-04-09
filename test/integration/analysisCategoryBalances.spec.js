import Dsl from './dsl/index.js';

describe('Category Balances', function () {
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

  describe('4.1 Basic Scenarios', function () {
    beforeEach(async function () {
      await dsl.categories.createCategory({ alias: 'cat1', name: 'Food' });
      await dsl.categories.createCategory({
        alias: 'cat2',
        name: 'Transport',
      });
      await dsl.categories.createCategory({
        alias: 'cat3',
        name: 'Entertainment',
      });
    });

    it('should report single category single transaction (CB-4.1.1)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
        category: 'cat1',
      });
      await dsl.analysis.verifyCategoryBalances({
        expected: [{ category: 'cat1', balance: 1000 }],
      });
    });

    it('should report multiple categories (CB-4.1.2)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 500,
        category: 'cat2',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'expense',
        amount: -200,
        category: 'cat3',
      });
      await dsl.analysis.verifyCategoryBalances({
        expected: [
          { category: 'cat1', balance: 1000 },
          { category: 'cat2', balance: 500 },
          { category: 'cat3', balance: -200 },
        ],
      });
    });

    it('should sum multiple transactions in same category (CB-4.1.3)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-10',
        type: 'income',
        amount: 1000,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 500,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-20',
        type: 'expense',
        amount: -200,
        category: 'cat1',
      });
      await dsl.analysis.verifyCategoryBalances({
        expected: [{ category: 'cat1', balance: 1300 }],
      });
    });

    it('should exclude transactions with null category (CB-4.1.4)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 500,
        category: 'cat1',
      });
      await dsl.analysis.verifyCategoryBalances({
        expected: [{ category: 'cat1', balance: 500 }],
      });
    });

    it('should exclude transfers when no account filter (CB-4.1.5)', async function () {
      await dsl.accounts.createAccount({
        alias: 'account2',
        date: '2023-01-01',
        balance: 0,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'transfer',
        toAccount: 'account2',
        amount: 1000,
        category: 'cat1',
      });
      await dsl.analysis.verifyCategoryBalances({
        expected: [],
      });
    });

    it('should include transfers when account filter is set (CB-4.1.6)', async function () {
      await dsl.accounts.createAccount({
        alias: 'account2',
        date: '2023-01-01',
        balance: 0,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 5000,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-20',
        type: 'transfer',
        toAccount: 'account2',
        amount: 1000,
        category: 'cat2',
      });
      await dsl.analysis.verifyCategoryBalances({
        account: 'account1',
        expected: [
          { category: 'cat1', balance: 5000 },
          { category: 'cat2', balance: 1000 },
        ],
      });
    });
  });

  describe('4.2 Account Filtering', function () {
    beforeEach(async function () {
      await dsl.accounts.createAccount({
        alias: 'account2',
        date: '2023-01-01',
        balance: 0,
      });
      await dsl.categories.createCategory({ alias: 'cat1', name: 'Food' });
    });

    it('should filter by specific bank account (CB-4.2.1)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account2',
        date: '2024-01-15',
        type: 'income',
        amount: 700,
        category: 'cat1',
      });
      await dsl.analysis.verifyCategoryBalances({
        account: 'account1',
        expected: [{ category: 'cat1', balance: 1000 }],
      });
      await dsl.analysis.verifyCategoryBalances({
        expected: [{ category: 'cat1', balance: 1700 }],
      });
    });

    it('should return 404 for non-existent account (CB-4.2.2)', async function () {
      await dsl.analysis.verifyCategoryBalances({
        account: '<nonexistent-account-id>',
        statusCode: 404,
        expected: [],
      });
    });

    it('should filter by investment account (CB-4.2.3)', async function () {
      await dsl.accounts.createAccount({
        alias: 'invest1',
        date: '2024-01-01',
        balance: 0,
        type: 'investment',
      });
      await dsl.transactions.createTransaction({
        account: 'invest1',
        date: '2024-01-15',
        type: 'income',
        amount: 3000,
        category: 'cat1',
      });
      await dsl.analysis.verifyCategoryBalances({
        account: 'invest1',
        expected: [{ category: 'cat1', balance: 3000 }],
      });
    });
  });

  describe('4.3 Date Range Filtering', function () {
    beforeEach(async function () {
      await dsl.categories.createCategory({ alias: 'cat1', name: 'Food' });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-15',
        type: 'income',
        amount: 500,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-03-15',
        type: 'income',
        amount: 300,
        category: 'cat1',
      });
    });

    it('should filter by from date (CB-4.3.1)', async function () {
      await dsl.analysis.verifyCategoryBalances({
        from: '2024-02-01',
        expected: [{ category: 'cat1', balance: 800 }],
      });
    });

    it('should filter by to date (CB-4.3.2)', async function () {
      await dsl.analysis.verifyCategoryBalances({
        to: '2024-01-31',
        expected: [{ category: 'cat1', balance: 1000 }],
      });
    });

    it('should filter by both from and to (CB-4.3.3)', async function () {
      await dsl.analysis.verifyCategoryBalances({
        from: '2024-01-20',
        to: '2024-02-28',
        expected: [{ category: 'cat1', balance: 500 }],
      });
    });
  });

  describe('4.4 Category Filtering', function () {
    beforeEach(async function () {
      await dsl.categories.createCategory({ alias: 'cat1', name: 'Food' });
      await dsl.categories.createCategory({
        alias: 'cat2',
        name: 'Transport',
      });
      await dsl.categories.createCategory({
        alias: 'cat3',
        name: 'Entertainment',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 500,
        category: 'cat2',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 300,
        category: 'cat3',
      });
    });

    it('should filter by specific categories (CB-4.4.1)', async function () {
      await dsl.analysis.verifyCategoryBalances({
        categories: ['cat1', 'cat2'],
        expected: [
          { category: 'cat1', balance: 1000 },
          { category: 'cat2', balance: 500 },
        ],
      });
    });

    it('should return 404 for non-existent category (CB-4.4.2)', async function () {
      await dsl.analysis.verifyCategoryBalances({
        categories: ['<nonexistent-category-id>'],
        statusCode: 404,
        expected: [],
      });
    });
  });

  describe('4.5 Earmark Filtering', function () {
    it('should filter by earmark (CB-4.5.1)', async function () {
      await dsl.categories.createCategory({ alias: 'cat1', name: 'Food' });
      await dsl.earmarks.createEarmark({ alias: 'earmark1' });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
        category: 'cat1',
        earmark: 'earmark1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 500,
        category: 'cat1',
      });
      await dsl.analysis.verifyCategoryBalances({
        earmark: 'earmark1',
        expected: [{ category: 'cat1', balance: 1000 }],
      });
    });
  });

  describe('4.6 Transaction Type Filtering', function () {
    it('should filter by transaction type (CB-4.6.1)', async function () {
      await dsl.categories.createCategory({ alias: 'cat1', name: 'Food' });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'expense',
        amount: -500,
        category: 'cat1',
      });
      await dsl.analysis.verifyCategoryBalances({
        transactionType: 'expense',
        expected: [{ category: 'cat1', balance: -500 }],
      });
    });
  });

  describe('4.7 Scheduled Transaction Handling', function () {
    beforeEach(async function () {
      await dsl.categories.createCategory({ alias: 'cat1', name: 'Food' });
    });

    it('should exclude scheduled transactions by default (CB-4.7.1)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 500,
        category: 'cat1',
        recurPeriod: 'MONTH',
        recurEvery: 1,
      });
      await dsl.analysis.verifyCategoryBalances({
        expected: [{ category: 'cat1', balance: 1000 }],
      });
    });

    it('should include only scheduled when requested (CB-4.7.2)', async function () {
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 500,
        category: 'cat1',
        recurPeriod: 'MONTH',
        recurEvery: 1,
      });
      await dsl.analysis.verifyCategoryBalances({
        scheduled: true,
        expected: [{ category: 'cat1', balance: 500 }],
      });
    });
  });

  describe('4.8 Payee Filtering', function () {
    it('should filter by payee (CB-4.8.1)', async function () {
      await dsl.categories.createCategory({ alias: 'cat1', name: 'Food' });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
        category: 'cat1',
        payee: 'Acme Corp',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 500,
        category: 'cat1',
        payee: 'Other Inc',
      });
      await dsl.analysis.verifyCategoryBalances({
        payee: 'Acme',
        expected: [{ category: 'cat1', balance: 1000 }],
      });
    });
  });
});
