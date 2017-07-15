const assert = require('chai').assert;
const dslUtils = require('./dslUtils');

module.exports = class TransactionsDsl {
    constructor(server, accountsByAlias, transactionsByAlias, categoriesByAlias) {
        this.server = server;
        this.accountsByAlias = accountsByAlias;
        this.transactionsByAlias = transactionsByAlias;
        this.categoriesByAlias = categoriesByAlias;
    }

    async createTransaction(args) {
        const options = Object.assign({
            alias: null,
            account: null,
            amount: 0,
            type: 'expense',
            date: '2017-06-03',
            payee: undefined,
            notes: undefined,
            category: undefined,
            statusCode: 201,
        }, args);

        const createTransactionRequest = dslUtils.withoutUndefined({
            accountId: this.accountsByAlias.get(options.account).id,
            amount: options.amount,
            type: options.type,
            date: options.date,
            payee: options.payee,
            notes: options.notes,
            categoryId: options.category !== undefined ? this.categoriesByAlias.get(options.category).id : undefined,
        });
        const response = await this.server.post('/api/transactions/', createTransactionRequest);
        assert.equal(response.statusCode, options.statusCode, 'Incorrect status code: ' + response.payload);
        const createdTransaction = JSON.parse(response.payload);
        assert.include(createdTransaction, createTransactionRequest);
        if (options.alias) {
            this.transactionsByAlias.set(options.alias, createdTransaction);
        }
    }

    async modifyTransaction(args) {
        const options = Object.assign({
            alias: null,
            account: undefined,
            amount: undefined,
            type: undefined,
            date: undefined,
            payee: undefined,
            notes: undefined,
            statusCode: 200,
        }, args);

        const currentTransaction = this.transactionsByAlias.get(options.alias);
        const modifiedTransaction = dslUtils.override(currentTransaction, {
            name: options.name,
            amount: options.amount,
            type: options.type,
            date: options.date,
            payee: options.payee,
            notes: options.payee,
            accountId: options.account !== undefined ? this.accountsByAlias.get(options.account).id : undefined,
        });

        const response = await this.server.put(`/api/transactions/${encodeURIComponent(currentTransaction.id)}/`, modifiedTransaction);
        assert.equal(response.statusCode, options.statusCode, 'Incorrect status code');
        if (options.statusCode === 200) {
            this.transactionsByAlias.set(options.alias, modifiedTransaction);
        }
    }

    async verifyTransaction(args) {
        const options = Object.assign({
            alias: null,
            statusCode: 200,
        }, args);
        const transaction = this.transactionsByAlias.get(options.alias);
        const response = await this.server.get(`/api/transactions/${encodeURIComponent(transaction.id)}/`);
        console.log(response.payload);
        assert.equal(response.statusCode, options.statusCode, 'Incorrect status code');
        if (response.statusCode === 200) {
            assert.deepEqual(JSON.parse(response.payload), transaction, 'Did not match transaction');
        }
    }

    async verifyTransactions(args) {
        const options = Object.assign({
            account: undefined,
            pageSize: undefined,
            offset: undefined,
            expectPriorBalance: 0,
            expectHasMore: false,
            expectTransactions: [],
            statusCode: 200,
        }, args);
        const account = this.accountsByAlias.get(options.account);
        const expectedTransactions = options.expectTransactions.map(alias => this.transactionsByAlias.get(alias));
        const pageSizeArg = options.pageSize !== undefined ? `&pageSize=${encodeURIComponent(options.pageSize)}` : '';
        const offsetArg = options.offset !== undefined ? `&offset=${encodeURIComponent(options.offset)}` : '';
        const response = await this.server.get(`/api/transactions/?account=${encodeURIComponent(account.id)}${pageSizeArg}${offsetArg}`);
        assert.equal(response.statusCode, options.statusCode, 'Incorrect status code');
        const result = JSON.parse(response.payload);
        assert.deepEqual(result, {
            transactions: expectedTransactions,
            priorBalance: options.expectPriorBalance,
            hasMore: options.expectHasMore,
        });
    }
};