const assert = require('chai').assert;
const dslUtils = require('./dslUtils');

module.exports = class AccountsDsl {
    constructor(server, accountsByAlias, transactionsByAlias) {
        this.server = server;
        this.accountsByAlias = accountsByAlias;
        this.transactionsByAlias = transactionsByAlias;
    }

    async createAccount(args) {
        const options = Object.assign({
            alias: undefined,
            name: 'Unnamed Account',
            type: 'bank',
            balance: 0,
            position: 0,
            statusCode: 201,
        }, args);

        const response = await this.server.post('/api/accounts/', {
            name: options.name,
            type: options.type,
            balance: options.balance,
            position: options.position,
        });
        assert.equal(response.statusCode, options.statusCode, 'Incorrect status code');
        const account = JSON.parse(response.payload);

        if (options.alias) {
            this.accountsByAlias.set(options.alias, account);

            const transactionResponse = await this.server.get(`/api/transactions/${encodeURIComponent(account.id)}/`);
            assert.equal(transactionResponse.statusCode, 200, 'Incorrect transaction status code');
            this.transactionsByAlias.set(options.alias, JSON.parse(transactionResponse.payload));
        }
    }

    async verifyAccount(args) {
        const options = Object.assign({
            alias: null,
            balance: undefined,
            position: undefined,
            statusCode: 200,
        }, args);
        const account = dslUtils.override(this.accountsByAlias.get(options.alias), {balance: options.balance, position: options.position});
        const response = await this.server.get(`/api/accounts/${encodeURIComponent(account.id)}/`);
        assert.equal(response.statusCode, options.statusCode, 'Incorrect status code');
        if (response.statusCode === 200) {
            assert.deepEqual(JSON.parse(response.payload), account, 'Did not match account');
        }
    }

    async verifyAccounts(args) {
        const options = Object.assign({
            statusCode: 200,
            accounts: undefined,
        }, args);
        const response = await this.server.get('/api/accounts/');
        assert.equal(response.statusCode, options.statusCode, 'Incorrect status code');
        if (options.accounts !== undefined) {
            const actualAccounts = JSON.parse(response.payload).accounts;
            const expectedAccounts = options.accounts.map(alias => this.getAccount(alias));
            assert.includeDeepMembers(actualAccounts, expectedAccounts, 'Did not find all expected accounts.');
        }
    }

    async modifyAccount(args) {
        const options = Object.assign({
            alias: null,
            statusCode: 200,
            name: undefined,
            type: undefined,
        }, args);
        const currentAccount = this.accountsByAlias.get(options.alias);
        const modifiedAccount = Object.assign(currentAccount, {
            name: options.name,
            type: options.type,
            balance: options.balance
        });
        const response = await this.server.put('/api/accounts/' + encodeURIComponent(currentAccount.id) + '/', modifiedAccount);
        assert.equal(response.statusCode, options.statusCode);
        if (options.statusCode == 200) {
            console.log(response.payload);
            this.accountsByAlias.set(options.alias, JSON.parse(response.payload));
        }
    }

    getAccount(alias) {
        if (this.accountsByAlias.has(alias)) {
            return this.accountsByAlias.get(alias);
        } else {
            throw new Error('Unknown account: ' + alias);
        }
    }
};