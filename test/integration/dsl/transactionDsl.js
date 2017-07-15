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
            toAccount: undefined,
            statusCode: 201,
        }, args);

        const createTransactionRequest = dslUtils.withoutUndefined({
            accountId: dslUtils.lookupId(options.account, this.accountsByAlias),
            amount: options.amount,
            type: options.type,
            date: options.date,
            payee: options.payee,
            notes: options.notes,
            categoryId: dslUtils.lookupId(options.category, this.categoriesByAlias),
            toAccountId: dslUtils.lookupId(options.toAccount, this.accountsByAlias),
        });
        const response = await this.server.post('/api/transactions/', createTransactionRequest, options.statusCode);
        const createdTransaction = JSON.parse(response.payload);
        if (options.statusCode === 201) {
            assert.include(createdTransaction, createTransactionRequest);
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
            category: undefined,
            toAccount: undefined,
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
            accountId: dslUtils.lookupId(options.account, this.accountsByAlias),
            toAccountId: dslUtils.lookupId(options.toAccount, this.accountsByAlias),
            categoryId: dslUtils.lookupId(options.category, this.categoriesByAlias),
        });

        await this.server.put(`/api/transactions/${encodeURIComponent(currentTransaction.id)}/`, modifiedTransaction, options.statusCode);
        if (options.statusCode === 200) {
            this.transactionsByAlias.set(options.alias, modifiedTransaction);
        }
    }

    async verifyTransaction(args) {
        const options = Object.assign({
            alias: null,
            category: undefined,
            statusCode: 200,
        }, args);
        const transaction = dslUtils.override(this.transactionsByAlias.get(options.alias), { categoryId: dslUtils.lookupId(options.category, this.categoriesByAlias) });
        const response = await this.server.get(`/api/transactions/${encodeURIComponent(transaction.id)}/`, options.statusCode);
        console.log(response.payload);
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
        const response = await this.server.get(`/api/transactions/?account=${encodeURIComponent(account.id)}${pageSizeArg}${offsetArg}`, options.statusCode);
        const result = JSON.parse(response.payload);
        assert.deepEqual(result, {
            transactions: expectedTransactions,
            priorBalance: options.expectPriorBalance,
            hasMore: options.expectHasMore,
        });
    }
};