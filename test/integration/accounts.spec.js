const Dsl = require('./dsl');

describe('Account Management', function() {
    let dsl;

    beforeEach(async function() {
        dsl = await Dsl.create();
    });

    afterEach(function() {
        return dsl.tearDown();
    });

    it('should list accounts', async function() {
        dsl.login();
        await dsl.accounts.createAccount({alias: 'account1', name: 'Account 1', type: 'cc', balance: 0});
        await dsl.accounts.createAccount({alias: 'account2', name: 'Account 2', type: 'bank', balance: 5000});

        await dsl.accounts.verifyAccounts({accounts: ['account1', 'account2']});
    });

    it('should require login to list accounts', async function() {
        await dsl.accounts.verifyAccounts({statusCode: 401});
    });

    it('should require login to create accounts', async function() {
        await dsl.accounts.createAccount({statusCode: 401});
    });

    it('should require login to modify accounts', async function() {
        dsl.login();
        await dsl.accounts.createAccount({alias: 'account1', name: 'Account 1', type: 'cc', balance: 0});
        dsl.logout();
        await dsl.accounts.modifyAccount({alias: 'account1', statusCode: 401});
    });
});