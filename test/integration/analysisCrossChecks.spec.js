import Dsl from './dsl/index.js';

describe('Analysis Cross-Checks and Bug Reproduction', function () {
  let dsl;

  beforeEach(async function () {
    dsl = await Dsl.create();
    dsl.login();
  });

  afterEach(function () {
    return dsl.tearDown();
  });

  describe('5. Multi-Endpoint Cross-Checks', function () {
    it('should have per-account balance sum equal balance + investments (MC-5.2)', async function () {
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
      await dsl.accounts.createAccount({
        alias: 'invest1',
        date: '2024-01-01',
        balance: 0,
        type: 'investment',
      });

      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-10',
        type: 'income',
        amount: 10000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank2',
        date: '2024-01-12',
        type: 'income',
        amount: 5000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-15',
        type: 'transfer',
        toAccount: 'bank2',
        amount: 2000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-20',
        type: 'transfer',
        toAccount: 'invest1',
        amount: -3000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank2',
        date: '2024-01-25',
        type: 'expense',
        amount: -1000,
      });
      await dsl.transactions.createTransaction({
        account: 'invest1',
        date: '2024-02-01',
        type: 'transfer',
        toAccount: 'bank1',
        amount: -1000,
      });

      await dsl.analysis.verifyAccountBalancesMatchAggregate({
        accounts: ['bank1', 'bank2', 'invest1'],
      });
    });

    it('should have consistent balances across date range queries (MC-5.3)', async function () {
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
        amount: 1000,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'income',
        amount: 2000,
        earmark: 'earmark1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-03-10',
        type: 'expense',
        amount: -500,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-04-10',
        type: 'income',
        amount: 3000,
      });

      await dsl.analysis.verifyDateRangeConsistency({
        afterDates: ['2024-01-01', '2024-01-15', '2024-02-15'],
      });
    });

    it('should have category balances sum match total balance (MC-5.4)', async function () {
      await dsl.accounts.createAccount({
        alias: 'account1',
        date: '2023-01-01',
        balance: 0,
      });
      await dsl.categories.createCategory({ alias: 'cat1', name: 'Food' });
      await dsl.categories.createCategory({
        alias: 'cat2',
        name: 'Transport',
      });

      // All transactions have categories - no transfers
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-10',
        type: 'income',
        amount: 5000,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'expense',
        amount: -1200,
        category: 'cat2',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-10',
        type: 'income',
        amount: 3000,
        category: 'cat1',
      });

      // Category balances should sum to the final daily balance
      await dsl.analysis.verifyCategoryBalances({
        expected: [
          { category: 'cat1', balance: 8000 },
          { category: 'cat2', balance: -1200 },
        ],
      });
      await dsl.analysis.verifyDailyBalancesEntry({
        date: '2024-02-10',
        expected: { balance: 8000 + -1200 },
      });
    });

    it('should have expenseBreakdown totals match incomeAndExpense expense (MC-5.5)', async function () {
      await dsl.accounts.createAccount({
        alias: 'account1',
        date: '2023-01-01',
        balance: 0,
      });
      await dsl.categories.createCategory({ alias: 'cat1', name: 'Food' });
      await dsl.categories.createCategory({
        alias: 'cat2',
        name: 'Transport',
      });

      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-10',
        type: 'expense',
        amount: -500,
        category: 'cat1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'expense',
        amount: -300,
        category: 'cat2',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-20',
        type: 'income',
        amount: 2000,
        category: 'cat1',
      });

      // Expense breakdown should sum to -800 for January
      await dsl.analysis.verifyExpenseBreakdown({
        monthEnd: 31,
        expected: [
          { category: 'cat1', month: 202401, totalExpenses: -500 },
          { category: 'cat2', month: 202401, totalExpenses: -300 },
        ],
      });

      // Income and expense should show expense = -800
      await dsl.analysis.verifyIncomeAndExpense({
        monthEnd: 31,
        expected: [
          {
            start: '2024-01-10',
            end: '2024-01-20',
            month: 202401,
            income: 2000,
            expense: -800,
            profit: 1200,
            earmarkedIncome: 0,
            earmarkedExpense: 0,
            earmarkedProfit: 0,
          },
        ],
      });
    });
  });

  describe('6. Known Bug Reproduction Tests', function () {
    // https://github.com/ajsutton/moolah-server/issues/19
    it.skip('should handle falsy-zero investmentValue in gap-fill (BUG-6.1)', async function () {
      await dsl.accounts.createAccount({
        alias: 'bank1',
        date: '2024-01-05',
        balance: 0,
      });
      await dsl.accounts.createAccount({
        alias: 'invest1',
        date: '2024-01-05',
        balance: 0,
        type: 'investment',
      });

      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-05',
        type: 'income',
        amount: 1000,
      });
      // Investment value: 5000 on Jan 10, then drops to 0 on Jan 15
      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2024-01-10',
        value: 5000,
      });
      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2024-01-15',
        value: 0,
      });

      // investmentValue should be 0 on Jan 15, not carried forward from 5000
      await dsl.analysis.verifyDailyBalancesEntry({
        date: '2024-01-15',
        expected: { investmentValue: 0, netWorth: 1000 },
      });
    });

    // https://github.com/ajsutton/moolah-server/issues/18
    it.skip('should maintain chronological order with mixed-source dates (BUG-6.2)', async function () {
      await dsl.accounts.createAccount({
        alias: 'bank1',
        date: '2024-01-05',
        balance: 0,
      });
      await dsl.accounts.createAccount({
        alias: 'invest1',
        date: '2024-01-05',
        balance: 0,
        type: 'investment',
      });

      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-05',
        type: 'income',
        amount: 1000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-25',
        type: 'income',
        amount: 2000,
      });
      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2024-01-15',
        value: 5000,
      });

      // Entries must be in chronological order with correct carry-forward
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-05',
            balance: 1000,
            earmarked: 0,
            investments: 0,
            investmentValue: 0,
          },
          {
            date: '2024-01-15',
            balance: 1000,
            earmarked: 0,
            investments: 0,
            investmentValue: 5000,
          },
          {
            date: '2024-01-25',
            balance: 3000,
            earmarked: 0,
            investments: 0,
            investmentValue: 5000,
          },
        ],
      });
    });

    // https://github.com/ajsutton/moolah-server/issues/20
    it.skip('should handle investment value delta with after date (BUG-6.3)', async function () {
      await dsl.accounts.createAccount({
        alias: 'bank1',
        date: '2024-01-10',
        balance: 0,
      });
      await dsl.accounts.createAccount({
        alias: 'invest1',
        date: '2023-12-15',
        balance: 0,
        type: 'investment',
      });

      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-10',
        type: 'income',
        amount: 500,
      });

      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2023-12-15',
        value: 10000,
      });
      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2024-01-15',
        value: 12000,
      });

      // investmentValue should be consistent regardless of after date.
      // Delta for Jan 15 = 12000 - 10000 = 2000 in both cases.
      await dsl.analysis.verifyDateRangeConsistency({
        afterDates: ['2024-01-01'],
      });
    });

    it('should handle gap-fill with zero balance and investment_value only (BUG-6.4)', async function () {
      await dsl.accounts.createAccount({
        alias: 'invest1',
        date: '2024-01-10',
        balance: 0,
        type: 'investment',
      });

      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2024-01-10',
        value: 5000,
      });

      await dsl.analysis.verifyDailyBalancesEntry({
        date: '2024-01-10',
        expected: { balance: 0, investmentValue: 5000, netWorth: 5000 },
      });
    });
  });
});
