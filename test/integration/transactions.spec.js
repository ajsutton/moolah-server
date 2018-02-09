const Dsl = require('./dsl');

describe('Transaction Management', function() {
    let dsl;

    beforeEach(async function() {
        dsl = await Dsl.create();
        dsl.login();
        await dsl.accounts.createAccount({alias: 'account1', date: '2017-04-30'});
    });

    afterEach(function() {
        return dsl.tearDown();
    });

    describe('Transaction Maintenance', function() {
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
    });

    it('should calculate account balance from transactions', async function() {
        await dsl.transactions.createTransaction({alias: 'transaction1', account: 'account1', amount: 5023});
        await dsl.accounts.verifyAccount({alias: 'account1', balance: 5023});
        await dsl.transactions.createTransaction({alias: 'transaction2', account: 'account1', amount: -22});
        await dsl.accounts.verifyAccount({alias: 'account1', balance: 5001});
        await dsl.transactions.createTransaction({alias: 'transaction3', account: 'account1', amount: -6000});
        await dsl.accounts.verifyAccount({alias: 'account1', balance: -999});
    });

    describe('Search Transactions', function() {
        it('should retrieve transaction in an account', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction1', date: '2017-06-03', account: 'account1', amount: 5023});
            await dsl.transactions.createTransaction({alias: 'transaction2', date: '2017-06-02', account: 'account1', amount: -22});
            await dsl.transactions.createTransaction({alias: 'transaction3', date: '2017-06-01', account: 'account1', amount: -6000});

            await dsl.transactions.verifyTransactions({
                account: 'account1',
                expectTransactions: [
                    'transaction1',
                    'transaction2',
                    'transaction3',
                    'account1',
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
                    'transaction5',
                    'transaction4',
                    'transaction3',
                ],
                transactionCount: 6,
            });
            await dsl.transactions.verifyTransactions({
                account: 'account1',
                pageSize: 3,
                offset: 3,
                expectPriorBalance: 0,
                expectHasMore: false,
                expectTransactions: [
                    'transaction2',
                    'transaction1',
                    'account1',
                ],
                transactionCount: 6,
            });
        });

        it('should filter transactions by date', async function() {
            await dsl.accounts.createAccount({alias: 'account2', date: '2017-05-29'});
            await dsl.transactions.createTransaction({alias: 'transaction1', date: '2017-06-01', account: 'account1', amount: 100});
            await dsl.transactions.createTransaction({alias: 'transaction2', date: '2017-06-02', account: 'account2', amount: 200});
            await dsl.transactions.createTransaction({alias: 'transaction3', date: '2017-06-03', account: 'account1', amount: 300});
            await dsl.transactions.createTransaction({alias: 'transaction4', date: '2017-06-04', account: 'account1', amount: -400});
            await dsl.transactions.createTransaction({alias: 'transaction5', date: '2017-06-05', account: 'account2', amount: 500});

            await dsl.transactions.verifyTransactions({
                from: '2017-06-02',
                expectPriorBalance: 0,
                expectHasMore: false,
                expectTransactions: [
                    'transaction5',
                    'transaction4',
                    'transaction3',
                    'transaction2',
                ],
                transactionCount: 4,
            });
            await dsl.transactions.verifyTransactions({
                to: '2017-06-04',
                expectPriorBalance: 0,
                expectHasMore: false,
                expectTransactions: [
                    'transaction4',
                    'transaction3',
                    'transaction2',
                    'transaction1',
                    'account2',
                    'account1',
                ],
                transactionCount: 6,
            });
            await dsl.transactions.verifyTransactions({
                from: '2017-06-02',
                to: '2017-06-04',
                expectPriorBalance: 0,
                expectHasMore: false,
                expectTransactions: [
                    'transaction4',
                    'transaction3',
                    'transaction2',
                ],
                transactionCount: 3,
            });
        });

        it('should filter by category', async function() {
            await dsl.categories.createCategory({alias: 'category1'});
            await dsl.categories.createCategory({alias: 'category2'});
            await dsl.categories.createCategory({alias: 'category3'});
            await dsl.categories.createCategory({alias: 'category1a', parent: 'category1'});
            await dsl.accounts.createAccount({alias: 'account2', date: '2017-05-29'});
            await dsl.transactions.createTransaction({alias: 'transaction1', date: '2017-06-01', account: 'account1', category: 'category1', amount: 100});
            await dsl.transactions.createTransaction({alias: 'transaction2', date: '2017-06-02', account: 'account2', category: 'category2', amount: 200});
            await dsl.transactions.createTransaction({alias: 'transaction3', date: '2017-06-03', account: 'account1', category: 'category3', amount: 300});
            await dsl.transactions.createTransaction({alias: 'transaction4', date: '2017-06-04', account: 'account1', category: 'category1', amount: -400});
            await dsl.transactions.createTransaction({alias: 'transaction5', date: '2017-06-05', account: 'account2', category: 'category1a', amount: 500});

            await dsl.transactions.verifyTransactions({
                categories: ['category1', 'category2'],
                expectPriorBalance: 0,
                expectHasMore: false,
                expectTransactions: [
                    'transaction4',
                    'transaction2',
                    'transaction1',
                ],
                transactionCount: 3,
            });
        });
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
            await dsl.transactions.modifyTransaction({alias: 'transaction', type: 'transfer', toAccount: '<noAccount>', statusCode: 400});
        });

        it('should reject creating a transaction when toAccountId and accountId are the same', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction', type: 'transfer', account: 'account1', toAccount: 'account1', amount: -100, statusCode: 400});
        });

        it('should reject modifying a transaction when toAccountId and accountId are the same', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction', type: 'transfer', account: 'account1', toAccount: 'account2', amount: -100});
            await dsl.transactions.modifyTransaction({alias: 'transaction', type: 'expense', toAccount: 'account1', statusCode: 400});
            await dsl.transactions.verifyTransaction({alias: 'transaction'});
        });

        it('should reject creating transfer without toAccountId', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction', type: 'transfer', account: 'account1', amount: -100, statusCode: 400});
        });

        it('should reject making a transaction a transfer without specifying a toAcccountId', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction', type: 'expense', account: 'account1', amount: 100});
            await dsl.transactions.modifyTransaction({alias: 'transaction', type: 'transfer', statusCode: 400});
        });

        it('should reject modifying a transfer to remove toAccountId without changing type', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction', type: 'transfer', account: 'account1', toAccount: 'account2', amount: -100});
            await dsl.transactions.modifyTransaction({alias: 'transaction', toAccount: null, statusCode: 400});
        });

        it('should reject creating a transaction with toAccountId without type being transfer', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction', type: 'expense', account: 'account1', toAccount: 'account2', amount: -100, statusCode: 400});
        });

        it('should reject adding a toAcccountId to a transaction without making it a transfer', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction', type: 'expense', account: 'account1', amount: 100});
            await dsl.transactions.modifyTransaction({alias: 'transaction', toAccount: 'account2', statusCode: 400});
        });

        it('should reject changing type from transfer without removing toAccountId', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction', type: 'transfer', account: 'account1', toAccount: 'account2', amount: -100});
            await dsl.transactions.modifyTransaction({alias: 'transaction', type: 'expense', statusCode: 400});
        });
    });

    describe('Earmark Spending', function() {
        beforeEach(async function() {
            await dsl.earmarks.createEarmark({alias: 'earmark'});
        });

        it('should allow adding earmark to new transaction', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction', type: 'expense', account: 'account1', amount: -100, earmark: 'earmark'});
            await dsl.transactions.verifyTransaction({alias: 'transaction'});
        });

        it('should allow adding earmark when modifying transaction', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction', type: 'expense', account: 'account1', amount: -100});
            await dsl.transactions.modifyTransaction({alias: 'transaction', type: 'expense', account: 'account1', amount: -100, earmark: 'earmark'});
            await dsl.transactions.verifyTransaction({alias: 'transaction'});
        });

        it('should not allow creating transaction with unknown earmark account', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction', type: 'expense', account: 'account1', amount: -100, earmark: '<unknown>', statusCode: 400});
        });

        it('should not allow creating transaction with non-earmark account', async function() {
            await dsl.accounts.createAccount({alias: 'account2'});
            await dsl.transactions.createTransaction({alias: 'transaction', type: 'expense', account: 'account1', amount: -100, earmark: 'account2', statusCode: 400});
        });

        it('should not allow modifying transaction with unknown earmark account', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction', type: 'expense', account: 'account1', amount: -100});
            await dsl.transactions.modifyTransaction({alias: 'transaction', type: 'expense', account: 'account1', amount: -100, earmark: '<unknown>', statusCode: 400});
        });

        it('should not allow modifying transaction with non-earmark account', async function() {
            await dsl.accounts.createAccount({alias: 'account2'});
            await dsl.transactions.createTransaction({alias: 'transaction', type: 'expense', account: 'account1', amount: -100});
            await dsl.transactions.modifyTransaction({alias: 'transaction', type: 'expense', account: 'account1', amount: -100, earmark: 'account2', statusCode: 400});
        });

        it('should find transactions with an earmark', async function() {
            await dsl.accounts.createAccount({alias: 'account2'});
            await dsl.earmarks.createEarmark({alias: 'earmark2'});
            await dsl.transactions.createTransaction({alias: 'transaction1', type: 'expense', account: 'account1', amount: -100, date: '2017-06-01', earmark: 'earmark'});
            await dsl.transactions.createTransaction({alias: 'transaction2', type: 'expense', account: 'account2', amount: -500, date: '2017-06-02', earmark: 'earmark'});
            await dsl.transactions.createTransaction({alias: 'transaction3', type: 'expense', account: 'account2', amount: -500, date: '2017-06-03', earmark: 'earmark2'});
            await dsl.transactions.createTransaction({alias: 'transaction4', type: 'expense', account: 'account2', amount: -500, date: '2017-06-04'});

            await dsl.transactions.verifyTransactions({
                earmark: 'earmark',
                expectPriorBalance: 0,
                expectHasMore: false,
                expectTransactions: [
                    'transaction2',
                    'transaction1',
                ],
                transactionCount: 2,
            });
        });

        it('should allow adding income transaction to earmark without an account ID', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction1', type: 'income', amount: 100, date: '2017-06-01', earmark: 'earmark'});
            await dsl.transactions.verifyTransactions({
                earmark: 'earmark',
                expectPriorBalance: 0,
                expectHasMore: false,
                expectTransactions: [
                    'transaction1',
                ],
                transactionCount: 1,
            });
        });

        it('should allow modifying income transaction for earmark without an account ID', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction1', type: 'income', amount: 100, date: '2017-06-01', earmark: 'earmark'});
            await dsl.transactions.modifyTransaction({alias: 'transaction1', type: 'income', amount: 300, date: '2017-06-03', earmark: 'earmark'});
            await dsl.transactions.verifyTransactions({
                earmark: 'earmark',
                expectPriorBalance: 0,
                expectHasMore: false,
                expectTransactions: [
                    'transaction1',
                ],
                transactionCount: 1,
            });
        });
    });
});