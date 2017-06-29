const Dsl = require('./dsl');

describe('Account Management', function() {
    let dsl;

    beforeEach(async function() {
        dsl = await Dsl.create();
    });

    afterEach(function() {
        return dsl.tearDown();
    });

    it('should list accounts', false, async function() {
        await dsl.accounts.createAccount('account1', {name: 'Account 1', type: 'cc', balance: 0});
        await dsl.accounts.createAccount('account2', {name: 'Account 2', type: 'bank', balance: 5000});

        await dsl.accounts.verifyAccounts('account1', 'account2');
    });
});