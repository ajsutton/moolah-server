const Dsl = require('./dsl');

describe('Transaction Management', function() {
    let dsl;

    beforeEach(async function() {
        dsl = await Dsl.create();
        dsl.login();
        await dsl.accounts.createAccount({alias: 'account1'});
    });

    afterEach(function() {
        return dsl.tearDown();
    });

    it('should create and retrieve a transaction', async function() {
        await dsl.transactions.createTransaction({alias: 'transaction1', account: 'account1', amount: '5023'});
        await dsl.transactions.verifyTransaction({alias: 'transaction1'});
    });
});