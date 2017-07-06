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

    it('should retrieve transaction in an account', async function() {
        await dsl.transactions.createTransaction({alias: 'transaction1', date: '2017-06-03', account: 'account1', amount: '5023'});
        await dsl.transactions.createTransaction({alias: 'transaction2', date: '2017-06-02', account: 'account1', amount: '-22'});
        await dsl.transactions.createTransaction({alias: 'transaction3', date: '2017-06-01', account: 'account1', amount: '-6000'});

        await dsl.transactions.verifyTransactions({
            account: 'account1',
            expectTransactions: [
                'account1',
                'transaction1',
                'transaction2',
                'transaction3',
            ],
        });
    });

    it('should page transactions and include balance prior to earliest included transaction', async function() {
        await dsl.transactions.createTransaction({alias: 'transaction1', date: '2017-06-01', account: 'account1', amount: '100'});
        await dsl.transactions.createTransaction({alias: 'transaction2', date: '2017-06-02', account: 'account1', amount: '200'});
        await dsl.transactions.createTransaction({alias: 'transaction3', date: '2017-06-03', account: 'account1', amount: '300'});
        await dsl.transactions.createTransaction({alias: 'transaction4', date: '2017-06-04', account: 'account1', amount: '-400'});
        await dsl.transactions.createTransaction({alias: 'transaction5', date: '2017-06-05', account: 'account1', amount: '500'});


        await dsl.transactions.verifyTransactions({
            account: 'account1',
            offset: 0,
            pageSize: 3,
            expectPriorBalance: 300,
            expectHasMore: true,
            expectTransactions: [
                'account1',
                'transaction5',
                'transaction4',
            ],
        });
        await dsl.transactions.verifyTransactions({
            account: 'account1',
            pageSize: 3,
            offset: 3,
            expectPriorBalance: 0,
            expectHasMore: false,
            expectTransactions: [
                'transaction3',
                'transaction2',
                'transaction1',
            ],
        });
    });
});