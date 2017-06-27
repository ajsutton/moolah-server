const assert = require('chai').assert;

module.exports = class AccountsDsl {
    constructor(server) {
        this.server = server;
        this.accountsByAlias = new Map();
    }

    async createAccount(alias, args) {
        const options = Object.assign({
            name: 'Unnamed Account',
            type: 'bank',
            balance: 0,
        }, args);

        const response = await this.server.post('/accounts/', options);
        this.accountsByAlias.set(alias, JSON.parse(response.payload));
    }

    async verifyAccounts(...accounts) {
        const response = await this.server.get('/accounts/');
        const actualAccounts = JSON.parse(response.payload).accounts;
        const expectedAccounts = accounts.map(alias => this.getAccount(alias));
        assert.includeDeepMembers(actualAccounts, expectedAccounts, 'Did not find all expected accounts.');
    }

    getAccount(alias) {
        if (this.accountsByAlias.has(alias)) {
            return this.accountsByAlias.get(alias);
        } else {
            throw new Error('Unknown account: ' + alias);
        }
    }
}