import { assert } from 'chai';
import dslUtils from './dslUtils.js';

export default class BudgetsDsl {
  constructor(server, accountsByAlias, categoriesByAlias) {
    this.server = server;
    this.accountsByAlias = accountsByAlias;
    this.categoriesByAlias = categoriesByAlias;
  }

  async setBudget(args) {
    const options = Object.assign(
      {
        earmark: null,
        category: undefined,
        amount: 0,
        statusCode: 201,
      },
      args
    );

    const earmarkId = dslUtils.lookupId(options.earmark, this.accountsByAlias);
    const categoryId = dslUtils.lookupId(
      options.category,
      this.categoriesByAlias
    );
    const setBudgetRequest = dslUtils.withoutUndefined({
      amount: options.amount,
    });
    await this.server.put(
      `/api/earmarks/${earmarkId}/budget/${categoryId}/`,
      setBudgetRequest,
      options.statusCode
    );
  }

  async verifyBudget(args) {
    const options = Object.assign(
      {
        earmark: null,
        category: undefined,
        amount: 0,
        statusCode: 200,
      },
      args
    );

    const earmarkId = dslUtils.lookupId(options.earmark, this.accountsByAlias);
    const categoryId = dslUtils.lookupId(
      options.category,
      this.categoriesByAlias
    );
    const response = await this.server.get(
      `/api/earmarks/${earmarkId}/budget/${categoryId}/`,
      options.statusCode
    );
    assert.deepEqual(
      JSON.parse(response.payload),
      { amount: options.amount },
      'Did not match budget'
    );
  }

  async verifyBudgets(args) {
    const options = Object.assign(
      {
        earmark: null,
        budgets: {},
        statusCode: 200,
      },
      args
    );

    const earmarkId = dslUtils.lookupId(options.earmark, this.accountsByAlias);
    const response = await this.server.get(
      `/api/earmarks/${earmarkId}/budget/`,
      options.statusCode
    );
    const expected = {};
    Object.entries(options.budgets).forEach(
      ([categoryAlias, amount]) =>
        (expected[dslUtils.lookupId(categoryAlias, this.categoriesByAlias)] =
          amount)
    );
    assert.deepEqual(JSON.parse(response.payload), expected);
  }
}
