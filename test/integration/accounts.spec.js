const Dsl = require('./dsl');

describe('Account Management', function() {
    let dsl;

    beforeEach(async function() {
        dsl = await Dsl.create();
        dsl.login();
    });

    afterEach(function() {
        return dsl.tearDown();
    });

    it('should list accounts', async function() {
        await dsl.accounts.createAccount({alias: 'account1', name: 'Account 1', type: 'cc', balance: 0});
        await dsl.accounts.createAccount({alias: 'account2', name: 'Account 2', type: 'bank', balance: 5000});

        await dsl.accounts.verifyAccounts({accounts: ['account1', 'account2']});
    });

    it('should modify an account', async function() {
        await dsl.accounts.createAccount({alias: 'account1', name: 'Account 1', type: 'cc', balance: 0});
        await dsl.accounts.modifyAccount({alias: 'account1', name: 'Modified Account', type: 'bank'});
        await dsl.accounts.verifyAccounts({accounts: ['account1']});
    });

    it('should get a specific account', async function() {
        await dsl.accounts.createAccount({alias: 'account1', name: 'Account 1', type: 'cc', balance: 0});
        await dsl.accounts.verifyAccount({alias: 'account1'});
    });

    it('should require a login to get an account', async function() {
        await dsl.accounts.createAccount({alias: 'account1', name: 'Account 1', type: 'cc', balance: 0});
        dsl.logout();
        await dsl.accounts.verifyAccount({alias: 'account1', statusCode: 401});
    });

    it('should require login to list accounts', async function() {
        dsl.logout();
        await dsl.accounts.verifyAccounts({statusCode: 401});
    });

    it('should require login to create accounts', async function() {
        dsl.logout();
        await dsl.accounts.createAccount({statusCode: 401});
    });

    it('should require login to modify accounts', async function() {
        await dsl.accounts.createAccount({alias: 'account1', name: 'Account 1', type: 'cc', balance: 0});
        dsl.logout();
        await dsl.accounts.modifyAccount({alias: 'account1', statusCode: 401});
    });

    it('should default position to 0', async function() {
        await dsl.accounts.createAccount({alias: 'account1', position: undefined});
        await dsl.accounts.verifyAccount({alias: 'account1', position: 0});
    });

    describe('Savings Goals', function() {
        it('should create account with savings goal', async function() {
            await dsl.accounts.createAccount({alias: 'account1', savingsTarget: 500000, savingsStartDate: '2017-06-01', savingsEndDate: '2018-01-01'});
            await dsl.accounts.verifyAccount({alias: 'account1', savingsTarget: 500000, savingsStartDate: '2017-06-01', savingsEndDate: '2018-01-01'});
        });

        it('should modify account to add savings goal', async function() {
            await dsl.accounts.createAccount({alias: 'account1'});
            await dsl.accounts.modifyAccount({alias: 'account1', name: 'Foo', type: 'cc', savingsTarget: 500000, savingsStartDate: '2017-06-01', savingsEndDate: '2018-01-01'});
            await dsl.accounts.verifyAccount({alias: 'account1', savingsTarget: 500000, savingsStartDate: '2017-06-01', savingsEndDate: '2018-01-01'});
        });

        it('should modify account to remove savings goal', async function() {
            await dsl.accounts.createAccount({alias: 'account1', savingsTarget: 500000, savingsStartDate: '2017-06-01', savingsEndDate: '2018-01-01'});
            await dsl.accounts.modifyAccount({alias: 'account1', name: 'Foo', type: 'cc'});
            await dsl.accounts.verifyAccount({alias: 'account1'});
        });

        it('should modify account to change savings goal', async function() {
            await dsl.accounts.createAccount({alias: 'account1', savingsTarget: 500000, savingsStartDate: '2017-06-01', savingsEndDate: '2018-01-01'});
            await dsl.accounts.modifyAccount({alias: 'account1', name: 'Foo', type: 'cc', savingsTarget: 25000, savingsStartDate: '2018-06-01', savingsEndDate: '2018-02-01'});
            await dsl.accounts.verifyAccount({alias: 'account1', name: 'Foo', type: 'cc', savingsTarget: 25000, savingsStartDate: '2018-06-01', savingsEndDate: '2018-02-01'});
        });

        it('should include savings goal in full accounts list', async function() {
            await dsl.accounts.createAccount({alias: 'account1', savingsTarget: 500000, savingsStartDate: '2017-06-01', savingsEndDate: '2018-01-01'});
            await dsl.accounts.verifyAccounts({accounts: ['account1']});
        });
    });
});