const assert = require('chai').assert;
const dslUtils = require('./dslUtils');

module.exports = class BudgetsDsl {
    constructor(server, accountsByAlias, categoriesByAlias) {
        this.server = server;
        this.accountsByAlias = accountsByAlias;
        this.categoriesByAlias = categoriesByAlias;
    }

    async setBudget(args) {
        const options = Object.assign({
            earmark: null,
            category: undefined,
            amount: 0,
            statusCode: 201,
        }, args);

        const earmarkId = dslUtils.lookupId(options.earmark, this.accountsByAlias);
        const categoryId = dslUtils.lookupId(options.category, this.categoriesByAlias);
        const setBudgetRequest = dslUtils.withoutUndefined({
            amount: options.amount,
        });
        await this.server.put(`/api/earmarks/${earmarkId}/budget/${categoryId}/`, setBudgetRequest, options.statusCode);
    }

    async verifyBudget(args) {
        const options = Object.assign({
            earmark: null,
            category: undefined,
            amount: 0,
            statusCode: 200,
        }, args);

        const earmarkId = dslUtils.lookupId(options.earmark, this.accountsByAlias);
        const categoryId = dslUtils.lookupId(options.category, this.categoriesByAlias);
        const response = await this.server.get(`/api/earmarks/${earmarkId}/budget/${categoryId}/`, options.statusCode);
        assert.deepEqual(JSON.parse(response.payload), {amount: options.amount}, 'Did not match budget');
    }
}