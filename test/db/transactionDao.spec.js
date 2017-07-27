const db = require('../../src/db/database');
const dbTestUtils = require('../utils/dbTestUtils');
const TransactionDao = require('../../src/db/transactionDao');
const assert = require('chai').assert;
const idGenerator = require('../../src/utils/idGenerator');

describe('Transaction DAO', function() {
    let connection;
    let transactionDao;
    let userId;
    const minimalTransaction = {
        id: 'transaction1',
        type: 'expense',
        date: '2017-06-04',
        accountId: 'account-id',
        amount: 5000,
    };

    beforeEach(async function() {
        userId = idGenerator();
        connection = dbTestUtils.createConnection();
        transactionDao = new TransactionDao(dbTestUtils.queryFunction(connection));
    });

    afterEach(async function() {
        await dbTestUtils.deleteData(userId);
        connection.destroy();
    });

    it('should round trip a transaction', async function() {
        const transaction = {
            id: 'transaction1',
            type: 'expense',
            date: '2017-06-04',
            accountId: 'account-id',
            payee: 'Con the Fruiterer',
            amount: 5000,
            notes: 'Bought some apple. No worries!',
            categoryId: 'category-id',
            toAccountId: 'account-2',
            recurEvery: 2,
            recurPeriod: 'MONTH'
        };
        await transactionDao.create(userId, transaction);
        const result = await transactionDao.transaction(userId, transaction.id);
        assert.deepEqual(result, transaction);
        assert.deepEqual(await transactionDao.transactions(userId, {accountId: 'account-id', scheduled: true}), [transaction]);
    });

    it('should create transaction with minimal required values', async function() {
        await transactionDao.create(userId, minimalTransaction);
        const result = await transactionDao.transaction(userId, minimalTransaction.id);
        assert.deepEqual(result, minimalTransaction);
    });

    it('should return undefined when transaction does not exist', async function() {
        const transaction = await transactionDao.transaction(userId, 'nope');
        assert.isUndefined(transaction);
    });

    it('should return undefined when transaction belongs to a different user', async function() {
        await transactionDao.create(userId, minimalTransaction);
        const transaction = await transactionDao.transaction('someone else', minimalTransaction.id);
        assert.isUndefined(transaction);
    });

    it('should update transaction', async function() {
        const originalTransaction = makeTransaction({payee: 'Jenny', notes: 'Some notes'});
        await transactionDao.create(userId, originalTransaction);
        const modifiedTransaction = makeTransaction({
            id: originalTransaction.id,
            date: '2011-02-03',
            accountId: 'foo',
            payee: 'Lucy',
            notes: 'New notes',
            amount: 12345,
            type: 'income',
            categoryId: '3',
            toAccountId: '7',
            recurEvery: 3,
            recurPeriod: 'YEAR',
        });
        await transactionDao.store(userId, modifiedTransaction);
        assert.deepEqual(await transactionDao.transaction(userId, originalTransaction.id), modifiedTransaction);
    });

    it('should delete transaction', async function() {
        await transactionDao.create(userId, minimalTransaction);
        await transactionDao.delete(userId, minimalTransaction.id);
        assert.isUndefined(await transactionDao.transaction(userId, minimalTransaction.id));
    });

    it('should get list of transactions in account ordered by date descending', async function() {
        const transaction1 = makeTransaction({amount: 5000, date: '2017-06-01'});
        const transaction2 = makeTransaction({amount: -2000, date: '2017-05-30'});
        const transaction3 = makeTransaction({amount: 300, date: '2017-06-03'});
        await transactionDao.create(userId, transaction1);
        await transactionDao.create(userId, transaction2);
        await transactionDao.create(userId, transaction3);

        const transactions = await transactionDao.transactions(userId, {accountId: minimalTransaction.accountId});
        assert.deepEqual(transactions, [transaction3, transaction1, transaction2]);
    });

    it('should include transfer to the account in the list of transactions', async function() {
        const transaction1 = makeTransaction({amount: 5000, date: '2017-06-01'});
        const transaction2 = makeTransaction({accountId: 'otherAccount', type: 'transfer', toAccountId: minimalTransaction.accountId, amount: -2000, date: '2017-05-30'});
        const transaction3 = makeTransaction({amount: 300, date: '2017-06-03'});
        await transactionDao.create(userId, transaction1);
        await transactionDao.create(userId, transaction2);
        await transactionDao.create(userId, transaction3);

        const transactions = await transactionDao.transactions(userId, {accountId: minimalTransaction.accountId});
        assert.deepEqual(transactions, [
            transaction3,
            transaction1,
            makeTransaction({id: transaction2.id, accountId: minimalTransaction.accountId, type: 'transfer', toAccountId: 'otherAccount', amount: 2000, date: '2017-05-30'}),
        ]);
    });

    it('should exclude scheduled transactions', async function() {
        const transaction1 = makeTransaction({amount: 5000, date: '2017-06-01'});
        const transaction2 = makeTransaction({amount: -2000, date: '2017-05-30', recurEvery: 1, recurPeriod: 'MONTH'});
        const transaction3 = makeTransaction({amount: 300, date: '2017-06-03'});
        await transactionDao.create(userId, transaction1);
        await transactionDao.create(userId, transaction2);
        await transactionDao.create(userId, transaction3);

        const transactions = await transactionDao.transactions(userId, {accountId: minimalTransaction.accountId});
        assert.deepEqual(transactions, [
            transaction3,
            transaction1,
        ]);
    });

    it('should query all scheduled transactions in any account', async function() {
        const transaction1 = makeTransaction({amount: 5000, date: '2017-06-01', recurEvery: 1, recurPeriod: 'MONTH', accountId: 'account1'});
        const transaction2 = makeTransaction({amount: -2000, date: '2017-05-30', recurEvery: 1, recurPeriod: 'MONTH', accountId: 'account2'});
        const transaction3 = makeTransaction({amount: 300, date: '2017-06-03', accountId: 'account1'});
        const transaction4 = makeTransaction({amount: -2000, date: '2017-06-02', toAccountId: 'account1', recurEvery: 1, recurPeriod: 'MONTH', accountId: 'account2'});
        await transactionDao.create(userId, transaction1);
        await transactionDao.create(userId, transaction2);
        await transactionDao.create(userId, transaction3);
        await transactionDao.create(userId, transaction4);

        const transactions = await transactionDao.transactions(userId, {scheduled: true});
        assert.deepEqual(transactions, [
            transaction4,
            transaction1,
            transaction2,
        ]);
    });

    it('should return empty list when no transactions in account', async function() {
        const transactions = await transactionDao.transactions(userId, {accountId: minimalTransaction.accountId});
        assert.deepEqual(transactions, []);
    });

    it('should calculate account balance', async function() {
        await transactionDao.create(userId, makeTransaction({amount: 5000}));
        await transactionDao.create(userId, makeTransaction({amount: -2000}));
        await transactionDao.create(userId, makeTransaction({amount: 300}));

        const balance = await transactionDao.balance(userId, minimalTransaction.accountId);
        assert.equal(balance, 3300);
    });

    it('should return 0 balance when there are no transactions', async function() {
        const balance = await transactionDao.balance(userId, minimalTransaction.accountId);
        assert.equal(balance, 0);
    });

    it('should add negative amount of transfers to account when calculating balance', async function() {
        await transactionDao.create(userId, makeTransaction({amount: 5000,}));
        await transactionDao.create(userId, makeTransaction({amount: -2000, accountId: 'otherAccount', toAccountId: minimalTransaction.accountId}));
        await transactionDao.create(userId, makeTransaction({amount: 300}));

        const balance = await transactionDao.balance(userId, minimalTransaction.accountId);
        assert.equal(balance, 7300);
    });

    it('should exclude scheduled transactions when calculating balance', async function() {
        const transaction1 = makeTransaction({amount: 5000, date: '2017-06-01'});
        const transaction2 = makeTransaction({amount: -2000, date: '2017-05-30', recurEvery: 1, recurPeriod: 'MONTH'});
        const transaction3 = makeTransaction({amount: 300, date: '2017-06-03'});
        await transactionDao.create(userId, transaction1);
        await transactionDao.create(userId, transaction2);
        await transactionDao.create(userId, transaction3);

        const balance = await transactionDao.balance(userId, minimalTransaction.accountId);
        assert.equal(balance, 5300);
    });

    describe('Income and Expense', function() {
        beforeEach(async function() {
            await transactionDao.create(userId, makeTransaction({date: '2017-05-31', type: 'income', amount: 1000}));
            await transactionDao.create(userId, makeTransaction({date: '2017-05-31', type: 'expense', amount: -5000}));

            await transactionDao.create(userId, makeTransaction({date: '2017-06-03', type: 'income', amount: -10}));
            await transactionDao.create(userId, makeTransaction({date: '2017-06-30', type: 'income', amount: 100}));
            await transactionDao.create(userId, makeTransaction({date: '2017-06-30', type: 'expense', amount: -50}));
            
            await transactionDao.create(userId, makeTransaction({date: '2017-07-01', type: 'openingBalance', amount: 500}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-01', type: 'income', amount: 500}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-01', type: 'expense', amount: -250}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-15', type: 'expense', amount: -600}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-31', type: 'expense', amount: -700}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-31', type: 'income', amount: 300}));
        });

        it('should get income and expense grouped by month', async function() {
            assert.deepEqual(await transactionDao.incomeAndExpense(userId, 31, '2017-01-01'), [
                {start: '2017-05-31', end: '2017-05-31', income: 1000, expense: -5000, profit: -4000},
                {start: '2017-06-03', end: '2017-06-30', income: 90, expense: -50, profit: 40},
                {start: '2017-07-01', end: '2017-07-31', income: 800, expense: -1550, profit: -750},
            ]);
        });

        it('should get income and expense grouped by month using arbitrary month start offset', async function() {
            assert.deepEqual(await transactionDao.incomeAndExpense(userId, 15, '2017-01-01'), [
                {start: '2017-05-31', end: '2017-06-03', income: 990, expense: -5000, profit: -4010},
                {start: '2017-06-30', end: '2017-07-15', income: 600, expense: -900, profit: -300},
                {start: '2017-07-31', end: '2017-07-31', income: 300, expense: -700, profit: -400},
            ]);
        });
    });

    function makeTransaction(args, template = minimalTransaction) {
        return Object.assign({}, template, {id: idGenerator()}, args);
    }
});