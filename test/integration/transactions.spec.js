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
        await dsl.transactions.createTransaction({alias: 'transaction1', account: 'account1', amount: 5023});
        await dsl.transactions.verifyTransaction({alias: 'transaction1'});
    });

    it('should reject creating a transaction when account does not exist', async function() {
        await dsl.transactions.createTransaction({alias: 'transaction1', account: '<noAccount>', amount: 5023, statusCode: 400});
    });

    it('should reject updating a transaction when account does not exist', async function() {
        await dsl.transactions.createTransaction({alias: 'transaction1', account: 'account1', amount: 5023});
        await dsl.transactions.modifyTransaction({alias: 'transaction1', account: '<noAccount>', amount: 5023, statusCode: 400});
    });

    it('should calculate account balance from transactions', async function() {
        await dsl.transactions.createTransaction({alias: 'transaction1', account: 'account1', amount: 5023});
        await dsl.accounts.verifyAccount({alias: 'account1', balance: 5023});
        await dsl.transactions.createTransaction({alias: 'transaction2', account: 'account1', amount: -22});
        await dsl.accounts.verifyAccount({alias: 'account1', balance: 5001});
        await dsl.transactions.createTransaction({alias: 'transaction3', account: 'account1', amount: -6000});
        await dsl.accounts.verifyAccount({alias: 'account1', balance: -999});
    });

    it('should retrieve transaction in an account', async function() {
        await dsl.transactions.createTransaction({alias: 'transaction1', date: '2017-06-03', account: 'account1', amount: 5023});
        await dsl.transactions.createTransaction({alias: 'transaction2', date: '2017-06-02', account: 'account1', amount: -22});
        await dsl.transactions.createTransaction({alias: 'transaction3', date: '2017-06-01', account: 'account1', amount: -6000});

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
        await dsl.transactions.createTransaction({alias: 'transaction1', date: '2017-06-01', account: 'account1', amount: 100});
        await dsl.transactions.createTransaction({alias: 'transaction2', date: '2017-06-02', account: 'account1', amount: 200});
        await dsl.transactions.createTransaction({alias: 'transaction3', date: '2017-06-03', account: 'account1', amount: 300});
        await dsl.transactions.createTransaction({alias: 'transaction4', date: '2017-06-04', account: 'account1', amount: -400});
        await dsl.transactions.createTransaction({alias: 'transaction5', date: '2017-06-05', account: 'account1', amount: 500});


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

    it('should update transaction', async function() {
        await dsl.accounts.createAccount({alias: 'account2'});
        await dsl.transactions.createTransaction({alias: 'transaction1', date: '2017-06-01', account: 'account1', amount: 100});
        await dsl.transactions.modifyTransaction({alias: 'transaction1', date: '2017-06-02', account: 'account2', amount: 200, payee: 'George', notes: 'From George'});
    });

    it('should delete a transaction', async function() {
        await dsl.transactions.createTransaction({alias: 'transaction1', date: '2017-06-01', account: 'account1', amount: 100});
        await dsl.transactions.deleteTransaction({alias: 'transaction1'});

        await dsl.accounts.verifyAccount({alias: 'account1', balance: 0});
    });

    describe('Transaction Categories', function() {
        it('should create transaction with category', async function() {
            await dsl.categories.createCategory({alias: 'category1'});

            await dsl.transactions.createTransaction({alias: 'transaction1', account: 'account1', category: 'category1'});
            await dsl.transactions.verifyTransaction({alias: 'transaction1'});
        });

        it('should add category to transaction', async function() {
            await dsl.categories.createCategory({alias: 'category1'});
            await dsl.transactions.createTransaction({alias: 'transaction1', account: 'account1'});

            await dsl.transactions.modifyTransaction({alias: 'transaction1', category: 'category1'});
            await dsl.transactions.verifyTransaction({alias: 'transaction1'});
        });

        it('should remove category from transaction', async function() {
            await dsl.categories.createCategory({alias: 'category1'});
            await dsl.transactions.createTransaction({alias: 'transaction1', account: 'account1', category: 'category1'});

            await dsl.transactions.modifyTransaction({alias: 'transaction1', category: null});
            await dsl.transactions.verifyTransaction({alias: 'transaction1'});
        });

        it('should change transaction category', async function() {
            await dsl.categories.createCategory({alias: 'category1'});
            await dsl.categories.createCategory({alias: 'category2'});
            await dsl.transactions.createTransaction({alias: 'transaction1', account: 'account1', category: 'category1'});

            await dsl.transactions.modifyTransaction({alias: 'transaction1', category: 'category2'});
            await dsl.transactions.verifyTransaction({alias: 'transaction1'});
        });
    });

    describe('Transfers', function() {
        beforeEach(async function() {
            await dsl.accounts.createAccount({alias: 'account2'});
        });

        it('should adjust balance of both accounts affected by transfer', async function() {
            await dsl.transactions.createTransaction({alias: 'transfer', type: 'transfer', account: 'account1', toAccount: 'account2', amount: -100});

            await dsl.transactions.verifyTransaction({alias: 'transfer'});
            await dsl.accounts.verifyAccount({alias: 'account1', balance: -100});
            await dsl.accounts.verifyAccount({alias: 'account2', balance: 100});
        });

        it('should make a transaction a transfer', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction', type: 'expense', account: 'account1', amount: -100});

            await dsl.transactions.modifyTransaction({alias: 'transaction', type: 'transfer', toAccount: 'account2'});
            await dsl.transactions.verifyTransaction({alias: 'transaction'});
            await dsl.accounts.verifyAccount({alias: 'account1', balance: -100});
            await dsl.accounts.verifyAccount({alias: 'account2', balance: 100});
        });

        it('should make a transaction not a transfer', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction', type: 'transfer', account: 'account1', toAccount: 'account2', amount: -100});

            await dsl.transactions.modifyTransaction({alias: 'transaction', type: 'expense', toAccount: null});
            await dsl.transactions.verifyTransaction({alias: 'transaction'});
            await dsl.accounts.verifyAccount({alias: 'account1', balance: -100});
            await dsl.accounts.verifyAccount({alias: 'account2', balance: 0});
        });

        it('should reject creating a transaction with a toAccountId that does not exist', async function() {
            await dsl.transactions.createTransaction({alias: 'transfer', type: 'transfer', account: '<noAccount>', toAccount: 'account2', amount: -100, statusCode: 400});
        });

        it('should reject modifying a transaction when toAccountId does not exist', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction', type: 'transfer', account: 'account1', toAccount: 'account2', amount: -100});
            await dsl.transactions.modifyTransaction({alias: 'transaction', type: 'expense', toAccount: '<noAccount>', statusCode: 400});
        });
    });
});