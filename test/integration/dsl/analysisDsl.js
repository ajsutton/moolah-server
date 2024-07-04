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
    const response = await this.server.get(
      `/api/analysis/incomeAndExpense/?after=${options.after}&monthEnd=${options.monthEnd}`,
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
      entry.netWorth = entry.balance + entry.investments;
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

  async verifyCategoryBalances(args) {
    const options = Object.assign(
      {
        account: undefined,
        from: undefined,
        to: undefined,
        categories: [],
        expected: [],
        statusCode: 200,
      },
      args
    );

    const queryArgs = dslUtils.formatQueryArgs({
      account: options.account
        ? this.accountsByAlias.get(options.account).id
        : undefined,
      pageSize: options.pageSize,
      offset: options.offset,
      from: options.from,
      to: options.to,
      category: options.categories.map(categoryId =>
        dslUtils.lookupId(categoryId, this.categoriesByAlias)
      ),
    });
    const response = await this.server.get(
      `/api/analysis/categoryBalances/${queryArgs}`,
      options.statusCode
    );
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
