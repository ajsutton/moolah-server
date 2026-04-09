import { assert } from 'chai';
import Dsl from './dsl/index.js';

describe('Daily Balances', function () {
  let dsl;

  beforeEach(async function () {
    dsl = await Dsl.create();
    dsl.login();
  });

  afterEach(function () {
    return dsl.tearDown();
  });

  // Helper: create a bank account with opening balance on a specific date
  // so the 0-amount opening balance merges with the first transaction entry.
  async function createBank(alias, date) {
    await dsl.accounts.createAccount({
      alias,
      date,
      balance: 0,
    });
  }

  async function createInvestment(alias, date) {
    await dsl.accounts.createAccount({
      alias,
      date,
      balance: 0,
      type: 'investment',
    });
  }

  describe('1.1 Basic Transaction Types', function () {
    it('should handle income only (DB-1.1.1)', async function () {
      await createBank('account1', '2024-01-15');
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-15',
            balance: 1000,
            earmarked: 0,
            investments: 0,
          },
        ],
      });
    });

    it('should handle expense only (DB-1.1.2)', async function () {
      await createBank('account1', '2024-01-15');
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'expense',
        amount: -500,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-15',
            balance: -500,
            earmarked: 0,
            investments: 0,
          },
        ],
      });
    });

    it('should handle income with negative amount (DB-1.1.3)', async function () {
      await createBank('account1', '2024-01-10');
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-10',
        type: 'income',
        amount: 1000,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: -200,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-10',
            balance: 1000,
            earmarked: 0,
            investments: 0,
          },
          {
            date: '2024-01-15',
            balance: 800,
            earmarked: 0,
            investments: 0,
          },
        ],
      });
    });

    it('should handle openingBalance transaction (DB-1.1.4)', async function () {
      await createBank('account1', '2024-01-01');
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-01',
        type: 'openingBalance',
        amount: 5000,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-02',
        type: 'income',
        amount: 100,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-01',
            balance: 5000,
            earmarked: 0,
            investments: 0,
          },
          {
            date: '2024-01-02',
            balance: 5100,
            earmarked: 0,
            investments: 0,
          },
        ],
      });
    });

    it('should handle multiple transaction types on the same day (DB-1.1.5)', async function () {
      await createBank('account1', '2024-01-15');
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 2000,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'expense',
        amount: -300,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'openingBalance',
        amount: 500,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-15',
            balance: 2200,
            earmarked: 0,
            investments: 0,
          },
        ],
      });
    });
  });

  describe('1.2 Transfer Types', function () {
    it('should exclude bank-to-bank transfer from aggregate (DB-1.2.1)', async function () {
      await createBank('bank1', '2024-01-10');
      await createBank('bank2', '2024-01-10');
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-10',
        type: 'income',
        amount: 5000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-02-01',
        type: 'transfer',
        toAccount: 'bank2',
        amount: 1000,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-10',
            balance: 5000,
            earmarked: 0,
            investments: 0,
          },
        ],
      });
    });

    it('should handle bank-to-investment transfer (DB-1.2.2)', async function () {
      await createBank('bank1', '2024-01-10');
      await createInvestment('invest1', '2024-01-10');
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-10',
        type: 'income',
        amount: 10000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-03-01',
        type: 'transfer',
        toAccount: 'invest1',
        amount: -5000,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-10',
            balance: 10000,
            earmarked: 0,
            investments: 0,
          },
          {
            date: '2024-03-01',
            balance: 5000,
            earmarked: 0,
            investments: 5000,
          },
        ],
      });
    });

    it('should handle investment-to-bank transfer (DB-1.2.3)', async function () {
      await createBank('bank1', '2024-01-10');
      await createInvestment('invest1', '2024-01-10');
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-10',
        type: 'income',
        amount: 10000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-03-01',
        type: 'transfer',
        toAccount: 'invest1',
        amount: -5000,
      });
      await dsl.transactions.createTransaction({
        account: 'invest1',
        date: '2024-03-15',
        type: 'transfer',
        toAccount: 'bank1',
        amount: -2000,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-10',
            balance: 10000,
            earmarked: 0,
            investments: 0,
          },
          {
            date: '2024-03-01',
            balance: 5000,
            earmarked: 0,
            investments: 5000,
          },
          {
            date: '2024-03-15',
            balance: 7000,
            earmarked: 0,
            investments: 3000,
          },
        ],
      });
    });

    it('should handle investment-to-investment transfer (DB-1.2.4)', async function () {
      await createBank('bank1', '2024-01-10');
      await createInvestment('invest1', '2024-01-10');
      await createInvestment('invest2', '2024-01-10');
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-10',
        type: 'income',
        amount: 10000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-03-01',
        type: 'transfer',
        toAccount: 'invest1',
        amount: -5000,
      });
      await dsl.transactions.createTransaction({
        account: 'invest1',
        date: '2024-04-01',
        type: 'transfer',
        toAccount: 'invest2',
        amount: -3000,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-10',
            balance: 10000,
            earmarked: 0,
            investments: 0,
          },
          {
            date: '2024-03-01',
            balance: 5000,
            earmarked: 0,
            investments: 5000,
          },
          {
            date: '2024-04-01',
            balance: 5000,
            earmarked: 0,
            investments: 5000,
          },
        ],
      });
    });

    it('should maintain balance + investments across all transfer types (DB-1.2.5)', async function () {
      await createBank('bank1', '2024-01-01');
      await createBank('bank2', '2024-01-01');
      await createInvestment('invest1', '2024-01-01');
      await createInvestment('invest2', '2024-01-01');
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-01',
        type: 'income',
        amount: 10000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-02',
        type: 'transfer',
        toAccount: 'bank2',
        amount: 1000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-03',
        type: 'transfer',
        toAccount: 'invest1',
        amount: -3000,
      });
      await dsl.transactions.createTransaction({
        account: 'invest1',
        date: '2024-01-04',
        type: 'transfer',
        toAccount: 'invest2',
        amount: -1000,
      });
      await dsl.transactions.createTransaction({
        account: 'invest2',
        date: '2024-01-05',
        type: 'transfer',
        toAccount: 'bank1',
        amount: -500,
      });

      await dsl.analysis.verifyTransfersNetZero({ expectedTotal: 10000 });
    });
  });

  describe('1.3 Account Types', function () {
    it('should handle non-investment accounts only (DB-1.3.1)', async function () {
      await createBank('bank1', '2024-01-15');
      await createBank('bank2', '2024-01-15');
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank2',
        date: '2024-01-15',
        type: 'income',
        amount: 500,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-15',
            balance: 1500,
            earmarked: 0,
            investments: 0,
          },
        ],
      });
    });

    it('should handle investment accounts only (DB-1.3.2)', async function () {
      await createInvestment('invest1', '2024-01-15');
      await dsl.transactions.createTransaction({
        account: 'invest1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
      });
      // Income on investment accounts does not appear in either `balance` or
      // `investments` because the SQL's `at.type != "investment"` evaluates to
      // NULL when there is no to_account (income transactions have no to_account).
      // The `investments` column only captures transfer flow between account types.
      await dsl.analysis.verifyDailyBalancesEntry({
        date: '2024-01-15',
        expected: { balance: 0, investments: 0 },
      });
    });

    it('should exclude null account_id from profit (DB-1.3.3)', async function () {
      await createBank('account1', '2024-01-15');
      await dsl.earmarks.createEarmark({ alias: 'earmark1' });
      await dsl.transactions.createTransaction({
        date: '2024-01-15',
        type: 'income',
        amount: 2000,
        earmark: 'earmark1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-15',
            balance: 1000,
            earmarked: 2000,
            investments: 0,
          },
        ],
      });
    });

    it('should include null account_id in earmarked (DB-1.3.4)', async function () {
      await createBank('account1', '2024-01-15');
      await dsl.earmarks.createEarmark({ alias: 'earmark1' });
      await dsl.transactions.createTransaction({
        date: '2024-01-15',
        type: 'income',
        amount: 2000,
        earmark: 'earmark1',
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-15',
            balance: 0,
            earmarked: 2000,
            investments: 0,
          },
        ],
      });
    });
  });

  describe('1.4 Earmarks', function () {
    it('should track earmarked income (DB-1.4.1)', async function () {
      await createBank('account1', '2024-01-15');
      await dsl.earmarks.createEarmark({ alias: 'earmark1' });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
        earmark: 'earmark1',
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-15',
            balance: 1000,
            earmarked: 1000,
            investments: 0,
          },
        ],
      });
    });

    it('should track earmarked expense (DB-1.4.2)', async function () {
      await createBank('account1', '2024-01-15');
      await dsl.earmarks.createEarmark({ alias: 'earmark1' });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
        earmark: 'earmark1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-20',
        type: 'expense',
        amount: -400,
        earmark: 'earmark1',
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-15',
            balance: 1000,
            earmarked: 1000,
            investments: 0,
          },
          {
            date: '2024-01-20',
            balance: 600,
            earmarked: 600,
            investments: 0,
          },
        ],
      });
    });

    it('should handle mix of earmarked and non-earmarked (DB-1.4.3)', async function () {
      await createBank('account1', '2024-01-15');
      await dsl.earmarks.createEarmark({ alias: 'earmark1' });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 5000,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'income',
        amount: 1000,
        earmark: 'earmark1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'expense',
        amount: -200,
        earmark: 'earmark1',
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'expense',
        amount: -300,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-15',
            balance: 5500,
            earmarked: 800,
            investments: 0,
          },
        ],
      });
    });

    it('should include earmarked transfers in earmarked total (DB-1.4.4)', async function () {
      await createBank('account1', '2024-01-10');
      await createInvestment('invest1', '2024-01-10');
      await dsl.earmarks.createEarmark({ alias: 'earmark1' });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-10',
        type: 'income',
        amount: 5000,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-15',
        type: 'transfer',
        toAccount: 'invest1',
        amount: -1000,
        earmark: 'earmark1',
      });
      await dsl.analysis.verifyDailyBalancesEntry({
        date: '2024-01-15',
        expected: { earmarked: -1000 },
      });
    });
  });

  describe('1.5 Date Ranges', function () {
    beforeEach(async function () {
      await createBank('account1', '2024-01-01');
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-01-01',
        type: 'income',
        amount: 1000,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-02-01',
        type: 'income',
        amount: 2000,
      });
      await dsl.transactions.createTransaction({
        account: 'account1',
        date: '2024-03-01',
        type: 'income',
        amount: 3000,
      });
    });

    it('should return full history with no after date (DB-1.5.1)', async function () {
      await dsl.analysis.verifyDailyBalances({
        expected: [
          { date: '2024-01-01', balance: 1000, earmarked: 0, investments: 0 },
          { date: '2024-02-01', balance: 3000, earmarked: 0, investments: 0 },
          { date: '2024-03-01', balance: 6000, earmarked: 0, investments: 0 },
        ],
      });
    });

    it('should filter with after date (DB-1.5.2)', async function () {
      await dsl.analysis.verifyDailyBalances({
        after: '2024-01-15',
        expected: [
          { date: '2024-02-01', balance: 3000, earmarked: 0, investments: 0 },
          { date: '2024-03-01', balance: 6000, earmarked: 0, investments: 0 },
        ],
      });
    });

    it('should handle after date on exact transaction date (DB-1.5.3)', async function () {
      await dsl.analysis.verifyDailyBalances({
        after: '2024-01-01',
        expected: [
          { date: '2024-02-01', balance: 3000, earmarked: 0, investments: 0 },
          { date: '2024-03-01', balance: 6000, earmarked: 0, investments: 0 },
        ],
      });
    });

    it('should return empty for after date past all transactions (DB-1.5.4)', async function () {
      await dsl.analysis.verifyDailyBalances({
        after: '2024-06-01',
        expected: [],
      });
    });

    it('should produce consistent balances across date ranges (DB-1.5.5)', async function () {
      await dsl.analysis.verifyDateRangeConsistency({
        afterDates: ['2024-01-15'],
      });
    });
  });

  describe('1.6 Investment Values', function () {
    it('should fall back to transaction-based investments when no investment_value (DB-1.6.1)', async function () {
      await createBank('bank1', '2024-01-15');
      await createInvestment('invest1', '2024-01-15');
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-15',
        type: 'income',
        amount: 10000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-20',
        type: 'transfer',
        toAccount: 'invest1',
        amount: -3000,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-15',
            balance: 10000,
            earmarked: 0,
            investments: 0,
          },
          {
            date: '2024-01-20',
            balance: 7000,
            earmarked: 0,
            investments: 3000,
          },
        ],
      });
    });

    it('should use investment_value on dates with transactions (DB-1.6.2)', async function () {
      await createBank('bank1', '2024-01-15');
      await createInvestment('invest1', '2024-01-15');
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-15',
        type: 'income',
        amount: 5000,
      });
      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2024-01-15',
        value: 8000,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-15',
            balance: 5000,
            earmarked: 0,
            investments: 0,
            investmentValue: 8000,
          },
        ],
      });
    });

    it('should gap-fill on dates without transactions (DB-1.6.3)', async function () {
      await createBank('bank1', '2024-01-10');
      await createInvestment('invest1', '2024-01-10');
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-10',
        type: 'income',
        amount: 5000,
      });
      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2024-01-20',
        value: 5000,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-10',
            balance: 5000,
            earmarked: 0,
            investments: 0,
            investmentValue: 0,
          },
          {
            date: '2024-01-20',
            balance: 5000,
            earmarked: 0,
            investments: 0,
            investmentValue: 5000,
          },
        ],
      });
    });

    it('should handle investment_value before first transaction (DB-1.6.4)', async function () {
      await createBank('bank1', '2024-01-10');
      await createInvestment('invest1', '2024-01-05');
      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2024-01-05',
        value: 3000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-10',
        type: 'income',
        amount: 5000,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-05',
            balance: 0,
            earmarked: 0,
            investments: 0,
            investmentValue: 3000,
          },
          {
            date: '2024-01-10',
            balance: 5000,
            earmarked: 0,
            investments: 0,
            investmentValue: 3000,
          },
        ],
      });
    });

    it('should maintain chronological order with interleaved investment_value (DB-1.6.5)', async function () {
      await createBank('bank1', '2024-01-10');
      await createInvestment('invest1', '2024-01-10');
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-10',
        type: 'income',
        amount: 1000,
      });
      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2024-01-15',
        value: 5000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-20',
        type: 'income',
        amount: 2000,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-10',
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
            date: '2024-01-20',
            balance: 3000,
            earmarked: 0,
            investments: 0,
            investmentValue: 5000,
          },
        ],
      });
    });

    it('should aggregate multiple investment accounts on same date (DB-1.6.6)', async function () {
      await createBank('bank1', '2024-01-10');
      await createInvestment('invest1', '2024-01-10');
      await createInvestment('invest2', '2024-01-10');
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-10',
        type: 'income',
        amount: 1000,
      });
      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2024-01-15',
        value: 5000,
      });
      await dsl.accounts.setValue({
        account: 'invest2',
        date: '2024-01-15',
        value: 3000,
      });
      await dsl.analysis.verifyDailyBalances({
        expected: [
          {
            date: '2024-01-10',
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
            investmentValue: 8000,
          },
        ],
      });
    });

    it('should handle investment_value with after date (DB-1.6.9)', async function () {
      await createBank('bank1', '2024-01-10');
      await createInvestment('invest1', '2024-01-10');
      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2024-01-10',
        value: 5000,
      });
      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2024-01-20',
        value: 8000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-18',
        type: 'income',
        amount: 500,
      });

      // Full history and filtered should produce consistent investmentValue.
      // Delta for Jan 20 = 8000 - 5000 = 3000 regardless of after date.
      await dsl.analysis.verifyDateRangeConsistency({
        afterDates: ['2024-01-15'],
      });
    });

    it('should handle many interleaved investment_value dates (DB-1.7.5)', async function () {
      await createBank('bank1', '2024-01-05');
      await createInvestment('invest1', '2024-01-05');
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-05',
        type: 'income',
        amount: 100,
      });
      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2024-01-10',
        value: 1000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-15',
        type: 'income',
        amount: 200,
      });
      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2024-01-20',
        value: 2000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-25',
        type: 'income',
        amount: 300,
      });
      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2024-01-30',
        value: 3000,
      });

      const balances = await dsl.analysis.getDailyBalances({});
      const dates = balances.map(e => e.date);
      assert.deepEqual(dates, [
        '2024-01-05',
        '2024-01-10',
        '2024-01-15',
        '2024-01-20',
        '2024-01-25',
        '2024-01-30',
      ]);
    });
  });

  describe('1.7 Cross-Check Invariants', function () {
    it('should have sum of account balances equal balance + investments (DB-1.7.1)', async function () {
      await createBank('bank1', '2024-01-10');
      await createBank('bank2', '2024-01-10');
      await createInvestment('invest1', '2024-01-10');

      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-10',
        type: 'income',
        amount: 10000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-15',
        type: 'transfer',
        toAccount: 'bank2',
        amount: 3000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-20',
        type: 'transfer',
        toAccount: 'invest1',
        amount: -2000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank2',
        date: '2024-01-25',
        type: 'expense',
        amount: -500,
      });

      await dsl.analysis.verifyAccountBalancesMatchAggregate({
        accounts: ['bank1', 'bank2', 'invest1'],
      });
    });

    it('should have netWorth == balance + investmentValue with market data (DB-1.7.2)', async function () {
      await createBank('bank1', '2024-01-10');
      await createInvestment('invest1', '2024-01-10');
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-10',
        type: 'income',
        amount: 5000,
      });
      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2024-01-10',
        value: 8000,
      });

      const balances = await dsl.analysis.getDailyBalances({});
      balances.forEach(entry => {
        assert.equal(
          entry.netWorth,
          entry.balance + entry.investmentValue,
          `netWorth invariant failed on ${entry.date}`
        );
      });
    });

    it('should have netWorth == balance + investments without market data (DB-1.7.3)', async function () {
      await createBank('bank1', '2024-01-10');
      await createInvestment('invest1', '2024-01-10');
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-10',
        type: 'income',
        amount: 5000,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-15',
        type: 'transfer',
        toAccount: 'invest1',
        amount: -2000,
      });

      const balances = await dsl.analysis.getDailyBalances({});
      balances.forEach(entry => {
        assert.equal(
          entry.netWorth,
          entry.balance + entry.investments,
          `netWorth invariant failed on ${entry.date}`
        );
      });
    });

    it('should maintain chronological ordering (DB-1.7.4)', async function () {
      await createBank('bank1', '2024-01-05');
      await createInvestment('invest1', '2024-01-05');
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-05',
        type: 'income',
        amount: 100,
      });
      await dsl.transactions.createTransaction({
        account: 'bank1',
        date: '2024-01-25',
        type: 'income',
        amount: 200,
      });
      await dsl.accounts.setValue({
        account: 'invest1',
        date: '2024-01-15',
        value: 5000,
      });

      const balances = await dsl.analysis.getDailyBalances({});
      const dates = balances.map(e => e.date);
      for (let i = 1; i < dates.length; i++) {
        assert.isTrue(
          dates[i] > dates[i - 1],
          `Date order violated: ${dates[i - 1]} >= ${dates[i]}`
        );
      }
    });
  });
});
