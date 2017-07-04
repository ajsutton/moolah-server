const assert = require('chai').assert;

module.exports = class TransactionsDsl {
    constructor(server, accountsByAlias, transactionsByAlias) {
        this.server = server;
        this.accountsByAlias = accountsByAlias;
        this.transactionsByAlias = transactionsByAlias;
    }

    async createTransaction(args) {
        const options = Object.assign({
            alias: null,
            account: null,
            amount: null,
            type: 'expense',
            date: '2017-06-03',
            payee: undefined,
            notes: undefined,
            statusCode: 201,
        }, args);

        const response = await this.server.post('/api/transactions/', {
            accountId: this.accountsByAlias.get(options.account).id,
            amount: options.amount,
            type: options.type,
            date: options.date,
            payee: options.payee,
            notes: options.notes,
        });
        assert.equal(response.statusCode, options.statusCode, 'Incorrect status code: ' + response.payload);
        if (options.alias) {
            const transaction = JSON.parse(response.payload);
            this.transactionsByAlias.set(options.alias, transaction);
        }
    }

    async verifyTransaction(args) {
        const options = Object.assign({
            alias: null,
            statusCode: 200,
        }, args);
        const transaction = this.transactionsByAlias.get(options.alias);
        const response = await this.server.get(`/api/transactions/${encodeURIComponent(transaction.id)}/`);
        assert.equal(response.statusCode, options.statusCode, 'Incorrect status code');
        if (response.statusCode === 200) {
            assert.deepEqual(JSON.parse(response.payload), transaction, 'Did not match transaction');
        }
    }

    async verifyTransactions(args) {
        const options = Object.assign({
            account: undefined,
            pageSize: undefined,
            expectPriorBalance: 0,
            expectHasMore: false,
            expectTransactions: [],
            statusCode: 200,
        }, args);
        const account = this.accountsByAlias.get(options.account);
        const expectedTransactions = options.expectTransactions.map(alias => this.transactionsByAlias.get(alias));
        const pageSizeArg = options.pageSize !== undefined ? `&pageSize=${encodeURIComponent(options.pageSize)}` : '';
        const response = await this.server.get(`/api/transactions/?account=${encodeURIComponent(account.id)}${pageSizeArg}`);
        assert.equal(response.statusCode, options.statusCode, 'Incorrect status code');
        const result = JSON.parse(response.payload);
        console.log(result);
        assert.deepEqual(result, {
            transactions: expectedTransactions,
            priorBalance: options.expectPriorBalance,
            hasMore: options.expectHasMore,
        });
    }
};