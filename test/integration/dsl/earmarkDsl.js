const assert = require('chai').assert;
const dslUtils = require('./dslUtils');

module.exports = class EarmarksDsl {
    constructor(server, earmarksByAlias, transactionsByAlias) {
        this.server = server;
        this.earmarksByAlias = earmarksByAlias;
        this.transactionsByAlias = transactionsByAlias;
    }

    async createEarmark(args) {
        const options = Object.assign({
            alias: undefined,
            name: 'Unnamed Earmark',
            balance: 0,
            saved: 0,
            spent: 0,
            position: 0,
            date: undefined,
            savingsTarget: undefined,
            savingsStartDate: undefined,
            savingsEndDate: undefined,
            statusCode: 201,
        }, args);

        const response = await this.server.post('/api/earmarks/', {
            name: options.name,
            balance: options.balance,
            saved: options.saved,
            spent: options.spent,
            position: options.position,
            date: options.date,
            savingsTarget: options.savingsTarget,
            savingsStartDate: options.savingsStartDate,
            savingsEndDate: options.savingsEndDate,
        }, options.statusCode);
        const earmark = JSON.parse(response.payload);

        if (options.alias) {
            this.earmarksByAlias.set(options.alias, earmark);
        }
    }

    async verifyEarmark(args) {
        const options = Object.assign({
            alias: null,
            balance: undefined,
            saved: undefined,
            spent: undefined,
            position: undefined,
            hidden: undefined,
            savingsTarget: undefined,
            savingsStartDate: undefined,
            savingsEndDate: undefined,
            statusCode: 200,
        }, args);
        const earmark = dslUtils.override(this.earmarksByAlias.get(options.alias), {
            balance: options.balance,
            saved: options.saved,
            spent: options.spent,
            position: options.position,
            hidden: options.hidden,
            savingsTarget: options.savingsTarget,
            savingsStartDate: options.savingsStartDate,
            savingsEndDate: options.savingsEndDate,
        });
        const response = await this.server.get(`/api/earmarks/${encodeURIComponent(earmark.id)}/`, options.statusCode);
        if (response.statusCode === 200) {
            assert.deepEqual(JSON.parse(response.payload), earmark, `Did not match earmark ${options.alias}`);
        }
    }

    async verifyEarmarks(args) {
        const options = Object.assign({
            statusCode: 200,
            earmarks: undefined,
        }, args);
        const response = await this.server.get('/api/earmarks/', options.statusCode);
        if (options.earmarks !== undefined) {
            const actualEarmarks = JSON.parse(response.payload).earmarks;
            const expectedEarmarks = options.earmarks.map(alias => this.getEarmark(alias));
            assert.includeDeepMembers(actualEarmarks, expectedEarmarks, 'Did not find all expected earmarks.');
        }
    }

    async modifyEarmark(args) {
        const options = Object.assign({
            alias: null,
            statusCode: 200,
            name: undefined,
            hidden: undefined,
            savingsTarget: undefined,
            savingsStartDate: undefined,
            savingsEndDate: undefined,
        }, args);
        const currentEarmark = this.earmarksByAlias.get(options.alias);
        const modifiedEarmark = dslUtils.override(currentEarmark, {
            name: options.name,
            hidden: options.hidden,
            balance: options.balance,
            saved: options.saved,
            spent: options.spent,
            savingsTarget: options.savingsTarget,
            savingsStartDate: options.savingsStartDate,
            savingsEndDate: options.savingsEndDate,
        });
        const response = await this.server.put('/api/earmarks/' + encodeURIComponent(currentEarmark.id) + '/', modifiedEarmark, options.statusCode);
        if (options.statusCode === 200) {
            this.earmarksByAlias.set(options.alias, JSON.parse(response.payload));
        }
    }

    getEarmark(alias) {
        if (this.earmarksByAlias.has(alias)) {
            return this.earmarksByAlias.get(alias);
        } else {
            throw new Error('Unknown earmark: ' + alias);
        }
    }
};