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

    it('should calculate account balance from transactions', async function() {
        await dsl.transactions.createTransaction({alias: 'transaction1', account: 'account1', amount: '5023'});
        await dsl.accounts.verifyAccount({alias: 'account1', balance: 5023});
        await dsl.transactions.createTransaction({alias: 'transaction2', account: 'account1', amount: '-22'});
        await dsl.accounts.verifyAccount({alias: 'account1', balance: 5001});
        await dsl.transactions.createTransaction({alias: 'transaction3', account: 'account1', amount: '-6000'});
        await dsl.accounts.verifyAccount({alias: 'account1', balance: -999});
    });

    it('should retrieve transaction in an account', false, async function() {
        await dsl.transactions.createTransaction({alias: 'transaction1', account: 'account1', amount: '5023'});
        await dsl.transactions.createTransaction({alias: 'transaction2', account: 'account1', amount: '-22'});
        await dsl.transactions.createTransaction({alias: 'transaction3', account: 'account1', amount: '-6000'});

        await dsl.transactions.verifyTransactions({account: 'account1', expectTransactions: ['transaction1', 'transaction2', 'transaction3']})
    });
});