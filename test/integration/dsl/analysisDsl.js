const assert = require('chai').assert;
const dslUtils = require('./dslUtils');

module.exports = class AnalysisDsl {
    constructor(server) {
        this.server = server;
    }

    async verifyIncomeAndExpense(args) {
        const options = Object.assign({
            after: undefined,
            monthEnd: 31,
            expected: [],
            statusCode: 200,
        }, args);
        const response = await this.server.get(`/api/analysis/incomeAndExpense/?after=${options.after}&monthEnd=${options.monthEnd}`, options.statusCode);
        assert.deepEqual(JSON.parse(response.payload).incomeAndExpense, options.expected);
    }
};