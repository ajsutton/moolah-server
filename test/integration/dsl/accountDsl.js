const assert = require('chai').assert;

module.exports = class AccountsDsl {
    constructor(server) {
        this.server = server;
        this.accountsByAlias = new Map();
    }

    async createAccount(args) {
        const options = Object.assign({
            alias: 'account',
            name: 'Unnamed Account',
            type: 'bank',
            balance: 0,
            statusCode: 201,
        }, args);

        const response = await this.server.post('/accounts/', {
            name: options.name,
            type: options.type,
            balance: options.balance
        });
        assert.equal(response.statusCode, options.statusCode, 'Incorrect status code');
        if (options.alias) {
            this.accountsByAlias.set(options.alias, JSON.parse(response.payload));
        }
    }

    async verifyAccount(args) {
        const options = Object.assign({
            alias: null,
            statusCode: 200,
        }, args);
        const account = this.accountsByAlias.get(options.alias);
        const response = await this.server.get(`/accounts/${encodeURIComponent(account.id)}/`);
        assert.equal(response.statusCode, options.statusCode, 'Incorrect status code');
        if (response.statusCode == 200) {
            assert.deepEqual(JSON.parse(response.payload), account, 'Did not match account');
        }
    }

    async verifyAccounts(args) {
        const options = Object.assign({
            statusCode: 200,
            accounts: undefined,
        }, args);
        const response = await this.server.get('/accounts/');
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
            balance: undefined,
        }, args);
        const currentAccount = this.accountsByAlias.get(options.alias);
        const modifiedAccount = Object.assign(currentAccount, {
            name: options.name,
            type: options.type,
            balance: options.balance
        });
        const response = await this.server.put('/accounts/' + encodeURIComponent(currentAccount.id) + '/', modifiedAccount);
        assert.equal(response.statusCode, options.statusCode);
        if (options.statusCode == 200) {
            this.accountsByAlias.set(options.alias, modifiedAccount);
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