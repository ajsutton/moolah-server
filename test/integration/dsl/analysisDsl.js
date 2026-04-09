import { assert } from 'chai';
import dslUtils from './dslUtils.js';

export default class AnalysisDsl {
  constructor(server, accountsByAlias, categoriesByAlias) {
    this.server = server;
    this.accountsByAlias = accountsByAlias;
    this.categoriesByAlias = categoriesByAlias;
  }

  async verifyIncomeAndExpense(args) {
    const options = Object.assign(
      {
        after: undefined,
        monthEnd: 31,
        expected: [],
        statusCode: 200,
      },
      args
    );
    const queryArgs = dslUtils.formatQueryArgs({
      after: options.after,
      monthEnd: options.monthEnd,
    });
    const response = await this.server.get(
      `/api/analysis/incomeAndExpense/${queryArgs}`,
      options.statusCode
    );
    assert.deepEqual(
      JSON.parse(response.payload).incomeAndExpense,
      options.expected
    );
  }

  async verifyDailyBalances(args) {
    const options = Object.assign(
      {
        after: undefined,
        expected: [],
        statusCode: 200,
      },
      args
    );

    var expected = options.expected.map(entry => {
      entry.availableFunds = entry.balance - entry.earmarked;
      if (entry.investmentValue !== undefined) {
        entry.netWorth = entry.balance + entry.investmentValue;
      } else {
        entry.netWorth = entry.balance + entry.investments;
      }
      return entry;
    });

    const afterParam =
      options.after !== undefined ? `?after=${options.after}` : '';
    const response = await this.server.get(
      `/api/analysis/dailyBalances/${afterParam}`,
      options.statusCode
    );
    // Ignore best fit
    var actual = JSON.parse(response.payload).dailyBalances.map(entry => {
      delete entry.bestFit;
      return entry;
    });
    assert.deepEqual(actual, expected);
  }

  async getDailyBalances(args) {
    const options = Object.assign(
      {
        after: undefined,
        statusCode: 200,
      },
      args
    );
    const afterParam =
      options.after !== undefined ? `?after=${options.after}` : '';
    const response = await this.server.get(
      `/api/analysis/dailyBalances/${afterParam}`,
      options.statusCode
    );
    return JSON.parse(response.payload).dailyBalances.map(entry => {
      delete entry.bestFit;
      return entry;
    });
  }

  async verifyExpenseBreakdown(args) {
    const options = Object.assign(
      {
        after: undefined,
        monthEnd: 31,
        expected: [],
        statusCode: 200,
      },
      args
    );
    const queryArgs = dslUtils.formatQueryArgs({
      after: options.after,
      monthEnd: options.monthEnd,
    });
    const response = await this.server.get(
      `/api/analysis/expenseBreakdown/${queryArgs}`,
      options.statusCode
    );
    const expected = options.expected.map(entry => ({
      categoryId: dslUtils.lookupId(entry.category, this.categoriesByAlias),
      month: entry.month,
      totalExpenses: entry.totalExpenses,
    }));
    const sortKey = e => `${e.categoryId}-${e.month}`;
    const actual = JSON.parse(response.payload).sort((a, b) =>
      sortKey(a).localeCompare(sortKey(b))
    );
    expected.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    assert.deepEqual(actual, expected);
  }

  async verifyDailyBalancesEntry(args) {
    const options = Object.assign(
      { after: undefined, date: undefined, expected: {} },
      args
    );
    const balances = await this.getDailyBalances({
      after: options.after,
    });
    const entry = balances.find(e => e.date === options.date);
    assert.isNotNull(entry, `No entry found for date ${options.date}`);
    for (const [key, value] of Object.entries(options.expected)) {
      assert.equal(
        entry[key],
        value,
        `${key} mismatch on ${options.date}`
      );
    }
  }

  async verifyTransfersNetZero(args) {
    const options = Object.assign(
      { after: undefined, expectedTotal: undefined },
      args
    );
    const balances = await this.getDailyBalances({
      after: options.after,
    });
    balances.forEach(entry => {
      assert.equal(
        entry.balance + entry.investments,
        options.expectedTotal,
        `balance + investments should be ${options.expectedTotal} on ${entry.date}`
      );
    });
  }

  async verifyDateRangeConsistency(args) {
    const options = Object.assign({ afterDates: [] }, args);
    const fullHistory = await this.getDailyBalances({});
    for (const afterDate of options.afterDates) {
      const filtered = await this.getDailyBalances({ after: afterDate });
      for (const filteredEntry of filtered) {
        const fullEntry = fullHistory.find(
          e => e.date === filteredEntry.date
        );
        assert.isNotNull(
          fullEntry,
          `Date ${filteredEntry.date} missing from full history`
        );
        for (const field of [
          'balance',
          'earmarked',
          'investments',
          'availableFunds',
        ]) {
          assert.equal(
            filteredEntry[field],
            fullEntry[field],
            `${field} mismatch on ${filteredEntry.date} with after=${afterDate}`
          );
        }
      }
    }
  }

  async verifyAccountBalancesMatchAggregate(args) {
    const options = Object.assign(
      { after: undefined, accounts: [] },
      args
    );
    const dailyBalances = await this.getDailyBalances({
      after: options.after,
    });
    const accountBalances = {};
    for (const alias of options.accounts) {
      const account = this.accountsByAlias.get(alias);
      const afterParam =
        options.after !== undefined ? `?after=${options.after}` : '';
      const response = await this.server.get(
        `/api/accounts/${encodeURIComponent(account.id)}/balances${afterParam}`,
        200
      );
      accountBalances[alias] = JSON.parse(response.payload);
    }

    function findBalance(balances, date) {
      let lastBalance = 0;
      for (const entry of balances) {
        if (entry.date <= date) {
          lastBalance = entry.balance;
        }
      }
      return lastBalance;
    }

    for (const entry of dailyBalances) {
      let sum = 0;
      for (const alias of options.accounts) {
        sum += findBalance(accountBalances[alias], entry.date);
      }
      assert.equal(
        entry.balance + entry.investments,
        sum,
        `Invariant 1 failed on ${entry.date}: balance(${entry.balance}) + investments(${entry.investments}) != sum(${sum})`
      );
    }
  }

  async verifyCategoryBalances(args) {
    const options = Object.assign(
      {
        account: undefined,
        from: undefined,
        to: undefined,
        categories: [],
        earmark: undefined,
        transactionType: undefined,
        payee: undefined,
        scheduled: undefined,
        expected: [],
        statusCode: 200,
      },
      args
    );

    const queryArgs = dslUtils.formatQueryArgs({
      account: dslUtils.lookupId(options.account, this.accountsByAlias),
      pageSize: options.pageSize,
      offset: options.offset,
      from: options.from,
      to: options.to,
      category: options.categories.map(categoryId =>
        dslUtils.lookupId(categoryId, this.categoriesByAlias)
      ),
      earmark: dslUtils.lookupId(options.earmark, this.accountsByAlias),
      transactionType: options.transactionType,
      payee: options.payee,
      scheduled: options.scheduled,
    });
    const response = await this.server.get(
      `/api/analysis/categoryBalances/${queryArgs}`,
      options.statusCode
    );
    if (options.statusCode === 200) {
      const expected = {};
      options.expected.forEach(
        expectedBalance =>
          (expected[
            dslUtils.lookupId(expectedBalance.category, this.categoriesByAlias)
          ] = expectedBalance.balance)
      );
      assert.deepEqual(JSON.parse(response.payload), expected);
    }
  }
}
